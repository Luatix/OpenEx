package io.openex.rest.variable;

import io.openex.database.model.Scenario;
import io.openex.database.model.Variable;
import io.openex.rest.helper.RestBehavior;
import io.openex.rest.variable.form.VariableInput;
import io.openex.service.ScenarioService;
import io.openex.service.VariableService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import static io.openex.database.model.User.ROLE_USER;
import static io.openex.rest.exercise.ExerciseApi.EXERCISE_URI;
import static io.openex.rest.scenario.ScenarioApi.SCENARIO_URI;

@RequiredArgsConstructor
@RestController
@Secured(ROLE_USER)
public class VariableApi extends RestBehavior {

  public static final String VARIABLE_URI = "/api/variables";

  private final VariableService variableService;
  private final ScenarioService scenarioService;

  // -- EXERCISES --

  @PostMapping(EXERCISE_URI + "/{exerciseId}/variables")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public Variable createVariableForExercise(
      @PathVariable @NotBlank final String exerciseId,
      @Valid @RequestBody final VariableInput input) {
    Variable variable = new Variable();
    variable.setUpdateAttributes(input);
    return this.variableService.createVariableForExercise(exerciseId, variable);
  }

  @GetMapping(EXERCISE_URI + "/{exerciseId}/variables")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  public Iterable<Variable> variablesFromExercise(@PathVariable @NotBlank final String exerciseId) {
    return this.variableService.variablesFromExercise(exerciseId);
  }

  @PutMapping(EXERCISE_URI + "{exerciseId}/variables/{variableId}")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public Variable updateVariableForExercise(
      @PathVariable @NotBlank final String exerciseId,
      @PathVariable @NotBlank final String variableId,
      @Valid @RequestBody final VariableInput input) {
    Variable variable = this.variableService.variable(variableId);
    variable.setUpdateAttributes(input);
    return this.variableService.updateVariable(variable);
  }

  @DeleteMapping(EXERCISE_URI + "/{exerciseId}/variables/{variableId}")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public void deleteVariableForExercise(
      @PathVariable @NotBlank final String exerciseId,
      @PathVariable @NotBlank final String variableId) {
    this.variableService.deleteVariable(variableId);
  }

  // -- SCENARIOS --

  @PostMapping(SCENARIO_URI + "/{scenarioId}/variables")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Variable createVariableForScenario(
      @PathVariable @NotBlank final String scenarioId,
      @Valid @RequestBody final VariableInput input) {
    Variable variable = new Variable();
    variable.setUpdateAttributes(input);
    Scenario scenario = this.scenarioService.scenario(scenarioId);
    variable.setScenario(scenario);
    return this.variableService.createVariable(variable);
  }

  @GetMapping(SCENARIO_URI + "/{scenarioId}/variables")
  @PreAuthorize("isScenarioObserver(#scenarioId)")
  public Iterable<Variable> variablesFromScenario(@PathVariable @NotBlank final String scenarioId) {
    return this.variableService.variablesFromScenario(scenarioId);
  }

  @PutMapping(SCENARIO_URI + "{scenarioId}/variables/{variableId}")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Variable updateVariableForScenario(
      @PathVariable @NotBlank final String scenarioId,
      @PathVariable @NotBlank final String variableId,
      @Valid @RequestBody final VariableInput input) {
    Variable variable = this.variableService.variable(variableId);
    variable.setUpdateAttributes(input);
    return this.variableService.updateVariable(variable);
  }

  @DeleteMapping(SCENARIO_URI + "/{exerciseId}/variables/{variableId}")
  @PreAuthorize("isScenarioPlanner(#exerciseId)")
  public void deleteVariableForScenario(
      @PathVariable @NotBlank final String exerciseId,
      @PathVariable @NotBlank final String variableId) {
    this.variableService.deleteVariable(variableId);
  }

}
