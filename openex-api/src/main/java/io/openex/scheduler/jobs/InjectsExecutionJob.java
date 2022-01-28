package io.openex.scheduler.jobs;

import io.openex.database.model.*;
import io.openex.database.repository.DryInjectRepository;
import io.openex.database.repository.ExerciseRepository;
import io.openex.database.repository.InjectRepository;
import io.openex.helper.InjectHelper;
import io.openex.execution.ExecutableInject;
import io.openex.execution.Execution;
import io.openex.execution.Executor;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

import static java.time.Instant.now;
import static java.util.stream.Collectors.groupingBy;

@Component
@DisallowConcurrentExecution
public class InjectsExecutionJob implements Job {

    private ApplicationContext context;
    private InjectHelper injectHelper;
    private DryInjectRepository dryInjectRepository;
    private InjectRepository injectRepository;
    private ExerciseRepository exerciseRepository;

    @Autowired
    public void setInjectRepository(InjectRepository injectRepository) {
        this.injectRepository = injectRepository;
    }

    @Autowired
    public void setDryInjectRepository(DryInjectRepository dryInjectRepository) {
        this.dryInjectRepository = dryInjectRepository;
    }

    @Autowired
    public void setExerciseRepository(ExerciseRepository exerciseRepository) {
        this.exerciseRepository = exerciseRepository;
    }

    @Autowired
    public void setContext(ApplicationContext context) {
        this.context = context;
    }

    @Autowired
    public void setInjectHelper(InjectHelper injectHelper) {
        this.injectHelper = injectHelper;
    }

    @Override
    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        try {
            // Handle starting exercises if needed.
            List<Exercise> exercises = exerciseRepository.findAllShouldBeInRunningState(now());
            exercises.stream().parallel().forEach(exercise -> {
                exercise.setStatus(Exercise.STATUS.RUNNING);
                exerciseRepository.save(exercise);
            });
            List<ExecutableInject<?>> injects = injectHelper.getInjectsToRun();
            // Get all injects to execute grouped by exercise.
            Map<String, List<ExecutableInject<?>>> byExercises = injects.stream()
                    .collect(groupingBy(ex -> ex.getInject().getExercise().getId()));
            // Execute injects in parallel for each exercise.
            byExercises.values().stream().parallel().forEach(executableInjects -> {
                // Execute each inject for the exercise in order.
                executableInjects.forEach(executableInject -> {
                    Injection inject = executableInject.getInject();
                    Class<? extends Executor<?>> executorClass = inject.executor();
                    Executor<? extends Inject> executor = context.getBean(executorClass);
                    Execution execution = executor.execute(executableInject);
                    // Report inject execution
                    if (inject instanceof Inject) {
                        Inject executedInject = injectRepository.findById(inject.getId()).orElseThrow();
                        executedInject.setStatus(InjectStatus.fromExecution(execution, executedInject));
                        injectRepository.save(executedInject);
                    }
                    // Report dry inject execution
                    if (inject instanceof DryInject) {
                        DryInject executedDry = dryInjectRepository.findById(inject.getId()).orElseThrow();
                        executedDry.setStatus(DryInjectStatus.fromExecution(execution, executedDry));
                        dryInjectRepository.save(executedDry);
                    }
                });
            });
            // Change status of finished exercises.
            List<Exercise> mustBeFinishedExercises = exerciseRepository.thatMustBeFinished();
            exerciseRepository.saveAll(mustBeFinishedExercises.stream()
                    .peek(exercise -> exercise.setStatus(Exercise.STATUS.FINISHED)).toList());
        } catch (Exception e) {
            throw new JobExecutionException(e);
        }
    }
}
