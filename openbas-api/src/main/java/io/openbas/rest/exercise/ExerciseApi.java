package io.openbas.rest.exercise;

import static io.openbas.config.SessionHelper.currentUser;
import static io.openbas.database.model.User.ROLE_ADMIN;
import static io.openbas.database.model.User.ROLE_USER;
import static io.openbas.database.specification.ExerciseSpecification.findGrantedFor;
import static io.openbas.database.specification.TeamSpecification.fromExercise;
import static io.openbas.helper.StreamHelper.fromIterable;
import static io.openbas.helper.StreamHelper.iterableToSet;
import static io.openbas.rest.exercise.form.SimulationDetails.fromRawExercise;
import static io.openbas.utils.pagination.PaginationUtils.buildPaginationCriteriaBuilder;
import static java.time.Duration.between;
import static java.time.Instant.now;
import static java.time.temporal.ChronoUnit.MINUTES;

import io.openbas.aop.LogExecutionTime;
import io.openbas.database.model.*;
import io.openbas.database.raw.*;
import io.openbas.database.repository.*;
import io.openbas.database.specification.*;
import io.openbas.rest.exception.ElementNotFoundException;
import io.openbas.rest.exception.InputValidationException;
import io.openbas.rest.exercise.exports.*;
import io.openbas.rest.exercise.form.*;
import io.openbas.rest.exercise.response.ExercisesGlobalScoresOutput;
import io.openbas.rest.exercise.service.ExerciseService;
import io.openbas.rest.exercise.service.ExportService;
import io.openbas.rest.helper.RestBehavior;
import io.openbas.rest.inject.form.InjectExpectationResultsByAttackPattern;
import io.openbas.rest.inject.service.InjectService;
import io.openbas.rest.team.output.TeamOutput;
import io.openbas.service.*;
import io.openbas.telemetry.Tracing;
import io.openbas.utils.AtomicTestingUtils.ExpectationResultsByType;
import io.openbas.utils.ResultUtils;
import io.openbas.utils.pagination.SearchPaginationInput;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.persistence.criteria.Join;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@Secured(ROLE_USER)
@RequiredArgsConstructor
public class ExerciseApi extends RestBehavior {

  public static final String EXERCISE_URI = "/api/exercises";

  // region repositories
  private final LogRepository logRepository;
  private final TagRepository tagRepository;
  private final UserRepository userRepository;
  private final PauseRepository pauseRepository;
  private final DocumentRepository documentRepository;
  private final ExerciseRepository exerciseRepository;
  private final TeamRepository teamRepository;
  private final ExerciseTeamUserRepository exerciseTeamUserRepository;
  private final LogRepository exerciseLogRepository;
  private final ComcheckRepository comcheckRepository;
  private final ImportService importService;
  private final LessonsCategoryRepository lessonsCategoryRepository;
  private final LessonsQuestionRepository lessonsQuestionRepository;
  private final LessonsAnswerRepository lessonsAnswerRepository;
  private final InjectStatusRepository injectStatusRepository;
  private final InjectRepository injectRepository;
  private final ObjectiveRepository objectiveRepository;
  private final EvaluationRepository evaluationRepository;
  private final KillChainPhaseRepository killChainPhaseRepository;
  private final GrantRepository grantRepository;
  // endregion

  // region services
  private final FileService fileService;
  private final InjectService injectService;
  private final ChallengeService challengeService;
  private final VariableService variableService;
  private final ExerciseService exerciseService;
  private final TeamService teamService;
  private final ExportService exportService;

  // endregion

  // region logs
  @GetMapping(EXERCISE_URI + "/{exercise}/logs")
  public Iterable<Log> logs(@PathVariable String exercise) {
    return exerciseLogRepository.findAll(ExerciseLogSpecification.fromExercise(exercise));
  }

  @PostMapping(EXERCISE_URI + "/{exerciseId}/logs")
  @Transactional(rollbackFor = Exception.class)
  public Log createLog(@PathVariable String exerciseId, @Valid @RequestBody LogCreateInput input) {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    Log log = new Log();
    log.setUpdateAttributes(input);
    log.setExercise(exercise);
    log.setTags(iterableToSet(tagRepository.findAllById(input.getTagIds())));
    log.setUser(
        userRepository
            .findById(currentUser().getId())
            .orElseThrow(() -> new ElementNotFoundException("Current user not found")));
    return exerciseLogRepository.save(log);
  }

