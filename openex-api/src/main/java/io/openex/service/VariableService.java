package io.openex.service;

import io.openex.database.model.Exercise;
import io.openex.database.model.Variable;
import io.openex.database.repository.ExerciseRepository;
import io.openex.database.repository.VariableRepository;
import io.openex.database.specification.VariableSpecification;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

import static java.time.Instant.now;

@RequiredArgsConstructor
@Service
public class VariableService {

  private final VariableRepository variableRepository;
  private final ExerciseRepository exerciseRepository;

  public Variable createVariableForExercise(
      @NotBlank final String exerciseId,
      @NotNull final Variable variable) {
    Exercise exercise = this.exerciseRepository.findById(exerciseId).orElseThrow();
    variable.setExercise(exercise);
    return this.variableRepository.save(variable);
  }

  public Variable createVariable(@NotNull final Variable variable) {
    return this.variableRepository.save(variable);
  }

  public Variable variable(@NotBlank final String variableId) {
    return this.variableRepository.findById(variableId).orElseThrow();
  }

  public List<Variable> variablesFromExercise(@NotBlank final String exerciseId) {
    return this.variableRepository.findAll(VariableSpecification.fromExercise(exerciseId));
  }

  public List<Variable> variablesFromScenario(@NotBlank final String scenarioId) {
    return this.variableRepository.findAll(VariableSpecification.fromScenario(scenarioId));
  }

  public Variable updateVariable(@NotNull final Variable variable) {
    variable.setUpdatedAt(now());
    return this.variableRepository.save(variable);
  }

  public void deleteVariable(@NotBlank final String variableId) {
    this.variableRepository.deleteById(variableId);
  }

}
