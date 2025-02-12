package io.openbas.database.model;

import static jakarta.persistence.DiscriminatorType.STRING;
import static java.time.Instant.now;
import static lombok.AccessLevel.NONE;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.hypersistence.utils.hibernate.type.array.StringArrayType;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import io.openbas.annotation.Queryable;
import io.openbas.database.audit.ModelBaseListener;
import io.openbas.database.model.Endpoint.PLATFORM_TYPE;
import io.openbas.helper.MonoIdDeserializer;
import io.openbas.helper.MultiIdListDeserializer;
import io.openbas.helper.MultiIdSetDeserializer;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.DiscriminatorMapping;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UuidGenerator;

@Data
@Entity
@Table(name = "payloads")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "payload_type", discriminatorType = STRING)
@EntityListeners(ModelBaseListener.class)
@Schema(
    discriminatorProperty = "payload_type",
    oneOf = {
      Command.class,
      Executable.class,
      FileDrop.class,
      DnsResolution.class,
      NetworkTraffic.class
    },
    discriminatorMapping = {
      @DiscriminatorMapping(value = "Command", schema = Command.class),
      @DiscriminatorMapping(value = "Executable", schema = Executable.class),
      @DiscriminatorMapping(value = "File", schema = FileDrop.class),
      @DiscriminatorMapping(value = "Dns", schema = DnsResolution.class),
      @DiscriminatorMapping(value = "Network", schema = NetworkTraffic.class)
    })
public class Payload implements Base {

  private static final int DEFAULT_NUMBER_OF_ACTIONS_FOR_PAYLOAD = 1;
  protected static final int DEFAULT_NUMBER_OF_ACTIONS_FOR_EXECUTABLE = 2;

  public enum PAYLOAD_SOURCE {
    COMMUNITY,
    FILIGRAN,
    MANUAL
  }

  public enum PAYLOAD_STATUS {
    UNVERIFIED,
    VERIFIED,
    DEPRECATED
  }

  public enum PAYLOAD_EXECUTION_ARCH {
    x86_64,
    arm64,
    ALL_ARCHITECTURES,
  }

  @Id
  @Column(name = "payload_id")
  @GeneratedValue(generator = "UUID")
  @UuidGenerator
  @JsonProperty("payload_id")
  @NotBlank
  private String id;

  @Column(name = "payload_type", insertable = false, updatable = false)
  @JsonProperty("payload_type")
  @Setter(NONE)
  private String type;

  @Queryable(filterable = true, searchable = true, sortable = true)
  @Column(name = "payload_name")
  @JsonProperty("payload_name")
  @NotBlank
  private String name;

  @Queryable(filterable = true, sortable = true)
  @Column(name = "payload_description")
  @JsonProperty("payload_description")
  private String description;

  @Queryable(filterable = true, searchable = true)
  @Type(StringArrayType.class)
  @Column(name = "payload_platforms", columnDefinition = "text[]")
  @JsonProperty("payload_platforms")
  private PLATFORM_TYPE[] platforms = new PLATFORM_TYPE[0];

  @ArraySchema(schema = @Schema(type = "string"))
  @Setter
  @ManyToMany(fetch = FetchType.EAGER)
  @JoinTable(
      name = "payloads_attack_patterns",
      joinColumns = @JoinColumn(name = "payload_id"),
      inverseJoinColumns = @JoinColumn(name = "attack_pattern_id"))
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("payload_attack_patterns")
  @Queryable(filterable = true, searchable = true, dynamicValues = true, path = "attackPatterns.id")
  private List<AttackPattern> attackPatterns = new ArrayList<>();

  @Setter
  @Column(name = "payload_cleanup_executor")
  @JsonProperty("payload_cleanup_executor")
  private String cleanupExecutor;

  @Setter
  @Column(name = "payload_cleanup_command")
  @JsonProperty("payload_cleanup_command")
  private String cleanupCommand;

  @Getter
  @Column(name = "payload_elevation_required")
  @JsonProperty("payload_elevation_required")
  private boolean elevationRequired;

  @Setter
  @Type(JsonType.class)
  @Column(name = "payload_arguments")
  @JsonProperty("payload_arguments")
  private List<PayloadArgument> arguments = new ArrayList<>();

  @Setter
  @Type(JsonType.class)
  @Column(name = "payload_prerequisites")
  @JsonProperty("payload_prerequisites")
  private List<PayloadPrerequisite> prerequisites = new ArrayList<>();

  @Setter
  @Column(name = "payload_external_id")
  @JsonProperty("payload_external_id")
  private String externalId;

  @Setter
  @Queryable(filterable = true, sortable = true)
  @Column(name = "payload_source")
  @Enumerated(EnumType.STRING)
  @JsonProperty("payload_source")
  @NotNull
  private PAYLOAD_SOURCE source;

  @Setter
  @Queryable(filterable = true)
  @Column(name = "payload_status")
  @Enumerated(EnumType.STRING)
  @JsonProperty("payload_status")
  @NotNull
  private PAYLOAD_STATUS status;

  @Queryable(filterable = true, searchable = true)
  @Column(name = "payload_execution_arch", nullable = false)
  @JsonProperty("payload_execution_arch")
  @Enumerated(EnumType.STRING)
  @NotNull
  private PAYLOAD_EXECUTION_ARCH executionArch = Payload.PAYLOAD_EXECUTION_ARCH.ALL_ARCHITECTURES;

  // -- COLLECTOR --

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "payload_collector")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @JsonProperty("payload_collector")
  @Schema(type = "string")
  private Collector collector;

  // -- TAG --

  @ArraySchema(schema = @Schema(type = "string"))
  @Queryable(filterable = true, dynamicValues = true)
  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "payloads_tags",
      joinColumns = @JoinColumn(name = "payload_id"),
      inverseJoinColumns = @JoinColumn(name = "tag_id"))
  @JsonSerialize(using = MultiIdSetDeserializer.class)
  @JsonProperty("payload_tags")
  private Set<Tag> tags = new HashSet<>();

  // -- AUDIT --

  @Column(name = "payload_created_at")
  @JsonProperty("payload_created_at")
  @NotNull
  private Instant createdAt = now();

  @Queryable(filterable = true, sortable = true)
  @Column(name = "payload_updated_at")
  @JsonProperty("payload_updated_at")
  @NotNull
  private Instant updatedAt = now();

  @JsonProperty("payload_collector_type")
  public String getCollectorType() {
    return this.collector != null ? this.collector.getType() : null;
  }

  @Transient
  public PayloadType getTypeEnum() {
    return PayloadType.fromString(type);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }

  public Payload() {}

  public Payload(String id, String type, String name) {
    this.name = name;
    this.id = id;
    this.type = type;
  }

  /*
   * Return the value to match in expectations
   */
  public String getExpectationSignatureValue() {
    return "";
  }
}
