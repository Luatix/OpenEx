package io.openbas.rest.exercise;

import static io.openbas.database.model.User.ROLE_USER;
import static io.openbas.rest.exercise.ExerciseApi.EXERCISE_URI;

import io.openbas.database.model.Exercise;
import io.openbas.database.model.ImportMapper;
import io.openbas.database.repository.ImportMapperRepository;
import io.openbas.rest.exception.ElementNotFoundException;
import io.openbas.rest.exercise.service.ExerciseService;
import io.openbas.rest.helper.RestBehavior;
import io.openbas.rest.scenario.form.InjectsImportInput;
import io.openbas.rest.scenario.response.ImportTestSummary;
import io.openbas.service.InjectImportService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Log
public class ExerciseImportApi extends RestBehavior {

  private final InjectImportService injectImportService;
  private final ImportMapperRepository importMapperRepository;
  private final ExerciseService exerciseService;

  @PostMapping(EXERCISE_URI + "/{exerciseId}/xls/{importId}/dry")
  @Transactional(rollbackOn = Exception.class)
  @Operation(summary = "Test the import of injects from an xls file")
  @Secured(ROLE_USER)
  public ImportTestSummary dryRunImportXLSFile(
      @PathVariable @NotBlank final String exerciseId,
      @PathVariable @NotBlank final String importId,
      @Valid @RequestBody final InjectsImportInput input) {
    return validateInputsAndProduceSummary(exerciseId, importId, input, false);
  }

  @PostMapping(EXERCISE_URI + "/{exerciseId}/xls/{importId}/import")
  @Transactional(rollbackOn = Exception.class)
  @Operation(summary = "Validate and import injects from an xls file")
  @Secured(ROLE_USER)
  public ImportTestSummary validateImportXLSFile(
      @PathVariable @NotBlank final String exerciseId,
      @PathVariable @NotBlank final String importId,
      @Valid @RequestBody final InjectsImportInput input) {
    return validateInputsAndProduceSummary(exerciseId, importId, input, true);
  }


  private ImportTestSummary validateInputsAndProduceSummary(String exerciseId, String importId, InjectsImportInput input, boolean withSave) {
    Exercise exercise = exerciseService.exercise(exerciseId);
    // Getting the mapper to use
    ImportMapper importMapper =
            this.importMapperRepository
                    .findById(UUID.fromString(input.getImportMapperId()))
                    .orElseThrow(
                            () ->
                                    new ElementNotFoundException(
                                            String.format(
                                                    "The import mapper %s was not found", input.getImportMapperId())));

    ImportTestSummary its = this.injectImportService.importInjectIntoExerciseFromXLS(
            exercise, importMapper, importId, input.getName(), input.getTimezoneOffset(), withSave);
    if(withSave) {
      this.exerciseService.updateExercise(exercise);
    }

    return its;
  }
}
