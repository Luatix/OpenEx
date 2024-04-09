package io.openbas.rest.atomic_testing.form;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Builder
public class SimpleExpectationResultOutput {

  @Schema(description = "Expectation Id")
  @JsonProperty("target_result_id")
  @NotNull
  String id;

  @Schema(description = "Target id")
  @JsonProperty("target_id")
  @NotNull
  String targetId;

  @Schema(description = "Inject id")
  @JsonProperty("target_inject_id")
  @NotNull
  String injectId;

  @Schema(description = "Type")
  @JsonProperty("target_result_type")
  @NotNull
  ExpectationType type;

  @Schema(description = "Subtype")
  @JsonProperty("target_result_subtype")
  @NotNull
  String subtype;

  @Schema(description = "Started date of inject")
  @JsonProperty("target_result_started_at")
  @NotNull
  Instant startedAt;

  @Schema(description = "End date of inject")
  @JsonProperty("target_result_ended_at")
  Instant endedAt;

  @Schema(description = "Logs")
  @JsonProperty("target_result_logs")
  String logs;

  @Schema(description = "Response status")
  @JsonProperty("target_result_response_status")
  ExpectationStatus response;

}
