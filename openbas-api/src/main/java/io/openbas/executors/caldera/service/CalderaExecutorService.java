package io.openbas.executors.caldera.service;

import static java.time.Instant.now;
import static java.time.ZoneOffset.UTC;

import com.cronutils.utils.VisibleForTesting;
import io.openbas.database.model.*;
import io.openbas.executors.caldera.client.CalderaExecutorClient;
import io.openbas.executors.caldera.config.CalderaExecutorConfig;
import io.openbas.executors.caldera.model.Agent;
import io.openbas.integrations.ExecutorService;
import io.openbas.integrations.InjectorService;
import io.openbas.service.AgentService;
import io.openbas.service.EndpointService;
import io.openbas.service.PlatformSettingsService;
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
import org.springframework.stereotype.Service;

@Log
@Service
public class CalderaExecutorService implements Runnable {

  private static final int CLEAR_TTL = 1800000; // 30 minutes
  private static final int DELETE_TTL = 86400000; // 24 hours
  private static final String CALDERA_EXECUTOR_TYPE = "openbas_caldera";
  private static final String CALDERA_EXECUTOR_NAME = "Caldera";

  private final CalderaExecutorClient client;

  private final EndpointService endpointService;

  private final CalderaExecutorContextService calderaExecutorContextService;

  private final InjectorService injectorService;
  private final PlatformSettingsService platformSettingsService;
  private final AgentService agentService;

  private Executor executor = null;

  public static Endpoint.PLATFORM_TYPE toPlatform(@NotBlank final String platform) {
    return switch (platform) {
      case "linux" -> Endpoint.PLATFORM_TYPE.Linux;
      case "windows" -> Endpoint.PLATFORM_TYPE.Windows;
      case "darwin" -> Endpoint.PLATFORM_TYPE.MacOS;
      default -> throw new IllegalArgumentException("This platform is not supported : " + platform);
    };
  }

  public static Endpoint.PLATFORM_ARCH toArch(@NotBlank final String arch) {
    return switch (arch) {
      case "amd64" -> Endpoint.PLATFORM_ARCH.x86_64;
      case "arm64" -> Endpoint.PLATFORM_ARCH.arm64;
      default -> throw new IllegalArgumentException("This arch is not supported : " + arch);
    };
  }

  @Autowired
  public CalderaExecutorService(
      ExecutorService executorService,
      CalderaExecutorClient client,
      CalderaExecutorConfig config,
      CalderaExecutorContextService calderaExecutorContextService,
      EndpointService endpointService,
      InjectorService injectorService,
      PlatformSettingsService platformSettingsService,
      AgentService agentService) {
    this.client = client;
    this.endpointService = endpointService;
    this.calderaExecutorContextService = calderaExecutorContextService;
    this.injectorService = injectorService;
    this.platformSettingsService = platformSettingsService;
    this.agentService = agentService;
    try {
      if (config.isEnable()) {
        this.executor =
            executorService.register(
                config.getId(),
                CALDERA_EXECUTOR_TYPE,
                CALDERA_EXECUTOR_NAME,
                null,
                getClass().getResourceAsStream("/img/icon-caldera.png"),
                new String[] {
                  Endpoint.PLATFORM_TYPE.Windows.name(),
                  Endpoint.PLATFORM_TYPE.Linux.name(),
                  Endpoint.PLATFORM_TYPE.MacOS.name()
                });
        this.calderaExecutorContextService.registerAbilities();
      } else {
        this.platformSettingsService.cleanMessage(BannerMessage.BANNER_KEYS.CALDERA_UNAVAILABLE);
        executorService.removeFromType(CALDERA_EXECUTOR_TYPE);
      }
    } catch (Exception e) {
      log.log(Level.SEVERE, "Error creating caldera executor: " + e);
    }
  }

