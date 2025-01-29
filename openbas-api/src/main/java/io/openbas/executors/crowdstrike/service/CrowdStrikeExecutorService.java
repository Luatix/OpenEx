package io.openbas.executors.crowdstrike.service;

import static java.time.Instant.now;
import static java.time.ZoneOffset.UTC;

import io.openbas.database.model.Agent;
import io.openbas.database.model.Endpoint;
import io.openbas.database.model.Executor;
import io.openbas.database.model.Injector;
import io.openbas.executors.crowdstrike.client.CrowdStrikeExecutorClient;
import io.openbas.executors.crowdstrike.config.CrowdStrikeExecutorConfig;
import io.openbas.executors.crowdstrike.model.CrowdStrikeDevice;
import io.openbas.integrations.ExecutorService;
import io.openbas.integrations.InjectorService;
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
  private static final int CLEAR_TTL = 1800000; // 30 minutes
  private static final int DELETE_TTL = 86400000; // 24 hours
  private static final String CROWDSTRIKE_EXECUTOR_TYPE = "openbas_crowdstrike";
  private static final String CROWDSTRIKE_EXECUTOR_NAME = "CrowdStrike";
  private static final String CROWDSTRIKE_EXECUTOR_DOCUMENTATION_LINK =
      "https://docs.openbas.io/latest/deployment/ecosystem/executors/#crowdstrike-falcon-agent";

  private final CrowdStrikeExecutorClient client;

  private final EndpointService endpointService;

  private final CrowdStrikeExecutorContextService crowdStrikeExecutorContextService;

  private final InjectorService injectorService;

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
      CrowdStrikeExecutorContextService crowdStrikeExecutorContextService,
      EndpointService endpointService,
      InjectorService injectorService) {
    this.client = client;
    this.endpointService = endpointService;
    this.crowdStrikeExecutorContextService = crowdStrikeExecutorContextService;
    this.injectorService = injectorService;
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
    List<Endpoint> endpoints = toEndpoint(devices);
    log.info("CrowdStrike executor provisioning based on " + endpoints.size() + " assets");
    endpoints.forEach(
        endpoint -> {
          List<Endpoint> existingEndpoints =
              this.endpointService.findAssetsForInjectionByHostname(endpoint.getHostname()).stream()
                  .filter(
                      endpoint1 ->
                          Arrays.stream(endpoint1.getIps())
                              .anyMatch(s -> Arrays.stream(endpoint.getIps()).toList().contains(s)))
                  .toList();
          if (existingEndpoints.isEmpty()) {
            Optional<Endpoint> endpointByExternalReference =
                endpointService.findByExternalReference(
                    endpoint.getAgents().getFirst().getExternalReference());
            if (endpointByExternalReference.isPresent()) {
              this.updateEndpoint(endpoint, List.of(endpointByExternalReference.get()));
            } else {
              this.endpointService.createEndpoint(endpoint);
            }
          } else {
            this.updateEndpoint(endpoint, existingEndpoints);
          }
        });
    List<Endpoint> inactiveEndpoints =
        toEndpoint(devices).stream().filter(endpoint -> !endpoint.getActive()).toList();
    inactiveEndpoints.forEach(
        endpoint -> {
          Optional<Endpoint> optionalExistingEndpoint =
              this.endpointService.findByExternalReference(
                  endpoint.getAgents().getFirst().getExternalReference());
          if (optionalExistingEndpoint.isPresent()) {
            Endpoint existingEndpoint = optionalExistingEndpoint.get();
            if ((now().toEpochMilli() - existingEndpoint.getClearedAt().toEpochMilli())
                > DELETE_TTL) {
              log.info("Found stale endpoint " + existingEndpoint.getName() + ", deleting it...");
              this.endpointService.deleteEndpoint(existingEndpoint.getId());
            }
          }
        });
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

  private void updateEndpoint(
      @NotNull final Endpoint external, @NotNull final List<Endpoint> existingList) {
    Endpoint matchingExistingEndpoint = existingList.getFirst();
    matchingExistingEndpoint
        .getAgents()
        .getFirst()
        .setLastSeen(external.getAgents().getFirst().getLastSeen());
    matchingExistingEndpoint.setName(external.getName());
    matchingExistingEndpoint.setIps(external.getIps());
    matchingExistingEndpoint.setHostname(external.getHostname());
    matchingExistingEndpoint
        .getAgents()
        .getFirst()
        .setExternalReference(external.getAgents().getFirst().getExternalReference());
    matchingExistingEndpoint.setPlatform(external.getPlatform());
    matchingExistingEndpoint.setArch(external.getArch());
    matchingExistingEndpoint.getAgents().getFirst().setExecutor(this.executor);
    if ((now().toEpochMilli() - matchingExistingEndpoint.getClearedAt().toEpochMilli())
        > CLEAR_TTL) {
      try {
        log.info("Clearing endpoint " + matchingExistingEndpoint.getHostname());
        Iterable<Injector> injectors = injectorService.injectors();
        injectors.forEach(
            injector -> {
              if (injector.getExecutorClearCommands() != null) {
                this.crowdStrikeExecutorContextService.launchExecutorClear(
                    injector, matchingExistingEndpoint);
              }
            });
        matchingExistingEndpoint.setClearedAt(now());
      } catch (RuntimeException e) {
        log.info("Failed clear agents");
      }
    }
    this.endpointService.updateEndpoint(matchingExistingEndpoint);
  }

  private Instant toInstant(@NotNull final String lastSeen) {
    String pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'";
    DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern(pattern, Locale.getDefault());
    LocalDateTime localDateTime = LocalDateTime.parse(lastSeen, dateTimeFormatter);
    ZonedDateTime zonedDateTime = localDateTime.atZone(UTC);
    return zonedDateTime.toInstant();
  }
}
