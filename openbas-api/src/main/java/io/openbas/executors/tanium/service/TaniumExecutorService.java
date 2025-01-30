package io.openbas.executors.tanium.service;

import static java.time.Instant.now;
import static java.time.ZoneOffset.UTC;

import io.openbas.database.model.*;
import io.openbas.executors.tanium.client.TaniumExecutorClient;
import io.openbas.executors.tanium.config.TaniumExecutorConfig;
import io.openbas.executors.tanium.model.NodeEndpoint;
import io.openbas.executors.tanium.model.TaniumEndpoint;
import io.openbas.integrations.ExecutorService;
import io.openbas.service.AgentService;
import io.openbas.service.EndpointService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.logging.Level;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@ConditionalOnProperty(prefix = "executor.tanium", name = "enable")
@Log
@Service
public class TaniumExecutorService implements Runnable {
  private static final int DELETE_TTL = 86400000; // 24 hours
  private static final String TANIUM_EXECUTOR_TYPE = "openbas_tanium";
  private static final String TANIUM_EXECUTOR_NAME = "Tanium";
  private static final String TANIUM_EXECUTOR_DOCUMENTATION_LINK =
      "https://docs.openbas.io/latest/deployment/ecosystem/executors/#tanium-agent";

  private final TaniumExecutorClient client;

  private final EndpointService endpointService;

  private final AgentService agentService;

  private Executor executor = null;

  public static Endpoint.PLATFORM_TYPE toPlatform(@NotBlank final String platform) {
    return switch (platform) {
      case "Linux" -> Endpoint.PLATFORM_TYPE.Linux;
      case "Windows" -> Endpoint.PLATFORM_TYPE.Windows;
      case "MacOS" -> Endpoint.PLATFORM_TYPE.MacOS;
      default -> Endpoint.PLATFORM_TYPE.Unknown;
    };
  }

  public static Endpoint.PLATFORM_ARCH toArch(@NotBlank final String arch) {
    return switch (arch) {
      case "x64-based PC", "x86_64" -> Endpoint.PLATFORM_ARCH.x86_64;
      case "arm64-based PC", "arm64" -> Endpoint.PLATFORM_ARCH.arm64;
      default -> Endpoint.PLATFORM_ARCH.Unknown;
    };
  }

  @Autowired
  public TaniumExecutorService(
      ExecutorService executorService,
      TaniumExecutorClient client,
      TaniumExecutorConfig config,
      EndpointService endpointService,
      AgentService agentService) {
    this.client = client;
    this.endpointService = endpointService;
    this.agentService = agentService;
    try {
      if (config.isEnable()) {
        this.executor =
            executorService.register(
                config.getId(),
                TANIUM_EXECUTOR_TYPE,
                TANIUM_EXECUTOR_NAME,
                TANIUM_EXECUTOR_DOCUMENTATION_LINK,
                getClass().getResourceAsStream("/img/icon-tanium.png"),
                new String[] {
                  Endpoint.PLATFORM_TYPE.Windows.name(),
                  Endpoint.PLATFORM_TYPE.Linux.name(),
                  Endpoint.PLATFORM_TYPE.MacOS.name()
                });
      } else {
        executorService.remove(config.getId());
      }
    } catch (Exception e) {
      log.log(Level.SEVERE, "Error creating Tanium executor: " + e);
    }
  }

