package io.openbas.rest.asset_group.form;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.openbas.database.model.Filters.FilterGroup;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

import static io.openbas.config.AppConfig.MANDATORY_MESSAGE;

@Getter
@Setter
public class AssetGroupInput {

  @NotBlank(message = MANDATORY_MESSAGE)
  @JsonProperty("asset_group_name")
  private String name;

  @JsonProperty("asset_group_description")
  private String description;

  @JsonProperty("asset_group_tags")
  private List<String> tagIds = new ArrayList<>();

  @JsonProperty("asset_group_dynamic_filter")
  private FilterGroup dynamicFilter;

}
