package io.openbas.database.model;

import static java.time.Instant.now;
import static lombok.AccessLevel.NONE;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import io.openbas.annotation.Queryable;
import io.openbas.database.audit.ModelBaseListener;
import io.openbas.database.model.Filters.FilterGroup;
import io.openbas.helper.MonoIdDeserializer;
import io.openbas.helper.MultiIdListDeserializer;
import io.openbas.helper.MultiIdSetDeserializer;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.*;

import lombok.Data;
import lombok.Getter;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UuidGenerator;

@Data
@Entity
@Table(name = "asset_groups")
@EntityListeners(ModelBaseListener.class)
@NamedEntityGraphs({
    @NamedEntityGraph(
        name = "AssetGroup.tags-assets",
        attributeNodes = {@NamedAttributeNode("tags"), @NamedAttributeNode("assets")})
})
public class AssetGroup implements Base {

  @Id
  @Column(name = "asset_group_id")
  @GeneratedValue(generator = "UUID")
  @UuidGenerator
  @JsonProperty("asset_group_id")
  @NotBlank
  private String id;

  @Column(name = "asset_group_name")
  @JsonProperty("asset_group_name")
  @Queryable(filterable = true, searchable = true, sortable = true)
  @NotBlank
  private String name;

  @Column(name = "asset_group_description")
  @JsonProperty("asset_group_description")
  @Queryable(filterable = true, sortable = true)
  private String description;

  // -- ASSET --

  @Type(JsonType.class)
  @Column(name = "asset_group_dynamic_filter")
  @JsonProperty("asset_group_dynamic_filter")
  private FilterGroup dynamicFilter;

  @ArraySchema(schema = @Schema(type = "string"))
  @ManyToMany(fetch = FetchType.EAGER)
  @JoinTable(
      name = "asset_groups_assets",
      joinColumns = @JoinColumn(name = "asset_group_id"),
      inverseJoinColumns = @JoinColumn(name = "asset_id"))
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("asset_group_assets")
  private List<Asset> assets = new ArrayList<>();

  @Getter(NONE)
  @Transient
  @JsonProperty("asset_group_dynamic_assets")
  private List<Asset> dynamicAssets = new ArrayList<>();

  // Getter is Mandatory when we use @Transient annotation
  @ArraySchema(schema = @Schema(type = "string"))
  @JsonSerialize(using = MultiIdListDeserializer.class)
  public List<Asset> getDynamicAssets() {
    return this.dynamicAssets;
  }

  // -- TAG --

  @ArraySchema(schema = @Schema(type = "string"))
  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "asset_groups_tags",
      joinColumns = @JoinColumn(name = "asset_group_id"),
      inverseJoinColumns = @JoinColumn(name = "tag_id"))
  @JsonSerialize(using = MultiIdSetDeserializer.class)
  @JsonProperty("asset_group_tags")
  @Queryable(filterable = true, sortable = true, dynamicValues = true, path = "tags.id")
  private Set<Tag> tags = new HashSet<>();

  // -- SNAPSHOT --

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("injectSnapshotId")
  @JoinColumn(name = "inject_snapshot_id")
  @JsonProperty("inject_snapshot_id")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @Schema(type = "string")
  private InjectSnapshot snapshot;

  // -- AUDIT --

  @Column(name = "asset_group_created_at")
  @JsonProperty("asset_group_created_at")
  @NotNull
  private Instant createdAt = now();

  @Column(name = "asset_group_updated_at")
  @JsonProperty("asset_group_updated_at")
  @NotNull
  private Instant updatedAt = now();

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
