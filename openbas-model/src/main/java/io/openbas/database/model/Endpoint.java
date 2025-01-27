package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.hypersistence.utils.hibernate.type.array.StringArrayType;
import io.openbas.annotation.Ipv4OrIpv6Constraint;
import io.openbas.annotation.Queryable;
import io.openbas.database.audit.ModelBaseListener;
import io.openbas.helper.MultiModelDeserializer;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Type;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@DiscriminatorValue(Endpoint.ENDPOINT_TYPE)
@EntityListeners(ModelBaseListener.class)
public class Endpoint extends Asset {

  public static final String ENDPOINT_TYPE = "Endpoint";

  public enum PLATFORM_ARCH {
    @JsonProperty("x86_64")
    x86_64,
    @JsonProperty("arm64")
    arm64,
    @JsonProperty("Unknown")
    Unknown,
  }

  public enum PLATFORM_TYPE {
    @JsonProperty("Linux")
    Linux,
    @JsonProperty("Windows")
    Windows,
    @JsonProperty("MacOS")
    MacOS,
    @JsonProperty("Container")
    Container,
    @JsonProperty("Service")
    Service,
    @JsonProperty("Generic")
    Generic,
    @JsonProperty("Internal")
    Internal,
    @JsonProperty("Unknown")
    Unknown,
  }

  @Queryable(filterable = true)
  @NotEmpty
  @Ipv4OrIpv6Constraint
  @Type(StringArrayType.class)
  @Column(name = "endpoint_ips", columnDefinition = "text[]")
  @JsonProperty("endpoint_ips")
  private String[] ips;

  @Queryable(filterable = true, sortable = true)
  @Column(name = "endpoint_hostname")
  @JsonProperty("endpoint_hostname")
  private String hostname;

  @Queryable(filterable = true, sortable = true)
  @Column(name = "endpoint_platform")
  @JsonProperty("endpoint_platform")
  @Enumerated(EnumType.STRING)
  @NotNull
  private PLATFORM_TYPE platform;

  @Queryable(filterable = true, sortable = true)
  @Column(name = "endpoint_arch")
  @JsonProperty("endpoint_arch")
  @Enumerated(EnumType.STRING)
  @NotNull
  private PLATFORM_ARCH arch;

  @Type(StringArrayType.class)
  @Column(name = "endpoint_mac_addresses")
  @JsonProperty("endpoint_mac_addresses")
  private String[] macAddresses;

  @OneToMany(
      mappedBy = "asset",
      fetch = FetchType.EAGER,
      cascade = CascadeType.ALL,
      orphanRemoval = true) // TODO lazy with transactions with agent repository for the "getAgents"
  // method
  @JsonProperty("asset_agents")
  @JsonSerialize(using = MultiModelDeserializer.class)
  private List<Agent> agents = new ArrayList<>();

  @JsonIgnore
  public Executor getExecutor() {
    if (this.agents.isEmpty()) {
      return null;
    }
    return this.agents.getFirst().getExecutor();
  }

  @JsonIgnore
  public boolean getActive() {
    if (this.agents.isEmpty()) {
      return false;
    }
    return this.agents.getFirst().isActive();
  }

  public String getHostname() {
    return hostname.toLowerCase();
  }

  public void setHostname(String hostname) {
    this.hostname = hostname.toLowerCase();
  }

  public Endpoint() {}

  public Endpoint(String id, String type, String name, PLATFORM_TYPE platform) {
    super(id, type, name);
    this.platform = platform;
  }
}