  @PutMapping(EXERCISE_URI + "/{exerciseId}/logs/{logId}")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  @Transactional(rollbackFor = Exception.class)
  public Log updateLog(
      @PathVariable String exerciseId,
      @PathVariable String logId,
      @Valid @RequestBody LogCreateInput input) {
    Log log = logRepository.findById(logId).orElseThrow(ElementNotFoundException::new);
    log.setUpdateAttributes(input);
    log.setTags(iterableToSet(tagRepository.findAllById(input.getTagIds())));
    return logRepository.save(log);
  }

  @DeleteMapping(EXERCISE_URI + "/{exerciseId}/logs/{logId}")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  @Transactional(rollbackFor = Exception.class)
  public void deleteLog(@PathVariable String exerciseId, @PathVariable String logId) {
    logRepository.deleteById(logId);
  }

  // endregion

  // region comchecks
  @GetMapping(EXERCISE_URI + "/{exercise}/comchecks")
  public Iterable<Comcheck> comchecks(@PathVariable String exercise) {
    return comcheckRepository.findAll(ComcheckSpecification.fromExercise(exercise));
  }

  @GetMapping(EXERCISE_URI + "/{exercise}/comchecks/{comcheck}")
  public Comcheck comcheck(@PathVariable String exercise, @PathVariable String comcheck) {
    Specification<Comcheck> filters =
        ComcheckSpecification.fromExercise(exercise).and(ComcheckSpecification.id(comcheck));
    return comcheckRepository.findOne(filters).orElseThrow(ElementNotFoundException::new);
  }

  @GetMapping(EXERCISE_URI + "/{exercise}/comchecks/{comcheck}/statuses")
  public List<ComcheckStatus> comcheckStatuses(
      @PathVariable String exercise, @PathVariable String comcheck) {
    return comcheck(exercise, comcheck).getComcheckStatus();
  }

  // endregion

  // region teams
  @LogExecutionTime
  @GetMapping(EXERCISE_URI + "/{exerciseId}/teams")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  @Tracing(name = "Get teams of the exercise", layer = "api", operation = "GET")
  public List<TeamOutput> getExerciseTeams(@PathVariable String exerciseId) {
    return this.teamService.find(fromExercise(exerciseId));
  }

  @Transactional(rollbackFor = Exception.class)
  @PutMapping(EXERCISE_URI + "/{exerciseId}/teams/remove")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public Iterable<TeamOutput> removeExerciseTeams(
      @PathVariable String exerciseId, @Valid @RequestBody ExerciseUpdateTeamsInput input) {
    return this.exerciseService.removeTeams(exerciseId, input.getTeamIds());
  }

  @Transactional(rollbackFor = Exception.class)
  @PutMapping(EXERCISE_URI + "/{exerciseId}/teams/replace")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public Iterable<TeamOutput> replaceExerciseTeams(
      @PathVariable String exerciseId, @Valid @RequestBody ExerciseUpdateTeamsInput input) {
    return this.exerciseService.replaceTeams(exerciseId, input.getTeamIds());
  }

  @GetMapping(EXERCISE_URI + "/{exerciseId}/players")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  public Iterable<RawPlayer> getPlayersByExercise(@PathVariable String exerciseId) {
    return userRepository.rawPlayersByExerciseId(exerciseId);
  }

  @Transactional(rollbackFor = Exception.class)
  @PutMapping(EXERCISE_URI + "/{exerciseId}/teams/{teamId}/players/enable")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public Exercise enableExerciseTeamPlayers(
      @PathVariable String exerciseId,
      @PathVariable String teamId,
      @Valid @RequestBody ExerciseTeamPlayersEnableInput input) {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    Team team = teamRepository.findById(teamId).orElseThrow(ElementNotFoundException::new);
    input
        .getPlayersIds()
        .forEach(
            playerId -> {
              ExerciseTeamUser exerciseTeamUser = new ExerciseTeamUser();
              exerciseTeamUser.setExercise(exercise);
              exerciseTeamUser.setTeam(team);
              exerciseTeamUser.setUser(
                  userRepository.findById(playerId).orElseThrow(ElementNotFoundException::new));
              exerciseTeamUserRepository.save(exerciseTeamUser);
            });
    return exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
  }

