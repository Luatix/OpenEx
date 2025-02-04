package io.openbas.rest.payload.form;

import static io.openbas.config.AppConfig.MANDATORY_MESSAGE;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PayloadUpsertInput extends PayloadInput {

  @NotBlank(message = MANDATORY_MESSAGE)
  @JsonProperty("payload_external_id")
  private String externalId;

  @JsonProperty("payload_collector")
  private String collector;

  @JsonProperty("payload_elevation_required")
  private boolean elevationRequired;
}
