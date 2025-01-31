package io.openbas.scheduler.jobs;

import static java.time.Instant.now;
import static java.util.Optional.ofNullable;
import static java.util.stream.Collectors.groupingBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.openbas.asset.QueueService;
import io.openbas.database.model.*;
import io.openbas.database.model.InjectStatus;
import io.openbas.database.repository.*;
import io.openbas.execution.ExecutableInject;
import io.openbas.execution.ExecutionExecutorService;
import io.openbas.helper.InjectHelper;
import io.openbas.rest.inject.service.InjectStatusService;
import jakarta.annotation.Resource;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.stereotype.Component;

@Component
@DisallowConcurrentExecution
@RequiredArgsConstructor
public class InjectsExecutionJob implements Job {

  private static final Logger LOGGER = Logger.getLogger(InjectsExecutionJob.class.getName());

  private final ApplicationContext context;
  private final InjectHelper injectHelper;
  private final InjectRepository injectRepository;
  private final InjectorRepository injectorRepository;
  private final InjectStatusRepository injectStatusRepository;
  private final ExerciseRepository exerciseRepository;
  private final QueueService queueService;
  private final ExecutionExecutorService executionExecutorService;
  private final InjectDependenciesRepository injectDependenciesRepository;
  private final InjectExpectationRepository injectExpectationRepository;
  private final InjectStatusService injectStatusService;

  private final List<ExecutionStatus> executionStatusesNotReady =
      List.of(
          ExecutionStatus.QUEUING,
          ExecutionStatus.DRAFT,
          ExecutionStatus.EXECUTING,
          ExecutionStatus.PENDING);

  private final List<InjectExpectation.EXPECTATION_STATUS> expectationStatusesSuccess =
      List.of(InjectExpectation.EXPECTATION_STATUS.SUCCESS);

  @Resource protected ObjectMapper mapper;

  @PersistenceContext private EntityManager entityManager;

  @Autowired
  public void setEntityManager(EntityManager entityManager) {
    this.entityManager = entityManager;
  }

  public void handleAutoStartExercises() {
    List<Exercise> exercises = exerciseRepository.findAllShouldBeInRunningState(now());
    exerciseRepository.saveAll(
        exercises.stream()
            .peek(
                exercise -> {
                  exercise.setStatus(ExerciseStatus.RUNNING);
                  exercise.setUpdatedAt(now());
                })
            .toList());
  }

  public void handleAutoClosingExercises() {
    // Change status of finished exercises.
    List<Exercise> mustBeFinishedExercises = exerciseRepository.thatMustBeFinished();
    exerciseRepository.saveAll(
        mustBeFinishedExercises.stream()
            .peek(
                exercise -> {
                  exercise.setStatus(ExerciseStatus.FINISHED);
                  exercise.setEnd(now());
                  exercise.setUpdatedAt(now());
                })
            .toList());
  }

  private void executeExternal(ExecutableInject executableInject) {
    Inject inject = executableInject.getInjection().getInject();
    inject
        .getInjectorContract()
        .ifPresent(
            injectorContract -> {
              Injection source = executableInject.getInjection();
              try {
                Inject executingInject = injectRepository.findById(source.getId()).orElseThrow();
                String jsonInject = mapper.writeValueAsString(executableInject);
                queueService.publish(injectorContract.getInjector().getType(), jsonInject);
                InjectStatus injectRunningStatus = executingInject.getStatus().orElseThrow();
                injectRunningStatus.setName(ExecutionStatus.PENDING);
                injectStatusRepository.save(injectRunningStatus);
              } catch (Exception e) {
                injectStatusService.failInjectStatus(source.getId(), e.getMessage());
              }
            });
  }

  private void executeInternal(ExecutableInject executableInject) {
    Injection source = executableInject.getInjection();
    // Execute
    source
        .getInject()
        .getInjectorContract()
        .ifPresent(
            injectorContract -> {
              io.openbas.executors.Injector executor =
                  context.getBean(
                      injectorContract.getInjector().getType(),
                      io.openbas.executors.Injector.class);
              Execution execution = executor.executeInjection(executableInject);
              // After execution, expectations are already created
              // Injection status is filled after complete execution
              // Report inject execution
              Inject executedInject = injectRepository.findById(source.getId()).orElseThrow();
              InjectStatus completeStatus =
                  injectStatusService.fromExecution(execution, executedInject);
              executedInject.setUpdatedAt(now());
              executedInject.setStatus(completeStatus);
              injectRepository.save(executedInject);
            });
  }

