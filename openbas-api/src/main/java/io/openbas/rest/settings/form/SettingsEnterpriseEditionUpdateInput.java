package io.openbas.rest.settings.form;

import static io.openbas.config.AppConfig.MANDATORY_MESSAGE;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class SettingsEnterpriseEditionUpdateInput {
  @NotBlank(message = MANDATORY_MESSAGE)
  @JsonProperty("platform_enterprise_edition")
  @Schema(description = "'true' if enterprise edition is activated")
  private String enterpriseEdition;
}
