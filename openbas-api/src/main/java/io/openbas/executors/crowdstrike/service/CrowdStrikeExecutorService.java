package io.openbas.executors.crowdstrike.service;

import static java.time.Instant.now;
import static java.time.ZoneOffset.UTC;

import io.openbas.database.model.Agent;
import io.openbas.database.model.Endpoint;
import io.openbas.database.model.Executor;
import io.openbas.executors.crowdstrike.client.CrowdStrikeExecutorClient;
import io.openbas.executors.crowdstrike.config.CrowdStrikeExecutorConfig;
import io.openbas.executors.crowdstrike.model.CrowdStrikeDevice;
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
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@ConditionalOnProperty(prefix = "executor.crowdstrike", name = "enable")
@Log
@Service
public class CrowdStrikeExecutorService implements Runnable {
  private static final int DELETE_TTL = 86400000; // 24 hours
  private static final String CROWDSTRIKE_EXECUTOR_TYPE = "openbas_crowdstrike";
  private static final String CROWDSTRIKE_EXECUTOR_NAME = "CrowdStrike";
  private static final String CROWDSTRIKE_EXECUTOR_DOCUMENTATION_LINK =
      "https://docs.openbas.io/latest/deployment/ecosystem/executors/#crowdstrike-falcon-agent";

  private final CrowdStrikeExecutorClient client;

  private final EndpointService endpointService;

  private final AgentService agentService;

  private Executor executor = null;

  public static Endpoint.PLATFORM_TYPE toPlatform(@NotBlank final String platform) {
    return switch (platform) {
      case "Linux" -> Endpoint.PLATFORM_TYPE.Linux;
      case "Windows" -> Endpoint.PLATFORM_TYPE.Windows;
      case "Mac" -> Endpoint.PLATFORM_TYPE.MacOS;
      default -> Endpoint.PLATFORM_TYPE.Unknown;
    };
  }

  public static Endpoint.PLATFORM_ARCH toArch(@NotBlank final String arch) {
    return switch (arch) {
      case "x64", "x86_64" -> Endpoint.PLATFORM_ARCH.x86_64;
      case "arm64" -> Endpoint.PLATFORM_ARCH.arm64;
      default -> Endpoint.PLATFORM_ARCH.Unknown;
    };
  }

  @Autowired
  public CrowdStrikeExecutorService(
      ExecutorService executorService,
      CrowdStrikeExecutorClient client,
      CrowdStrikeExecutorConfig config,
      EndpointService endpointService,
      AgentService agentService) {
    this.client = client;
    this.agentService = agentService;
    this.endpointService = endpointService;
    try {
      if (config.isEnable()) {
        this.executor =
            executorService.register(
                config.getId(),
                CROWDSTRIKE_EXECUTOR_TYPE,
                CROWDSTRIKE_EXECUTOR_NAME,
                CROWDSTRIKE_EXECUTOR_DOCUMENTATION_LINK,
                getClass().getResourceAsStream("/img/icon-crowdstrike.png"),
                new String[] {
                  Endpoint.PLATFORM_TYPE.Windows.name(),
                  Endpoint.PLATFORM_TYPE.Linux.name(),
                  Endpoint.PLATFORM_TYPE.MacOS.name()
                });
      } else {
        executorService.remove(config.getId());
      }
    } catch (Exception e) {
      log.log(Level.SEVERE, "Error creating CrowdStrike executor: " + e);
    }
  }

  @Override
  public void run() {
    log.info("Running CrowdStrike executor endpoints gathering...");
    List<CrowdStrikeDevice> devices = this.client.devices().getResources().stream().toList();
    Map<Endpoint, Agent> endpointAgentMap = toEndpoint(devices);
    log.info("CrowdStrike executor provisioning based on " + endpointAgentMap.size() + " assets");

    for (var endpointAgent : endpointAgentMap.entrySet()) {
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
                  CROWDSTRIKE_EXECUTOR_TYPE);
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
                  CROWDSTRIKE_EXECUTOR_TYPE);
          if (optionalAgent.isPresent()) {
            Agent existingAgent = optionalAgent.get();
            if ((now().toEpochMilli() - existingAgent.getLastSeen().toEpochMilli()) > DELETE_TTL) {
              log.info(
                  "Found stale endpoint " + endpoint.getName() + ", deleting the agent in it...");
              this.agentService.deleteAgent(existingAgent.getId());
            }
          }
        }
      }
    }
  }

  // -- PRIVATE --

  private Map<Endpoint, Agent> toEndpoint(@NotNull final List<CrowdStrikeDevice> devices) {
    return devices.stream()
        .map(
            crowdStrikeDevice -> {
              Endpoint endpoint = new Endpoint();
              Agent agent = new Agent();

              agent.setExecutor(this.executor);
              agent.setExternalReference(crowdStrikeDevice.getDevice_id());
              agent.setPrivilege(Agent.PRIVILEGE.admin);
              agent.setDeploymentMode(Agent.DEPLOYMENT_MODE.service);

              endpoint.setName(crowdStrikeDevice.getHostname());
              endpoint.setDescription("Asset collected by CrowdStrike executor context.");
              endpoint.setIps(new String[] {crowdStrikeDevice.getConnection_ip()});
              endpoint.setMacAddresses(new String[] {crowdStrikeDevice.getMac_address()});
              endpoint.setHostname(crowdStrikeDevice.getHostname());
              endpoint.setPlatform(toPlatform(crowdStrikeDevice.getPlatform_name()));
              endpoint.setArch(toArch("x64"));

              agent.setExecutedByUser(
                  Endpoint.PLATFORM_TYPE.Windows.equals(endpoint.getPlatform())
                      ? Agent.ADMIN_SYSTEM_WINDOWS
                      : Agent.ADMIN_SYSTEM_UNIX);
              agent.setLastSeen(toInstant(crowdStrikeDevice.getLast_seen()));
              agent.setAsset(endpoint);

              return Map.entry(endpoint, agent);
            })
        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
  }

  private Instant toInstant(@NotNull final String lastSeen) {
    String pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'";
    DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern(pattern, Locale.getDefault());
    LocalDateTime localDateTime = LocalDateTime.parse(lastSeen, dateTimeFormatter);
    ZonedDateTime zonedDateTime = localDateTime.atZone(UTC);
    return zonedDateTime.toInstant();
  }
}