  private void executeInject(ExecutableInject executableInject) {
    // Depending on injector type (internal or external) execution must be done differently
    Inject inject = executableInject.getInjection().getInject();

    // We are now checking if we depend on another inject and if it did not failed
    Optional<List<String>> errorMessages = Optional.empty();
    if (ofNullable(executableInject.getExerciseId()).isPresent()) {
      errorMessages = getErrorMessagesPreExecution(executableInject.getExerciseId(), inject);
    }
    if (errorMessages != null && errorMessages.isPresent()) {
      InjectStatus finalStatus = injectStatusService.failInjectStatus(inject.getId(), null);
      errorMessages
          .get()
          .forEach(errorMsg -> finalStatus.addErrorTrace(errorMsg, ExecutionTraceAction.COMPLETE));
      injectStatusRepository.save(finalStatus);
    } else {
      setInjectStatusAndExecuteInject(executableInject, inject);
    }
  }

  private void setInjectStatusAndExecuteInject(ExecutableInject executableInject, Inject inject) {
    inject
        .getInjectorContract()
        .ifPresentOrElse(
            injectorContract -> {
              if (!inject.isReady()) {
                injectStatusService.failInjectStatus(
                    inject.getId(),
                    "The inject is not ready to be executed (missing mandatory fields)");
                return;
              }

              Injector externalInjector =
                  injectorRepository
                      .findByType(injectorContract.getInjector().getType())
                      .orElseThrow();
              LOGGER.log(Level.INFO, "Executing inject " + inject.getInject().getTitle());
              // Executor logics
              ExecutableInject newExecutableInject = executableInject;
              if (Boolean.TRUE.equals(injectorContract.getNeedsExecutor())) {
                // Status
                InjectStatus injectStatus =
                    injectStatusService.initializeInjectStatus(
                        inject.getId(), ExecutionStatus.EXECUTING, null);
                inject.setStatus(injectStatus);
                try {
                  newExecutableInject =
                      this.executionExecutorService.launchExecutorContext(executableInject, inject);

                } catch (Exception e) {
                  injectStatusService.failInjectStatus(inject.getId(), e.getMessage());
                  return;
                }
              }
              if (externalInjector.isExternal()) {
                executeExternal(newExecutableInject);
              } else {
                executeInternal(newExecutableInject);
              }
            },
            () ->
                injectStatusService.failInjectStatus(
                    inject.getId(), "Inject does not have a contract"));
  }

  /**
   * Get error messages if pre execution conditions are not met
   *
   * @param exerciseId the id of the exercise
   * @param inject the inject to check
   * @return an optional of list of error message
   */
  private Optional<List<String>> getErrorMessagesPreExecution(String exerciseId, Inject inject) {
    List<InjectDependency> injectDependencies =
        injectDependenciesRepository.findParents(List.of(inject.getId()));
    if (!injectDependencies.isEmpty()) {
      List<Inject> parents =
          injectDependencies.stream()
              .map(injectDependency -> injectDependency.getCompositeId().getInjectParent())
              .toList();

      Map<String, Boolean> mapCondition =
          getStringBooleanMap(parents, exerciseId, injectDependencies);

      List<String> results = null;

      for (InjectDependency injectDependency : injectDependencies) {
        String expressionToEvaluate = injectDependency.getInjectDependencyCondition().toString();
        List<String> conditions =
            injectDependency.getInjectDependencyCondition().getConditions().stream()
                .map(InjectDependencyConditions.Condition::toString)
                .toList();
        for (String condition : conditions) {
          expressionToEvaluate =
              expressionToEvaluate.replaceAll(
                  condition.split("==")[0].trim(),
                  String.format("#this['%s']", condition.split("==")[0].trim()));
        }

        ExpressionParser parser = new SpelExpressionParser();
        Expression exp = parser.parseExpression(expressionToEvaluate);
        boolean canBeExecuted = Boolean.TRUE.equals(exp.getValue(mapCondition, Boolean.class));
        if (!canBeExecuted) {
          if (results == null) {
            results = new ArrayList<>();
            results.add(
                "This inject depends on other injects expectations that are not met. The following conditions were not as expected : ");
          }
          results.addAll(
              labelFromCondition(
                  injectDependency.getCompositeId().getInjectParent(),
                  injectDependency.getInjectDependencyCondition()));
        }
      }
      return results == null ? Optional.empty() : Optional.of(results);
    }
    return Optional.empty();
  }

