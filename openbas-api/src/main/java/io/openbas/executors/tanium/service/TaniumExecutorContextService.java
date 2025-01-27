package io.openbas.executors.tanium.service;

import static io.openbas.executors.ExecutorHelper.replaceArgs;

import io.openbas.database.model.*;
import io.openbas.executors.tanium.client.TaniumExecutorClient;
import io.openbas.executors.tanium.config.TaniumExecutorConfig;
import jakarta.validation.constraints.NotNull;
import java.util.Base64;
import java.util.Objects;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Log
@Service
public class TaniumExecutorContextService {
  private TaniumExecutorConfig taniumExecutorConfig;

  private TaniumExecutorClient taniumExecutorClient;

  @Autowired
  public void setTaniumExecutorConfig(TaniumExecutorConfig taniumExecutorConfig) {
    this.taniumExecutorConfig = taniumExecutorConfig;
  }

  @Autowired
  public void setTaniumExecutorClient(TaniumExecutorClient taniumExecutorClient) {
    this.taniumExecutorClient = taniumExecutorClient;
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

    Integer packageId =
        switch (platform) {
          case Windows -> this.taniumExecutorConfig.getWindowsPackageId();
          case Linux, MacOS -> this.taniumExecutorConfig.getUnixPackageId();
          default -> throw new RuntimeException("Unsupported platform: " + platform);
        };

    String executorCommandKey = platform.name() + "." + arch.name();
    String command = injector.getExecutorCommands().get(executorCommandKey);
    command = replaceArgs(platform, command, inject.getId(), agent.getId());

    this.taniumExecutorClient.executeAction(
        agent.getExternalReference(),
        packageId,
        Base64.getEncoder().encodeToString(command.getBytes()));
  }

  public void launchExecutorClear(@NotNull final Injector injector, @NotNull final Asset asset) {}
}
