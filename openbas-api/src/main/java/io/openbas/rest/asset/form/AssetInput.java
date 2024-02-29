package io.openbas.rest.asset.form;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static io.openbas.config.AppConfig.MANDATORY_MESSAGE;

@Data
public abstract class AssetInput {

  @NotBlank(message = MANDATORY_MESSAGE)
  @JsonProperty("asset_name")
  private String name;

  @JsonProperty("asset_description")
  private String description;

  @JsonProperty("asset_last_seen")
  private Instant lastSeen;

  @JsonProperty("asset_tags")
  private List<String> tagIds = new ArrayList<>();

}
