package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.openbas.helper.MonoIdDeserializer;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Objects;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Setter
@Getter
@Entity
@Table(name = "grants")
public class Grant implements Base {

  public enum GRANT_TYPE {
    OBSERVER,
    PLANNER
  }

  @Id
  @Column(name = "grant_id")
  @GeneratedValue(generator = "UUID")
  @UuidGenerator
  @JsonProperty("grant_id")
  @NotBlank
  @Schema(description = "Id of the grant")
  private String id;

  @Column(name = "grant_name")
  @JsonProperty("grant_name")
  @Enumerated(EnumType.STRING)
  @NotNull
  @Schema(description = "Name of the grant")
  private GRANT_TYPE name;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "grant_group")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @JsonProperty("grant_group")
  @Schema(description = "Group ID of the grant")
  private Group group;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "grant_exercise")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @JsonProperty("grant_exercise")
  @Schema(description = "Simulation ID of the grant")
  private Exercise exercise;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "grant_scenario")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @JsonProperty("grant_scenario")
  @Schema(description = "Scenario ID of the grant")
  private Scenario scenario;

  @Override
  public boolean isUserHasAccess(User user) {
    return user.isAdmin();
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || !Base.class.isAssignableFrom(o.getClass())) return false;
    Base base = (Base) o;
    return id.equals(base.getId());
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
