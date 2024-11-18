package io.openbas.rest.atomic_testing.form;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.openbas.annotation.Queryable;
import io.openbas.database.model.*;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Setter
@Getter
@Builder
public class PayloadOutput {

  @JsonProperty("payload_id")
  private String id;

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

  @JsonProperty("payload_cleanup_command")
  private String cleanupCommand;

  @JsonProperty("payload_arguments")
  private List<PayloadArgument> arguments = new ArrayList<>();

  @JsonProperty("payload_prerequisites")
  private List<PayloadPrerequisite> prerequisites = new ArrayList<>();

  @JsonProperty("payload_external_id")
  private String externalId;

  @JsonProperty("payload_tags")
  private Set<String> tags;

  @JsonProperty("command_executor")
  private String executor;

  @JsonProperty("command_content")
  private String content;

  @JsonProperty("executable_file")
  private Document executableFile;

  @JsonProperty("executable_arch")
  @Enumerated(EnumType.STRING)
  private Endpoint.PLATFORM_ARCH executableArch;

  @JsonProperty("file_drop_file")
  private Document fileDropFile;

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
