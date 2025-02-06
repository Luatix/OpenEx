package io.openbas.rest.scenario;

import static io.openbas.database.model.User.ROLE_ADMIN;
import static io.openbas.database.model.User.ROLE_USER;
import static io.openbas.database.specification.ScenarioSpecification.byName;
import static io.openbas.database.specification.TeamSpecification.fromScenario;
import static io.openbas.helper.StreamHelper.fromIterable;
import static io.openbas.helper.StreamHelper.iterableToSet;
import static java.time.Instant.now;
import static java.time.temporal.ChronoUnit.MINUTES;

import io.openbas.aop.LogExecutionTime;
import io.openbas.aop.UserRoleDescription;
import io.openbas.database.model.*;
import io.openbas.database.raw.RawPaginationScenario;
import io.openbas.database.repository.*;
import io.openbas.rest.exception.ElementNotFoundException;
import io.openbas.rest.exercise.form.LessonsInput;
import io.openbas.rest.exercise.form.ScenarioTeamPlayersEnableInput;
import io.openbas.rest.helper.RestBehavior;
import io.openbas.rest.scenario.form.*;
import io.openbas.rest.team.output.TeamOutput;
import io.openbas.service.ImportService;
import io.openbas.service.ScenarioService;
import io.openbas.service.ScenarioToExerciseService;
import io.openbas.service.TeamService;
import io.openbas.telemetry.Tracing;
import io.openbas.utils.FilterUtilsJpa;
import io.openbas.utils.pagination.SearchPaginationInput;
import io.swagger.v3.oas.annotations.ExternalDocumentation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@Secured(ROLE_USER)
@RequiredArgsConstructor
@UserRoleDescription
@io.swagger.v3.oas.annotations.tags.Tag(
    name = "Scenario management",
    description = "Endpoints to manage scenarios",
    externalDocs =
        @ExternalDocumentation(
            description = "Documentation about scenarios",
            url = "https://docs.openbas.io/latest/usage/scenarios_and_simulations/"))
public class ScenarioApi extends RestBehavior {

  public static final String SCENARIO_URI = "/api/scenarios";

  private final TagRepository tagRepository;
  private final TeamRepository teamRepository;
  private final UserRepository userRepository;
  private final ScenarioRepository scenarioRepository;
  private final ScenarioToExerciseService scenarioToExerciseService;
  private final ImportService importService;
  private final ScenarioService scenarioService;
  private final TeamService teamService;

