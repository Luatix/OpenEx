package io.openbas.database.model;

import static java.time.Instant.now;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.openbas.annotation.Queryable;
import io.openbas.database.audit.ModelBaseListener;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

@Data
@Entity
@Table(name = "kill_chain_phases")
@EntityListeners(ModelBaseListener.class)
public class KillChainPhase implements Base {

  @Id
  @Column(name = "phase_id")
  @GeneratedValue(generator = "UUID")
  @UuidGenerator
  @JsonProperty("phase_id")
  @NotBlank
  @Schema(description = "ID of the kill chain phase")
  private String id;

  @Column(name = "phase_external_id")
  @JsonProperty("phase_external_id")
  @NotBlank
  @Schema(description = "External ID of the kill chain phase")
  private String externalId;

  @Column(name = "phase_stix_id")
  @JsonProperty("phase_stix_id")
  @Schema(description = "Stix ID of the kill chain phase")
  private String stixId;

  @Queryable(searchable = true, filterable = true, sortable = true)
  @Column(name = "phase_name")
  @JsonProperty("phase_name")
  @NotBlank
  @Schema(description = "Name of the kill chain phase")
  private String name;

  @Column(name = "phase_shortname")
  @JsonProperty("phase_shortname")
  @NotBlank
  @Schema(description = "Short name of the kill chain phase")
  private String shortName;

  @Queryable(searchable = true, sortable = true)
  @Column(name = "phase_kill_chain_name")
  @JsonProperty("phase_kill_chain_name")
  @NotBlank
  @Schema(description = "Name of the kill chain")
  private String killChainName;

  @Column(name = "phase_description")
  @JsonProperty("phase_description")
  @Schema(description = "Description of the kill chain phase")
  private String description;

  @Queryable(sortable = true)
  @Column(name = "phase_order")
  @JsonProperty("phase_order")
  @Schema(description = "Order of the kill chain phase")
  private Long order = 0L;

  @Queryable(sortable = true)
  @Column(name = "phase_created_at")
  @JsonProperty("phase_created_at")
  @NotNull
  @Schema(description = "Creation date of the kill chain phase")
  private Instant createdAt = now();

  @Column(name = "phase_updated_at")
  @JsonProperty("phase_updated_at")
  @NotNull
  @Schema(description = "Update date of the kill chain phase")
  private Instant updatedAt = now();
}
