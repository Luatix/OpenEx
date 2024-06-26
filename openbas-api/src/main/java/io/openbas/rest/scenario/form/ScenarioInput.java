package io.openbas.rest.scenario.form;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

import static io.openbas.config.AppConfig.MANDATORY_MESSAGE;

@Data
public class ScenarioInput {

  @Nullable
  @JsonProperty("scenario_id")
  private String id;

  @NotBlank(message = MANDATORY_MESSAGE)
  @JsonProperty("scenario_name")
  private String name;

  @JsonProperty("scenario_description")
  private String description;

  @JsonProperty("scenario_subtitle")
  private String subtitle;

  @Nullable
  @JsonProperty("scenario_category")
  private String category;

  @Nullable
  @JsonProperty("scenario_main_focus")
  private String mainFocus;

  @Nullable
  @JsonProperty("scenario_severity")
  private String severity;

  @Nullable
  @JsonProperty("scenario_external_reference")
  private String externalReference;

  @Nullable
  @JsonProperty("scenario_external_url")
  private String externalUrl;

  @JsonProperty("scenario_tags")
  private List<String> tagIds = new ArrayList<>();

}