  @PostMapping(SCENARIO_URI)
  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "The created scenario")})
  @Operation(summary = "Create scenario", description = "Create a scenario")
  public Scenario createScenario(@Valid @RequestBody final ScenarioInput input) {
    if (input == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Scenario input cannot be null");
    }
    Scenario scenario = new Scenario();
    scenario.setUpdateAttributes(input);
    scenario.setTags(iterableToSet(this.tagRepository.findAllById(input.getTagIds())));
    return this.scenarioService.createScenario(scenario);
  }

  @PostMapping(SCENARIO_URI + "/{scenarioId}")
  @ApiResponses(
      value = {@ApiResponse(responseCode = "200", description = "The newly created scenario")})
  @Operation(summary = "Duplicate scenario", description = "Duplicate a scenario")
  public Scenario duplicateScenario(@PathVariable @NotBlank final String scenarioId) {
    return scenarioService.getDuplicateScenario(scenarioId);
  }

  @GetMapping(SCENARIO_URI)
  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "The list of scenarios")})
  @Operation(summary = "List scenarios", description = "List the scenarios")
  public List<ScenarioSimple> scenarios() {
    return this.scenarioService.scenarios();
  }

  @LogExecutionTime
  @PostMapping(SCENARIO_URI + "/search")
  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "The list of scenarios")})
  @Operation(summary = "Search scenarios", description = "Search the scenarios")
  @Tracing(name = "Get a page of scenarios", layer = "api", operation = "POST")
  public Page<RawPaginationScenario> scenarios(
      @RequestBody @Valid final SearchPaginationInput searchPaginationInput) {
    return this.scenarioService.scenarios(searchPaginationInput);
  }

  @GetMapping(SCENARIO_URI + "/{scenarioId}")
  @PreAuthorize("isScenarioObserver(#scenarioId)")
  public Scenario scenario(@PathVariable @NotBlank final String scenarioId) {
    return scenarioService.scenario(scenarioId);
  }

  @PutMapping(SCENARIO_URI + "/{scenarioId}")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Scenario updateScenario(
      @PathVariable @NotBlank final String scenarioId,
      @Valid @RequestBody final UpdateScenarioInput input) {
    Scenario scenario = this.scenarioService.scenario(scenarioId);
    Set<Tag> currentTagList = scenario.getTags();
    scenario.setUpdateAttributes(input);
    scenario.setTags(iterableToSet(this.tagRepository.findAllById(input.getTagIds())));
    return this.scenarioService.updateScenario(scenario, currentTagList, input.isApplyTagRule());
  }

  @DeleteMapping(SCENARIO_URI + "/{scenarioId}")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public void deleteScenario(@PathVariable @NotBlank final String scenarioId) {
    this.scenarioService.deleteScenario(scenarioId);
  }

  // -- TAGS --

  @PutMapping(SCENARIO_URI + "/{scenarioId}/tags")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Scenario updateScenarioTags(
      @PathVariable @NotBlank final String scenarioId,
      @Valid @RequestBody final ScenarioUpdateTagsInput input) {
    Scenario scenario = this.scenarioService.scenario(scenarioId);
    Set<Tag> currentTagList = scenario.getTags();
    scenario.setTags(iterableToSet(this.tagRepository.findAllById(input.getTagIds())));
    return this.scenarioService.updateScenario(scenario, currentTagList, input.isApplyTagRule());
  }

  // -- EXPORT --

  @GetMapping(SCENARIO_URI + "/{scenarioId}/export")
  @PreAuthorize("isScenarioObserver(#scenarioId)")
  public void exportScenario(
      @PathVariable @NotBlank final String scenarioId,
      @RequestParam(required = false) final boolean isWithTeams,
      @RequestParam(required = false) final boolean isWithPlayers,
      @RequestParam(required = false) final boolean isWithVariableValues,
      HttpServletResponse response)
      throws IOException {
    this.scenarioService.exportScenario(
        scenarioId, isWithTeams, isWithPlayers, isWithVariableValues, response);
  }

  // -- IMPORT --

  @PostMapping(SCENARIO_URI + "/import")
  @Secured(ROLE_ADMIN)
  public void importScenario(@RequestPart("file") @NotNull MultipartFile file) throws Exception {
    this.importService.handleFileImport(file);
  }

  // -- TEAMS --
  @LogExecutionTime
  @GetMapping(SCENARIO_URI + "/{scenarioId}/teams")
  @PreAuthorize("isScenarioObserver(#scenarioId)")
  public List<TeamOutput> scenarioTeams(@PathVariable @NotBlank final String scenarioId) {
    return this.teamService.find(fromScenario(scenarioId));
  }

  @Transactional(rollbackOn = Exception.class)
  @PutMapping(SCENARIO_URI + "/{scenarioId}/teams/remove")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Iterable<TeamOutput> removeScenarioTeams(
      @PathVariable @NotBlank final String scenarioId,
      @Valid @RequestBody final ScenarioUpdateTeamsInput input) {
    return this.scenarioService.removeTeams(scenarioId, input.getTeamIds());
  }

  @Transactional(rollbackOn = Exception.class)
  @PutMapping(SCENARIO_URI + "/{scenarioId}/teams/replace")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public List<TeamOutput> replaceScenarioTeams(
      @PathVariable @NotBlank final String scenarioId,
      @Valid @RequestBody final ScenarioUpdateTeamsInput input) {
    return this.scenarioService.replaceTeams(scenarioId, input.getTeamIds());
  }

  @Transactional(rollbackOn = Exception.class)
  @PutMapping(SCENARIO_URI + "/{scenarioId}/teams/{teamId}/players/enable")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Scenario enableScenarioTeamPlayers(
      @PathVariable @NotBlank final String scenarioId,
      @PathVariable @NotBlank final String teamId,
      @Valid @RequestBody final ScenarioTeamPlayersEnableInput input) {
    return this.scenarioService.enablePlayers(scenarioId, teamId, input.getPlayersIds());
  }

  @Transactional(rollbackOn = Exception.class)
  @PutMapping(SCENARIO_URI + "/{scenarioId}/teams/{teamId}/players/disable")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Scenario disableScenarioTeamPlayers(
      @PathVariable @NotBlank final String scenarioId,
      @PathVariable @NotBlank final String teamId,
      @Valid @RequestBody final ScenarioTeamPlayersEnableInput input) {
    return this.scenarioService.disablePlayers(scenarioId, teamId, input.getPlayersIds());
  }

  @Transactional(rollbackOn = Exception.class)
  @PutMapping(SCENARIO_URI + "/{scenarioId}/teams/{teamId}/players/add")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Scenario addScenarioTeamPlayers(
      @PathVariable @NotBlank final String scenarioId,
      @PathVariable @NotBlank final String teamId,
      @Valid @RequestBody final ScenarioTeamPlayersEnableInput input) {
    Team team = teamRepository.findById(teamId).orElseThrow(ElementNotFoundException::new);
    Iterable<User> teamUsers = userRepository.findAllById(input.getPlayersIds());
    team.getUsers().addAll(fromIterable(teamUsers));
    teamRepository.save(team);
    return this.scenarioService.enablePlayers(scenarioId, teamId, input.getPlayersIds());
  }

  @Transactional(rollbackOn = Exception.class)
  @PutMapping(SCENARIO_URI + "/{scenarioId}/teams/{teamId}/players/remove")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Scenario removeScenarioTeamPlayers(
      @PathVariable @NotBlank final String scenarioId,
      @PathVariable @NotBlank final String teamId,
      @Valid @RequestBody final ScenarioTeamPlayersEnableInput input) {
    Team team = teamRepository.findById(teamId).orElseThrow(ElementNotFoundException::new);
    Iterable<User> teamUsers = userRepository.findAllById(input.getPlayersIds());
    team.getUsers().removeAll(fromIterable(teamUsers));
    teamRepository.save(team);
    return this.scenarioService.disablePlayers(scenarioId, teamId, input.getPlayersIds());
  }

  // -- RECURRENCE --

  @PutMapping(SCENARIO_URI + "/{scenarioId}/recurrence")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Scenario updateScenarioRecurrence(
      @PathVariable @NotBlank final String scenarioId,
      @Valid @RequestBody final ScenarioRecurrenceInput input) {
    Scenario scenario = this.scenarioService.scenario(scenarioId);
    scenario.setUpdateAttributes(input);
    return this.scenarioService.updateScenario(scenario);
  }

  // -- OPTION --

  @GetMapping(SCENARIO_URI + "/options")
  public List<FilterUtilsJpa.Option> optionsByName(
      @RequestParam(required = false) final String searchText) {
    return fromIterable(
            this.scenarioRepository.findAll(
                byName(searchText), Sort.by(Sort.Direction.ASC, "name")))
        .stream()
        .map(i -> new FilterUtilsJpa.Option(i.getId(), i.getName()))
        .toList();
  }

  @PostMapping(SCENARIO_URI + "/options")
  public List<FilterUtilsJpa.Option> optionsById(@RequestBody final List<String> ids) {
    return fromIterable(this.scenarioRepository.findAllById(ids)).stream()
        .map(i -> new FilterUtilsJpa.Option(i.getId(), i.getName()))
        .toList();
  }

  @GetMapping(SCENARIO_URI + "/category/options")
  public List<FilterUtilsJpa.Option> categoryOptionsByName(
      @RequestParam(required = false) final String searchText) {
    return this.scenarioRepository
        .findDistinctCategoriesBySearchTerm(searchText, PageRequest.of(0, 10))
        .stream()
        .map(i -> new FilterUtilsJpa.Option(i, i))
        .toList();
  }

  // -- LESSON --
  @PutMapping(SCENARIO_URI + "/{scenarioId}/lessons")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  @Transactional(rollbackOn = Exception.class)
  public Scenario updateScenarioLessons(
      @PathVariable String scenarioId, @Valid @RequestBody LessonsInput input) {
    Scenario scenario = this.scenarioService.scenario(scenarioId);
    scenario.setLessonsAnonymized(input.isLessonsAnonymized());
    return scenarioRepository.save(scenario);
  }

  // EXERCISE
  @PostMapping(SCENARIO_URI + "/{scenarioId}/exercise/running")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Exercise createRunningExerciseFromScenario(
      @PathVariable @NotBlank final String scenarioId) {
    Scenario scenario = this.scenarioService.scenario(scenarioId);
    return scenarioToExerciseService.toExercise(
        scenario, now().truncatedTo(MINUTES).plus(1, MINUTES), true);
  }

  @PostMapping(SCENARIO_URI + "/{scenarioId}/check-rules")
  @ApiResponses(
      value = {
        @ApiResponse(responseCode = "200", description = "Returns whether or not the rules apply")
      })
  @Operation(summary = "Check rules", description = "Check if the rules apply to a scenario update")
  public CheckScenarioRulesOutput checkIfRuleApplies(
      @PathVariable @NotBlank final String scenarioId,
      @Valid @RequestBody final CheckScenarioRulesInput input) {
    Scenario scenario = this.scenarioService.scenario(scenarioId);
    return CheckScenarioRulesOutput.builder()
        .rulesFound(this.scenarioService.checkIfTagRulesApplies(scenario, input.getNewTags()))
        .build();
  }
}
