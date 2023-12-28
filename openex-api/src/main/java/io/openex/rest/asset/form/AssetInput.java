package io.openex.rest.asset.form;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

import static io.openex.config.AppConfig.MANDATORY_MESSAGE;

@Data
public abstract class AssetInput {

  @JsonProperty("asset_external_id")
  private String externalId;

  @NotBlank(message = MANDATORY_MESSAGE)
  @JsonProperty("asset_name")
  private String name;

}
