package io.openbas.database.raw;

import io.openbas.database.model.Scenario.SEVERITY;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import lombok.Data;

@Data
public class RawPaginationScenario {

  @Schema(description = "Id of the scenario")
  private String scenario_id;

  @Schema(description = "Name of the scenario")
  private String scenario_name;

  @Schema(description = "Severity of the scenario")
  private SEVERITY scenario_severity;

  @Schema(description = "Category of the scenario")
  private String scenario_category;

  @Schema(description = "Recurrence cron-style of the scenario")
  private String scenario_recurrence;

  @Schema(description = "Update date of the scenario")
  private Instant scenario_updated_at;

  @Schema(description = "List of tag IDs of the scenario")
  private Set<String> scenario_tags;

  @Schema(description = "List of platforms of the scenario")
  private Set<String> scenario_platforms;

  public RawPaginationScenario(
      String id,
      String name,
      SEVERITY severity,
      String category,
      String recurrence,
      Instant updatedAt,
      String[] tags,
      String[] platforms) {
    this.scenario_id = id;
    this.scenario_name = name;
    this.scenario_severity = severity;
    this.scenario_category = category;
    this.scenario_recurrence = recurrence;
    this.scenario_updated_at = updatedAt;
    this.scenario_tags = tags != null ? new HashSet<>(Arrays.asList(tags)) : new HashSet<>();
    this.scenario_platforms =
        platforms != null ? new HashSet<>(Arrays.asList(platforms)) : new HashSet<>();
  }
}