  @Transactional(rollbackFor = Exception.class)
  @PutMapping(EXERCISE_URI + "/{exerciseId}/teams/{teamId}/players/disable")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public Exercise disableExerciseTeamPlayers(
      @PathVariable String exerciseId,
      @PathVariable String teamId,
      @Valid @RequestBody ExerciseTeamPlayersEnableInput input) {
    input
        .getPlayersIds()
        .forEach(
            playerId -> {
              ExerciseTeamUserId exerciseTeamUserId = new ExerciseTeamUserId();
              exerciseTeamUserId.setExerciseId(exerciseId);
              exerciseTeamUserId.setTeamId(teamId);
              exerciseTeamUserId.setUserId(playerId);
              exerciseTeamUserRepository.deleteById(exerciseTeamUserId);
            });
    return exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
  }

  @Transactional(rollbackFor = Exception.class)
  @PutMapping(EXERCISE_URI + "/{exerciseId}/teams/{teamId}/players/add")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public Exercise addExerciseTeamPlayers(
      @PathVariable String exerciseId,
      @PathVariable String teamId,
      @Valid @RequestBody ExerciseTeamPlayersEnableInput input) {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    Team team = teamRepository.findById(teamId).orElseThrow(ElementNotFoundException::new);
    Iterable<User> teamUsers = userRepository.findAllById(input.getPlayersIds());
    team.getUsers().addAll(fromIterable(teamUsers));
    teamRepository.save(team);
    input
        .getPlayersIds()
        .forEach(
            playerId -> {
              ExerciseTeamUser exerciseTeamUser = new ExerciseTeamUser();
              exerciseTeamUser.setExercise(exercise);
              exerciseTeamUser.setTeam(team);
              exerciseTeamUser.setUser(
                  userRepository.findById(playerId).orElseThrow(ElementNotFoundException::new));
              exerciseTeamUserRepository.save(exerciseTeamUser);
            });
    return exercise;
  }

  @PutMapping(EXERCISE_URI + "/{exerciseId}/teams/{teamId}/players/remove")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  @Transactional(rollbackFor = Exception.class)
  public Exercise removeExerciseTeamPlayers(
      @PathVariable String exerciseId,
      @PathVariable String teamId,
      @Valid @RequestBody ExerciseTeamPlayersEnableInput input) {
    Team team = teamRepository.findById(teamId).orElseThrow(ElementNotFoundException::new);
    Iterable<User> teamUsers = userRepository.findAllById(input.getPlayersIds());
    team.getUsers().removeAll(fromIterable(teamUsers));
    teamRepository.save(team);
    input
        .getPlayersIds()
        .forEach(
            playerId -> {
              ExerciseTeamUserId exerciseTeamUserId = new ExerciseTeamUserId();
              exerciseTeamUserId.setExerciseId(exerciseId);
              exerciseTeamUserId.setTeamId(teamId);
              exerciseTeamUserId.setUserId(playerId);
              exerciseTeamUserRepository.deleteById(exerciseTeamUserId);
            });
    return exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
  }

  // endregion

  // region exercises
  @PostMapping(EXERCISE_URI)
  public Exercise createExercise(@Valid @RequestBody ExerciseInput input) {
    if (input == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Exercise input cannot be null");
    }
    Exercise exercise = new Exercise();
    exercise.setUpdateAttributes(input);
    exercise.setTags(iterableToSet(this.tagRepository.findAllById(input.getTagIds())));
    return this.exerciseService.createExercise(exercise);
  }

  @PostMapping(EXERCISE_URI + "/{exerciseId}")
  @Transactional(rollbackFor = Exception.class)
  public Exercise duplicateExercise(@PathVariable @NotBlank final String exerciseId) {
    return exerciseService.getDuplicateExercise(exerciseId);
  }

  @PutMapping(EXERCISE_URI + "/{exerciseId}")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  @Transactional(rollbackFor = Exception.class)
  public Exercise updateExerciseInformation(
      @PathVariable String exerciseId, @Valid @RequestBody UpdateExerciseInput input) {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    Set<Tag> currentTagList = exercise.getTags();
    exercise.setTags(iterableToSet(this.tagRepository.findAllById(input.getTagIds())));
    exercise.setUpdateAttributes(input);
    return exerciseService.updateExercice(exercise, currentTagList, input.isApplyTagRule());
  }