  @Override
  public void run() {
    try {
      log.info("Running Caldera executor endpoints gathering...");
      // The executor only retrieve "main" agents (without the keyword "executor")
      // This is NOT a standard behaviour, this is because we are using Caldera as an executor and
      // we should not
      // Will be replaced by the XTM agent
      Map<Endpoint, io.openbas.database.model.Agent> endpointsAgents =
          toEndpoint(
              this.client.agents().stream()
                  .filter(agent -> !agent.getExe_name().contains("implant"))
                  .toList());
      log.info("Caldera executor provisioning based on " + endpointsAgents.size() + " assets");
      for (var endpointAgent : endpointsAgents.entrySet()) {
        Endpoint endpoint = endpointAgent.getKey();
        io.openbas.database.model.Agent agent = endpointAgent.getValue();
        Optional<Endpoint> optionalEndpoint =
            this.endpointService.findEndpointByAgentDetails(
                endpoint.getHostname(), endpoint.getPlatform(), endpoint.getArch());
        if (agent.isActive()) {
          // Endpoint already created -> attributes to update
          if (optionalEndpoint.isPresent()) {
            Endpoint endpointToUpdate = optionalEndpoint.get();
            Optional<io.openbas.database.model.Agent> optionalAgent =
                this.agentService.getAgentByAgentDetailsForAnAsset(
                    endpointToUpdate.getId(),
                    agent.getExecutedByUser(),
                    agent.getDeploymentMode(),
                    agent.getPrivilege(),
                    CALDERA_EXECUTOR_TYPE);
            endpointToUpdate.setIps(endpoint.getIps());
            endpointToUpdate.setMacAddresses(endpoint.getMacAddresses());
            this.endpointService.updateEndpoint(endpointToUpdate);
            // Agent already created -> attributes to update
            if (optionalAgent.isPresent()) {
              io.openbas.database.model.Agent agentToUpdate = optionalAgent.get();
              agentToUpdate.setAsset(endpointToUpdate);
              clearAbilityForAgent(agentToUpdate);
              this.agentService.createOrUpdateAgent(agentToUpdate);
            } else {
              // New agent to create for the endpoint
              agent.setAsset(endpointToUpdate);
              this.agentService.createOrUpdateAgent(agent);
            }
          } else {
            // New endpoint and new agent to create
            this.endpointService.createEndpoint(endpoint);
            this.agentService.createOrUpdateAgent(agent);
          }
        } else {
          if (optionalEndpoint.isPresent()) {
            Optional<io.openbas.database.model.Agent> optionalAgent =
                    this.agentService.getAgentByAgentDetailsForAnAsset(
                            optionalEndpoint.get().getId(),
                            agent.getExecutedByUser(),
                            agent.getDeploymentMode(),
                            agent.getPrivilege(),
                            CALDERA_EXECUTOR_TYPE);
            if (optionalAgent.isPresent()) {
              io.openbas.database.model.Agent existingAgent = optionalAgent.get();
              if ((now().toEpochMilli() - agent.getLastSeen().toEpochMilli()) > DELETE_TTL) {
                log.info(
                        "Found stale endpoint "
                                + endpoint.getName()
                                + ", deleting the agent "
                                + existingAgent.getExecutedByUser()
                                + " in it...");
                this.client.deleteAgent(existingAgent);
                this.agentService.deleteAgent(existingAgent.getId());
              }
            }
          }
        }
      }
      this.platformSettingsService.cleanMessage(BannerMessage.BANNER_KEYS.CALDERA_UNAVAILABLE);
    } catch (Exception e) {
      this.platformSettingsService.errorMessage(BannerMessage.BANNER_KEYS.CALDERA_UNAVAILABLE);
    }
  }

  // -- PRIVATE --

  private Map<Endpoint, io.openbas.database.model.Agent> toEndpoint(
      @NotNull final List<Agent> agentsCaldera) {
    HashMap<Endpoint, io.openbas.database.model.Agent> endpointsAgents = new HashMap<>();
    agentsCaldera.forEach(
        agent -> {
          Endpoint endpoint = new Endpoint();
          endpoint.setName(agent.getHost());
          endpoint.setDescription("Asset collected by Caldera executor context.");
          endpoint.setIps(agent.getHost_ip_addrs());
          endpoint.setHostname(agent.getHost());
          endpoint.setPlatform(toPlatform(agent.getPlatform()));
          endpoint.setArch(toArch(agent.getArchitecture()));
          io.openbas.database.model.Agent agentEndpoint = new io.openbas.database.model.Agent();
          agentEndpoint.setExecutor(this.executor);
          agentEndpoint.setExternalReference(agent.getPaw());
          agentEndpoint.setPrivilege(io.openbas.database.model.Agent.PRIVILEGE.admin);
          agentEndpoint.setDeploymentMode(io.openbas.database.model.Agent.DEPLOYMENT_MODE.session);
          agentEndpoint.setExecutedByUser(agent.getUsername());
          agentEndpoint.setLastSeen(toInstant(agent.getLast_seen()));
          agentEndpoint.setProcessName(agent.getExe_name());
          agentEndpoint.setAsset(endpoint);
          endpointsAgents.put(endpoint, agentEndpoint);
        });
    return endpointsAgents;
  }

  private void clearAbilityForAgent(@NotNull final io.openbas.database.model.Agent existingAgent) {
    if ((now().toEpochMilli() - existingAgent.getClearedAt().toEpochMilli()) > CLEAR_TTL) {
      try {
        log.info("Clearing agent caldera " + existingAgent.getExecutedByUser());
        Iterable<Injector> injectors = injectorService.injectors();
        injectors.forEach(
            injector -> {
              if (injector.getExecutorClearCommands() != null) {
                this.calderaExecutorContextService.launchExecutorClear(injector, existingAgent);
              }
            });
        existingAgent.setClearedAt(now());
      } catch (RuntimeException e) {
        log.info("Failed clear agents");
      }
    }
  }

  @VisibleForTesting
  protected Instant toInstant(@NotNull final String lastSeen) {
    String pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'";
    DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern(pattern, Locale.getDefault());
    LocalDateTime localDateTime = LocalDateTime.parse(lastSeen, dateTimeFormatter);
    ZonedDateTime zonedDateTime = localDateTime.atZone(UTC);
    return zonedDateTime.toInstant();
  }

  @VisibleForTesting
  protected void setExecutor(Executor executor) {
    this.executor = executor;
  }
}
