package io.openbas.rest.atomic_testing.form;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.openbas.database.model.*;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.Singular;

@Setter
@Getter
@Builder
public class StatusPayloadOutput {

  @JsonProperty("payload_type")
  private String type;

  @JsonProperty("payload_collector_type")
  private String collectorType;

  @JsonProperty("payload_name")
  private String name;

  @JsonProperty("payload_description")
  private String description;

  @JsonProperty("payload_platforms")
  private Endpoint.PLATFORM_TYPE[] platforms = new Endpoint.PLATFORM_TYPE[0];

  @JsonProperty("payload_attack_patterns")
  private List<AttackPatternSimple> attackPatterns = new ArrayList<>();

  @JsonProperty("payload_cleanup_executor")
  private String cleanupExecutor;

  @JsonProperty("payload_command_blocks")
  @Singular
  private List<PayloadCommandBlock> payloadCommandBlocks = new ArrayList<>();

  @JsonProperty("payload_arguments")
  private List<PayloadArgument> arguments = new ArrayList<>();

  @JsonProperty("payload_obfuscator")
  private String obfuscator;

  @JsonProperty("payload_prerequisites")
  private List<PayloadPrerequisite> prerequisites = new ArrayList<>();

  @JsonProperty("payload_external_id")
  private String externalId;

  @JsonProperty("payload_tags")
  private Set<String> tags;

  @JsonProperty("executable_file")
  private StatusPayloadDocument executableFile;

  @JsonProperty("executable_arch")
  @Enumerated(EnumType.STRING)
  private Payload.PAYLOAD_EXECUTION_ARCH executableArch =
      Payload.PAYLOAD_EXECUTION_ARCH.ALL_ARCHITECTURES;

  @JsonProperty("file_drop_file")
  private StatusPayloadDocument fileDropFile;

  @JsonProperty("dns_resolution_hostname")
  private String hostname;

  @JsonProperty("network_traffic_ip_src")
  @NotNull
  private String ipSrc;

  @JsonProperty("network_traffic_ip_dst")
  @NotNull
  private String ipDst;

  @JsonProperty("network_traffic_port_src")
  @NotNull
  private Integer portSrc;

  @JsonProperty("network_traffic_port_dst")
  @NotNull
  private Integer portDst;

  @JsonProperty("network_traffic_protocol")
  @NotNull
  private String protocol;
}