  @PutMapping(EXERCISE_URI + "/{exerciseId}/start_date")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  @Transactional(rollbackFor = Exception.class)
  public Exercise updateExerciseStart(
      @PathVariable String exerciseId, @Valid @RequestBody ExerciseUpdateStartDateInput input)
      throws InputValidationException {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    if (!exercise.getStatus().equals(ExerciseStatus.SCHEDULED)) {
      String message = "Change date is only possible in scheduling state";
      throw new InputValidationException("exercise_start_date", message);
    }
    exercise.setUpdateAttributes(input);
    return exerciseRepository.save(exercise);
  }

  @PutMapping(EXERCISE_URI + "/{exerciseId}/tags")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  @Transactional(rollbackFor = Exception.class)
  public Exercise updateExerciseTags(
      @PathVariable String exerciseId, @Valid @RequestBody ExerciseUpdateTagsInput input) {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    Set<Tag> currentTagList = exercise.getTags();
    exercise.setTags(iterableToSet(tagRepository.findAllById(input.getTagIds())));
    return exerciseService.updateExercice(exercise, currentTagList, input.isApplyTagRule());
  }

  @PutMapping(EXERCISE_URI + "/{exerciseId}/logos")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  @Transactional(rollbackFor = Exception.class)
  public Exercise updateExerciseLogos(
      @PathVariable String exerciseId, @Valid @RequestBody ExerciseUpdateLogoInput input) {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    exercise.setLogoDark(documentRepository.findById(input.getLogoDark()).orElse(null));
    exercise.setLogoLight(documentRepository.findById(input.getLogoLight()).orElse(null));
    return exerciseRepository.save(exercise);
  }

  @PutMapping(EXERCISE_URI + "/{exerciseId}/lessons")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  @Transactional(rollbackFor = Exception.class)
  public Exercise updateExerciseLessons(
      @PathVariable String exerciseId, @Valid @RequestBody LessonsInput input) {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    exercise.setLessonsAnonymized(input.isLessonsAnonymized());
    return exerciseRepository.save(exercise);
  }

  @DeleteMapping(EXERCISE_URI + "/{exerciseId}")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  @Transactional(rollbackFor = Exception.class)
  public void deleteExercise(@PathVariable String exerciseId) {
    exerciseRepository.deleteById(exerciseId);
  }