  @Override
  public void run() {
    log.info("Running Tanium executor endpoints gathering...");
    List<NodeEndpoint> nodeEndpoints =
        this.client.endpoints().getData().getEndpoints().getEdges().stream().toList();
    Map<Endpoint, Agent> endpointsAgents = toEndpoint(nodeEndpoints);
    log.info("Tanium executor provisioning based on " + endpointsAgents.size() + " assets");
    for (var endpointAgent : endpointsAgents.entrySet()) {
      Endpoint endpoint = endpointAgent.getKey();
      Agent agent = endpointAgent.getValue();
      Optional<Endpoint> optionalEndpoint =
          this.endpointService.findEndpointByAgentDetails(
              endpoint.getHostname(), endpoint.getPlatform(), endpoint.getArch());
      if (agent.isActive()) {
        // Endpoint already created -> attributes to update
        if (optionalEndpoint.isPresent()) {
          Endpoint endpointToUpdate = optionalEndpoint.get();
          Optional<Agent> optionalAgent =
              this.agentService.getAgentByAgentDetailsForAnAsset(
                  endpointToUpdate.getId(),
                  agent.getExecutedByUser(),
                  agent.getDeploymentMode(),
                  agent.getPrivilege(),
                  TANIUM_EXECUTOR_TYPE);
          endpointToUpdate.setIps(endpoint.getIps());
          endpointToUpdate.setMacAddresses(endpoint.getMacAddresses());
          this.endpointService.updateEndpoint(endpointToUpdate);
          // Agent already created -> attributes to update
          if (optionalAgent.isPresent()) {
            Agent agentToUpdate = optionalAgent.get();
            agentToUpdate.setAsset(endpointToUpdate);
            this.agentService.registerAgent(agentToUpdate);
          } else {
            // New agent to create for the endpoint
            this.agentService.registerAgent(agent);
          }
        } else {
          // New endpoint and new agent to create
          this.endpointService.createEndpoint(endpoint);
          this.agentService.registerAgent(agent);
        }
      } else {
        if (optionalEndpoint.isPresent()) {
          Optional<Agent> optionalAgent =
              this.agentService.getAgentByAgentDetailsForAnAsset(
                  optionalEndpoint.get().getId(),
                  agent.getExecutedByUser(),
                  agent.getDeploymentMode(),
                  agent.getPrivilege(),
                  TANIUM_EXECUTOR_TYPE);
          if (optionalAgent.isPresent()) {
            Agent existingAgent = optionalAgent.get();
            if ((now().toEpochMilli() - existingAgent.getLastSeen().toEpochMilli()) > DELETE_TTL) {
              log.info(
                  "Found stale endpoint "
                      + endpoint.getName()
                      + ", deleting the agent "
                      + existingAgent.getExecutedByUser()
                      + " in it...");
              this.agentService.deleteAgent(existingAgent.getId());
            }
          }
        }
      }
    }
  }

  // -- PRIVATE --

  private Map<Endpoint, Agent> toEndpoint(@NotNull final List<NodeEndpoint> nodeEndpoints) {
    HashMap<Endpoint, Agent> endpointsAgents = new HashMap<>();
    nodeEndpoints.forEach(
        nodeEndpoint -> {
          TaniumEndpoint taniumEndpoint = nodeEndpoint.getNode();
          Endpoint endpoint = new Endpoint();
          Agent agent = new Agent();
          agent.setExecutor(this.executor);
          agent.setExternalReference(taniumEndpoint.getId());
          agent.setPrivilege(io.openbas.database.model.Agent.PRIVILEGE.admin);
          agent.setDeploymentMode(Agent.DEPLOYMENT_MODE.service);
          endpoint.setName(taniumEndpoint.getName());
          endpoint.setDescription("Asset collected by Tanium executor context.");
          endpoint.setIps(taniumEndpoint.getIpAddresses());
          endpoint.setMacAddresses(taniumEndpoint.getMacAddresses());
          endpoint.setHostname(taniumEndpoint.getName());
          endpoint.setPlatform(toPlatform(taniumEndpoint.getOs().getPlatform()));
          agent.setExecutedByUser(
              Endpoint.PLATFORM_TYPE.Windows.equals(endpoint.getPlatform())
                  ? Agent.ADMIN_SYSTEM_WINDOWS
                  : Agent.ADMIN_SYSTEM_UNIX);
          endpoint.setArch(toArch(taniumEndpoint.getProcessor().getArchitecture()));
          agent.setLastSeen(toInstant(taniumEndpoint.getEidLastSeen()));
          agent.setAsset(endpoint);
          endpointsAgents.put(endpoint, agent);
        });
    return endpointsAgents;
  }

  private Instant toInstant(@NotNull final String lastSeen) {
    String pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'";
    DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern(pattern, Locale.getDefault());
    LocalDateTime localDateTime = LocalDateTime.parse(lastSeen, dateTimeFormatter);
    ZonedDateTime zonedDateTime = localDateTime.atZone(UTC);
    return zonedDateTime.toInstant();
  }
}