  /**
   * Get a map containing the expectations and if they are met or not
   *
   * @param parents the parents injects
   * @param exerciseId the id of the exercise
   * @param injectDependencies the list of dependencies
   * @return a map of expectations and their value
   */
  private @NotNull Map<String, Boolean> getStringBooleanMap(
      List<Inject> parents, String exerciseId, List<InjectDependency> injectDependencies) {
    Map<String, Boolean> mapCondition = new HashMap<>();

    injectDependencies.forEach(
        injectDependency -> {
          injectDependency
              .getInjectDependencyCondition()
              .getConditions()
              .forEach(
                  condition -> {
                    mapCondition.put(condition.getKey(), false);
                  });
        });

    parents.forEach(
        parent -> {
          mapCondition.put(
              "Execution",
              parent.getStatus().isPresent()
                  && !ExecutionStatus.ERROR.equals(parent.getStatus().get().getName())
                  && !executionStatusesNotReady.contains(parent.getStatus().get().getName()));

          List<InjectExpectation> expectations =
              injectExpectationRepository.findAllForExerciseAndInject(exerciseId, parent.getId());
          expectations.forEach(
              injectExpectation -> {
                String name =
                    StringUtils.capitalize(injectExpectation.getType().toString().toLowerCase());
                if (injectExpectation.getType().equals(InjectExpectation.EXPECTATION_TYPE.MANUAL)) {
                  name = injectExpectation.getName();
                }
                if (InjectExpectation.EXPECTATION_TYPE.CHALLENGE.equals(injectExpectation.getType())
                    || InjectExpectation.EXPECTATION_TYPE.ARTICLE.equals(
                        injectExpectation.getType())) {
                  if (injectExpectation.getUser() == null && injectExpectation.getScore() != null) {
                    mapCondition.put(
                        name, injectExpectation.getScore() >= injectExpectation.getExpectedScore());
                  }
                } else {
                  mapCondition.put(
                      name, expectationStatusesSuccess.contains(injectExpectation.getResponse()));
                }
              });
        });
    return mapCondition;
  }

  private List<String> labelFromCondition(
      Inject injectParent, InjectDependencyConditions.InjectDependencyCondition condition) {
    List<String> result = new ArrayList<>();
    for (InjectDependencyConditions.Condition conditionElement : condition.getConditions()) {
      result.add(
          String.format(
              "Inject '%s' - %s is %s",
              injectParent.getTitle(), conditionElement.getKey(), conditionElement.isValue()));
    }
    return result;
  }

  public void updateExercise(String exerciseId) {
    Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
    exercise.setUpdatedAt(now());
    exerciseRepository.save(exercise);
  }

  @Override
  public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
    try {
      // Handle starting exercises if needed.
      handleAutoStartExercises();
      // Get all injects to execute grouped by exercise.
      List<ExecutableInject> injects = injectHelper.getInjectsToRun();
      Map<String, List<ExecutableInject>> byExercises =
          injects.stream()
              .collect(
                  groupingBy(
                      ex ->
                          ex.getInjection().getExercise() == null
                              ? "atomic"
                              : ex.getInjection().getExercise().getId()));
      // Execute injects in parallel for each exercise.
      byExercises.forEach(
          (exercise, executableInjects) -> {
            // Execute each inject for the exercise in order.
            executableInjects.forEach(this::executeInject);
            // Update the exercise
            if (!exercise.equals("atomic")) {
              updateExercise(exercise);
            }
          });
      // Change status of finished exercises.
      handleAutoClosingExercises();
    } catch (Exception e) {
      LOGGER.log(Level.SEVERE, e.getMessage(), e);
      throw new JobExecutionException(e);
    }
  }
}