  @GetMapping(EXERCISE_URI + "/{exerciseId}")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  @Transactional(readOnly = true)
  public SimulationDetails exercise(@PathVariable String exerciseId) {
    // We get the raw exercise
    RawSimulation rawSimulation = exerciseRepository.rawDetailsById(exerciseId);
    // We get the injects linked to this exercise
    List<RawInject> rawInjects =
        injectRepository.findRawByIds(rawSimulation.getInject_ids().stream().distinct().toList());
    // We get the tuple exercise/team/user
    List<RawExerciseTeamUser> listRawExerciseTeamUsers =
        exerciseTeamUserRepository.rawByExerciseIds(List.of(exerciseId));
    // We get the objectives of this exercise
    List<RawObjective> rawObjectives = objectiveRepository.rawByExerciseIds(List.of(exerciseId));
    // We make a map of the Evaluations by objective
    Map<String, List<RawEvaluation>> mapEvaluationsByObjective =
        evaluationRepository
            .rawByObjectiveIds(rawObjectives.stream().map(RawObjective::getObjective_id).toList())
            .stream()
            .collect(Collectors.groupingBy(RawEvaluation::getEvaluation_objective));
    // We make a map of grants of users id by type of grant (Planner, Observer)
    Map<String, List<RawGrant>> rawGrants =
        grantRepository.rawByExerciseIds(List.of(exerciseId)).stream()
            .collect(Collectors.groupingBy(RawGrant::getGrant_name));
    // We get all the kill chain phases
    List<KillChainPhase> killChainPhase =
        StreamSupport.stream(
                killChainPhaseRepository
                    .findAllById(
                        rawInjects.stream()
                            .flatMap(rawInject -> rawInject.getInject_kill_chain_phases().stream())
                            .toList())
                    .spliterator(),
                false)
            .collect(Collectors.toList());

    // We create objectives and fill them with evaluations
    List<Objective> objectives =
        rawObjectives.stream()
            .map(
                rawObjective -> {
                  Objective objective = new Objective();
                  if (mapEvaluationsByObjective.get(rawObjective.getObjective_id()) != null) {
                    objective.setEvaluations(
                        mapEvaluationsByObjective.get(rawObjective.getObjective_id()).stream()
                            .map(
                                rawEvaluation -> {
                                  Evaluation evaluation = new Evaluation();
                                  evaluation.setId(rawEvaluation.getEvaluation_id());
                                  evaluation.setScore(rawEvaluation.getEvaluation_score());
                                  return evaluation;
                                })
                            .toList());
                  }
                  return objective;
                })
            .toList();

    List<ExerciseTeamUser> listExerciseTeamUsers =
        listRawExerciseTeamUsers.stream().map(ExerciseTeamUser::fromRawExerciseTeamUser).toList();

    // We create an ExerciseDetails object and populate it
    SimulationDetails detail = fromRawExercise(rawSimulation, listExerciseTeamUsers, objectives);
    detail.setPlatforms(
        rawInjects.stream()
            .flatMap(inject -> inject.getInject_platforms().stream())
            .distinct()
            .toList());
    detail.setCommunicationsNumber(
        rawInjects.stream()
            .mapToLong(rawInject -> rawInject.getInject_communications().size())
            .sum());
    detail.setKillChainPhases(killChainPhase);
    if (rawGrants.get(Grant.GRANT_TYPE.OBSERVER.name()) != null) {
      detail.setObservers(
          rawGrants.get(Grant.GRANT_TYPE.OBSERVER.name()).stream()
              .map(RawGrant::getUser_id)
              .collect(Collectors.toSet()));
    }
    if (rawGrants.get(Grant.GRANT_TYPE.PLANNER.name()) != null) {
      detail.setPlanners(
          rawGrants.get(Grant.GRANT_TYPE.PLANNER.name()).stream()
              .map(RawGrant::getUser_id)
              .collect(Collectors.toSet()));
    }

    return detail;
  }

  @LogExecutionTime
  @GetMapping(EXERCISE_URI + "/{exerciseId}/results")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  @Tracing(name = "Get the global result for an exercise", layer = "api", operation = "GET")
  public List<ExpectationResultsByType> globalResults(@NotBlank @PathVariable String exerciseId) {
    return exerciseService.getGlobalResults(exerciseId);
  }

  @LogExecutionTime
  @PostMapping(EXERCISE_URI + "/global-scores")
  @Tracing(name = "Get the global scores for exercises", layer = "api", operation = "POST")
  public ExercisesGlobalScoresOutput getExercisesGlobalScores(
      @Valid @RequestBody ExercisesGlobalScoresInput input) {
    return exerciseService.getExercisesGlobalScores(input);
  }

  @LogExecutionTime
  @GetMapping(EXERCISE_URI + "/{exerciseId}/injects/results-by-attack-patterns")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  @Tracing(name = "Get a list of inject results for an exercise", layer = "api", operation = "GET")
  public List<InjectExpectationResultsByAttackPattern> injectResults(
      @NotBlank final @PathVariable String exerciseId) {
    return exerciseRepository
        .findById(exerciseId)
        .map(Exercise::getInjects)
        .map(ResultUtils::computeInjectExpectationResults)
        .orElseThrow(() -> new RuntimeException("Exercise not found with ID: " + exerciseId));
  }

  @DeleteMapping(EXERCISE_URI + "/{exerciseId}/{documentId}")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  @Transactional(rollbackFor = Exception.class)
  public Exercise deleteDocument(@PathVariable String exerciseId, @PathVariable String documentId) {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    exercise.setUpdatedAt(now());
    Document doc =
        documentRepository.findById(documentId).orElseThrow(ElementNotFoundException::new);
    Set<Exercise> docExercises =
        doc.getExercises().stream()
            .filter(ex -> !ex.getId().equals(exerciseId))
            .collect(Collectors.toSet());
    if (docExercises.isEmpty()) {
      // Document is no longer associate to any exercise, delete it
      documentRepository.delete(doc);
      // All associations with this document will be automatically cleanup.
    } else {
      // Document associated to other exercise, cleanup
      doc.setExercises(docExercises);
      documentRepository.save(doc);
      // Delete document from all exercise injects
      injectService.cleanInjectsDocExercise(exerciseId, documentId);
    }
    return exerciseRepository.save(exercise);
  }

