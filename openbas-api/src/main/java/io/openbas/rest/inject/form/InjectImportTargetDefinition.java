package io.openbas.rest.inject.form;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InjectImportTargetDefinition {
  @JsonProperty("type")
  @NotBlank
  private InjectImportTargetType type;

  @JsonProperty("id")
  private String id;
}
