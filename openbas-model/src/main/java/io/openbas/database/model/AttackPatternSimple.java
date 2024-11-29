package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class AttackPatternSimple {

  @JsonProperty("attack_pattern_id")
  @NotBlank
  private String id;

  @JsonProperty("attack_pattern_name")
  @NotBlank
  private String name;

  @JsonProperty("attack_pattern_external_id")
  @NotBlank
  private String externalId;

  public AttackPatternSimple(String id, String name, String externalId) {
    this.id = id;
    this.name = name;
    this.externalId = externalId;
  }
}