  @PutMapping(EXERCISE_URI + "/{exerciseId}/status")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  @Transactional(rollbackFor = Exception.class)
  public Exercise changeExerciseStatus(
      @PathVariable String exerciseId, @Valid @RequestBody ExerciseUpdateStatusInput input) {
    ExerciseStatus status = input.getStatus();
    Exercise exercise =
        this.exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    // Check if next status is possible
    List<ExerciseStatus> nextPossibleStatus = exercise.nextPossibleStatus();
    if (!nextPossibleStatus.contains(status)) {
      throw new UnsupportedOperationException(
          "Exercise cant support moving to status " + status.name());
    }
    // In case of rescheduled of an exercise.
    boolean isCloseState =
        ExerciseStatus.CANCELED.equals(exercise.getStatus())
            || ExerciseStatus.FINISHED.equals(exercise.getStatus());
    if (isCloseState && ExerciseStatus.SCHEDULED.equals(status)) {
      exercise.setStart(null);
      exercise.setEnd(null);
      // Reset pauses
      exercise.setCurrentPause(null);
      pauseRepository.deleteAll(pauseRepository.findAllForExercise(exerciseId));
      // Reset injects outcome, communications and expectations
      this.injectStatusRepository.deleteAllById(
          exercise.getInjects().stream()
              .map(Inject::getStatus)
              .map(i -> i.map(InjectStatus::getId).orElse(""))
              .toList());
      exercise.getInjects().forEach(Inject::clean);
      // Reset lessons learned answers
      List<LessonsAnswer> lessonsAnswers =
          lessonsCategoryRepository
              .findAll(LessonsCategorySpecification.fromExercise(exerciseId))
              .stream()
              .flatMap(
                  lessonsCategory ->
                      lessonsQuestionRepository
                          .findAll(
                              LessonsQuestionSpecification.fromCategory(lessonsCategory.getId()))
                          .stream()
                          .flatMap(
                              lessonsQuestion ->
                                  lessonsAnswerRepository
                                      .findAll(
                                          LessonsAnswerSpecification.fromQuestion(
                                              lessonsQuestion.getId()))
                                      .stream()))
              .toList();
      lessonsAnswerRepository.deleteAll(lessonsAnswers);
      // Delete exercise transient files (communications, ...)
      fileService.deleteDirectory(exerciseId);
    }
    // In case of manual start
    if (ExerciseStatus.SCHEDULED.equals(exercise.getStatus())
        && ExerciseStatus.RUNNING.equals(status)) {
      Instant nextMinute = now().truncatedTo(MINUTES).plus(1, MINUTES);
      exercise.setStart(nextMinute);
    }
    // If exercise move from pause to running state,
    // we log the pause date to be able to recompute inject dates.
    if (ExerciseStatus.PAUSED.equals(exercise.getStatus())
        && ExerciseStatus.RUNNING.equals(status)) {
      Instant lastPause = exercise.getCurrentPause().orElseThrow(ElementNotFoundException::new);
      exercise.setCurrentPause(null);
      Pause pause = new Pause();
      pause.setDate(lastPause);
      pause.setExercise(exercise);
      pause.setDuration(between(lastPause, now()).getSeconds());
      pauseRepository.save(pause);
    }
    // If pause is asked, just set the pause date.
    if (ExerciseStatus.RUNNING.equals(exercise.getStatus())
        && ExerciseStatus.PAUSED.equals(status)) {
      exercise.setCurrentPause(Instant.now());
    }
    // Cancelation
    if (ExerciseStatus.RUNNING.equals(exercise.getStatus())
        && ExerciseStatus.CANCELED.equals(status)) {
      exercise.setEnd(now());
    }
    exercise.setUpdatedAt(now());
    exercise.setStatus(status);
    return exerciseRepository.save(exercise);
  }

  @LogExecutionTime
  @GetMapping(EXERCISE_URI)
  @Tracing(name = "Get a list of exercises", layer = "api", operation = "GET")
  public List<ExerciseSimple> exercises() {
    return exerciseService.exercises();
  }

