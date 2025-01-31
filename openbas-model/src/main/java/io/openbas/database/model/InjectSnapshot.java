package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.openbas.database.audit.ModelBaseListener;
import io.openbas.database.converter.InjectStatusExecutionConverter;
import io.openbas.helper.MultiIdListDeserializer;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.Getter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static java.time.Instant.now;

@Data
@Entity
@Table(name = "injects_snapshots")
@EntityListeners(ModelBaseListener.class)
public class InjectSnapshot implements Base {

  @Id
  @Column(name = "inject_snapshot_id")
  @GeneratedValue(generator = "UUID")
  @UuidGenerator
  @JsonProperty("inject_snapshot_id")
  private String id;

  /*@Column(name = "snapshot_executions")
  @Convert(converter = InjectStatusExecutionConverter.class)
  @JsonProperty("snapshot_traces")
  private List<InjectStatusExecution> traces = new ArrayList<>();*/

  @OneToOne
  @JoinColumn(name = "snapshot_inject")
  @JsonIgnore
  private Inject inject;

  @ArraySchema(schema = @Schema(type = "string"))
  @OneToMany(mappedBy = "snapshot", fetch = FetchType.LAZY)
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("snapshot_assets")
  private List<Asset> assets = new ArrayList<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @OneToMany(mappedBy = "snapshot", fetch = FetchType.LAZY)
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("snapshot_asset_groups")
  private List<AssetGroup> assetGroups = new ArrayList<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @OneToMany(mappedBy = "snapshot", fetch = FetchType.LAZY)
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("snapshot_teams")
  private List<Team> teams = new ArrayList<>();

  @Column(name = "snapshot_created_at")
  @JsonProperty("snapshot_created_at")
  @NotNull
  private Instant createdAt = now();

  @Column(name = "snapshot_updated_at")
  @JsonProperty("snapshot_updated_at")
  @NotNull
  private Instant updatedAt = now();

}
