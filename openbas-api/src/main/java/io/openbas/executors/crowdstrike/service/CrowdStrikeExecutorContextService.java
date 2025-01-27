package io.openbas.executors.crowdstrike.service;

import static io.openbas.executors.ExecutorHelper.replaceArgs;

import io.openbas.database.model.*;
import io.openbas.executors.crowdstrike.client.CrowdStrikeExecutorClient;
import io.openbas.executors.crowdstrike.config.CrowdStrikeExecutorConfig;
import jakarta.validation.constraints.NotNull;
import java.util.Base64;
import java.util.Objects;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Log
@Service
public class CrowdStrikeExecutorContextService {
  private CrowdStrikeExecutorConfig crowdStrikeExecutorConfig;

  private CrowdStrikeExecutorClient crowdStrikeExecutorClient;

  @Autowired
  public void setCrowdStrikeExecutorConfig(CrowdStrikeExecutorConfig crowdStrikeExecutorConfig) {
    this.crowdStrikeExecutorConfig = crowdStrikeExecutorConfig;
  }

  @Autowired
  public void setCrowdStrikeExecutorClient(CrowdStrikeExecutorClient crowdStrikeExecutorClient) {
    this.crowdStrikeExecutorClient = crowdStrikeExecutorClient;
  }

  public void launchExecutorSubprocess(
      @NotNull final Inject inject,
      @NotNull final Endpoint assetEndpoint,
      @NotNull final Agent agent) {
    Injector injector =
        inject
            .getInjectorContract()
            .map(InjectorContract::getInjector)
            .orElseThrow(
                () -> new UnsupportedOperationException("Inject does not have a contract"));

    Endpoint.PLATFORM_TYPE platform =
        Objects.equals(assetEndpoint.getType(), "Endpoint") ? assetEndpoint.getPlatform() : null;
    Endpoint.PLATFORM_ARCH arch =
        Objects.equals(assetEndpoint.getType(), "Endpoint") ? assetEndpoint.getArch() : null;
    if (platform == null || arch == null) {
      throw new RuntimeException("Unsupported platform: " + platform + " (arch:" + arch + ")");
    }

    String scriptName =
        switch (platform) {
          case Windows -> this.crowdStrikeExecutorConfig.getWindowsScriptName();
          case Linux, MacOS -> this.crowdStrikeExecutorConfig.getUnixScriptName();
          default -> throw new RuntimeException("Unsupported platform: " + platform);
        };

    String executorCommandKey = platform.name() + "." + arch.name();
    String command = injector.getExecutorCommands().get(executorCommandKey);

    command = replaceArgs(platform, command, inject.getId(), agent.getId());

    this.crowdStrikeExecutorClient.executeAction(
        agent.getExternalReference(),
        scriptName,
        Base64.getEncoder().encodeToString(command.getBytes()));
  }

  public void launchExecutorClear(@NotNull final Injector injector, @NotNull final Asset asset) {}
}