  @LogExecutionTime
  @PostMapping(EXERCISE_URI + "/search")
  @Tracing(name = "Get a page of exercises", layer = "api", operation = "POST")
  public Page<ExerciseSimple> exercises(
      @RequestBody @Valid final SearchPaginationInput searchPaginationInput) {
    Map<String, Join<Base, Base>> joinMap = new HashMap<>();

    if (currentUser().isAdmin()) {
      return buildPaginationCriteriaBuilder(
          (Specification<Exercise> specification,
              Specification<Exercise> specificationCount,
              Pageable pageable) ->
              this.exerciseService.exercises(specification, specificationCount, pageable, joinMap),
          searchPaginationInput,
          Exercise.class,
          joinMap);

    } else {
      return buildPaginationCriteriaBuilder(
          (Specification<Exercise> specification,
              Specification<Exercise> specificationCount,
              Pageable pageable) ->
              this.exerciseService.exercises(
                  findGrantedFor(currentUser().getId()).and(specification),
                  findGrantedFor(currentUser().getId()).and(specificationCount),
                  pageable,
                  joinMap),
          searchPaginationInput,
          Exercise.class,
          joinMap);
    }
  }

  // endregion

  // region communication
  @GetMapping(EXERCISE_URI + "/{exerciseId}/communications")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  public Iterable<Communication> exerciseCommunications(@PathVariable String exerciseId) {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    List<Communication> communications = new ArrayList<>();
    exercise
        .getInjects()
        .forEach(injectDoc -> communications.addAll(injectDoc.getCommunications()));
    return communications;
  }

  @GetMapping("/api/communications/attachment")
  // @PreAuthorize("isExerciseObserver(#exerciseId)")
  public void downloadAttachment(@RequestParam String file, HttpServletResponse response)
      throws IOException {
    FileContainer fileContainer =
        fileService.getFileContainer(file).orElseThrow(ElementNotFoundException::new);
    response.addHeader(
        HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileContainer.getName());
    response.addHeader(HttpHeaders.CONTENT_TYPE, fileContainer.getContentType());
    response.setStatus(HttpServletResponse.SC_OK);
    fileContainer.getInputStream().transferTo(response.getOutputStream());
  }

  // endregion

  // region import/export
  @GetMapping(EXERCISE_URI + "/{exerciseId}/export")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  public void exerciseExport(
      @NotBlank @PathVariable final String exerciseId,
      @RequestParam(required = false) final boolean isWithTeams,
      @RequestParam(required = false) final boolean isWithPlayers,
      @RequestParam(required = false) final boolean isWithVariableValues,
      HttpServletResponse response)
      throws IOException {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    int exportOptionsMask = ExportOptions.mask(isWithPlayers, isWithTeams, isWithVariableValues);

    byte[] zippedExport = exportService.exportExerciseToZip(exercise, exportOptionsMask);
    String zipName = exportService.getZipFileName(exercise, exportOptionsMask);

    response.addHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + zipName);
    response.addHeader(HttpHeaders.CONTENT_TYPE, "application/zip");
    response.setStatus(HttpServletResponse.SC_OK);
    ServletOutputStream outputStream = response.getOutputStream();
    outputStream.write(zippedExport);
    outputStream.close();
  }

  @PostMapping(EXERCISE_URI + "/import")
  @Secured(ROLE_ADMIN)
  public void exerciseImport(@RequestPart("file") MultipartFile file) throws Exception {
    importService.handleFileImport(file);
  }

  @PostMapping(EXERCISE_URI + "/{exerciseId}/check-rules")
  @ApiResponses(
      value = {
        @ApiResponse(responseCode = "200", description = "Returns whether or not the rules apply")
      })
  @Operation(
      summary = "Check rules",
      description = "Check if the rules apply to a simulation update")
  public CheckExerciseRulesOutput checkIfRuleApplies(
      @PathVariable @NotBlank final String exerciseId,
      @Valid @RequestBody final CheckExerciseRulesInput input) {
    Exercise exercise = this.exerciseService.exercise(exerciseId);
    return CheckExerciseRulesOutput.builder()
        .rulesFound(this.exerciseService.checkIfTagRulesApplies(exercise, input.getNewTags()))
        .build();
  }
  // endregion
}
