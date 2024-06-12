package io.openbas.rest.inject;

import io.openbas.database.specification.InjectSpecification;
import io.openbas.rest.helper.RestBehavior;
import io.openbas.rest.inject.output.InjectOutput;
import io.openbas.service.InjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import static io.openbas.rest.exercise.ExerciseApi.EXERCISE_URI;

@RestController
@RequiredArgsConstructor
public class ExerciseInjectApi extends RestBehavior {

  private final InjectService injectService;

  @Operation(summary = "Retrieved injects for an exercise")
  @ApiResponses(value = {
      @ApiResponse(
          responseCode = "200", description = "Retrieved injects for an exercise",
          content = {
              @Content(mediaType = "application/json", schema = @Schema(implementation = InjectOutput.class))
          }
      ),
  })
  @GetMapping(EXERCISE_URI + "/{exerciseId}/injects/simple")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  @Transactional(readOnly = true)
  public Iterable<InjectOutput> exerciseInjectsSimple(@PathVariable @NotBlank final String exerciseId) {
    return this.injectService.injects(InjectSpecification.fromExercise(exerciseId));
  }

}
