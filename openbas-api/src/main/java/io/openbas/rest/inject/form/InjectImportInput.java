package io.openbas.rest.inject.form;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InjectImportInput {
  @JsonProperty("target")
  @NotBlank
  private InjectImportTargetDefinition target;
}
