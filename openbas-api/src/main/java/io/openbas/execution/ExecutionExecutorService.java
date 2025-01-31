package io.openbas.execution;

import io.openbas.database.model.*;
import io.openbas.database.model.Executor;
import io.openbas.database.model.InjectStatus;
import io.openbas.database.repository.InjectStatusRepository;
import io.openbas.executors.caldera.config.CalderaExecutorConfig;
import io.openbas.executors.caldera.service.CalderaExecutorContextService;
import io.openbas.executors.crowdstrike.config.CrowdStrikeExecutorConfig;
import io.openbas.executors.crowdstrike.service.CrowdStrikeExecutorContextService;
import io.openbas.executors.openbas.service.OpenBASExecutorContextService;
import io.openbas.executors.tanium.config.TaniumExecutorConfig;
import io.openbas.executors.tanium.service.TaniumExecutorContextService;
import io.openbas.rest.exception.AgentException;
import io.openbas.service.AssetGroupService;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
@Log
public class ExecutionExecutorService {
  private final AssetGroupService assetGroupService;
  private final CalderaExecutorConfig calderaExecutorConfig;
  private final CalderaExecutorContextService calderaExecutorContextService;
  private final TaniumExecutorConfig taniumExecutorConfig;
  private final TaniumExecutorContextService taniumExecutorContextService;
  private final CrowdStrikeExecutorConfig crowdStrikeExecutorConfig;
  private final CrowdStrikeExecutorContextService crowdStrikeExecutorContextService;
  private final OpenBASExecutorContextService openBASExecutorContextService;
  private final InjectStatusRepository injectStatusRepository;

  public void launchExecutorContext(Inject inject) {
    // First, get the assets of this injects
    List<Asset> assets =
        Stream.concat(
                inject.getAssets().stream(),
                inject.getAssetGroups().stream()
                    .flatMap(
                        assetGroup ->
                            this.assetGroupService
                                .assetsFromAssetGroup(assetGroup.getId())
                                .stream()))
            .toList();
    InjectStatus injectStatus =
        inject.getStatus().orElseThrow(() -> new IllegalArgumentException("Status should exists"));
    AtomicBoolean atLeastOneExecution = new AtomicBoolean(false);
    AtomicBoolean atOneTraceAdded = new AtomicBoolean(false);
    assets.forEach(
        asset -> {
          try {
            launchExecutorContextForAsset(inject, asset);
            atLeastOneExecution.set(true);
          } catch (AgentException e) {
            ExecutionTraceStatus traceStatus =
                e.getMessage().startsWith("Asset error")
                    ? ExecutionTraceStatus.ASSET_INACTIVE
                    : ExecutionTraceStatus.ERROR;
            injectStatus.addTrace(
                traceStatus, e.getMessage(), ExecutionTraceAction.COMPLETE, e.getAgent());
            atOneTraceAdded.set(true);
          }
        });
    // if launchExecutorContextForAsset fail for every assets we throw to manually set injectStatus
    // to error
    if (atOneTraceAdded.get()) {
      this.injectStatusRepository.save(injectStatus);
    }
    if (!atLeastOneExecution.get()) {
      throw new ExecutionExecutorException("No asset executed");
    }
  }

  private void launchExecutorContextForAsset(Inject inject, Asset asset) {
    Endpoint assetEndpoint = (Endpoint) Hibernate.unproxy(asset);
    Executor executor = assetEndpoint.getExecutor();
    if (executor == null) {
      log.log(Level.SEVERE, "Cannot find the executor for the asset " + assetEndpoint.getName());
    } else if (!assetEndpoint.getActive()) {
      throw new AgentException(
          "Asset error: " + assetEndpoint.getName() + " is inactive",
          assetEndpoint.getAgents().getFirst());
    } else {
      switch (executor.getType()) {
        case "openbas_caldera" -> {
          if (!this.calderaExecutorConfig.isEnable()) {
            throw new AgentException(
                "Fatal error: Caldera executor is not enabled",
                assetEndpoint.getAgents().getFirst());
          }
          this.calderaExecutorContextService.launchExecutorSubprocess(inject, assetEndpoint);
        }
        case "openbas_tanium" -> {
          if (!this.taniumExecutorConfig.isEnable()) {
            throw new AgentException(
                "Fatal error: Tanium executor is not enabled",
                assetEndpoint.getAgents().getFirst());
          }
          this.taniumExecutorContextService.launchExecutorSubprocess(inject, assetEndpoint);
        }
        case "openbas_crowdstrike" -> {
          if (!this.crowdStrikeExecutorConfig.isEnable()) {
            throw new AgentException(
                "Fatal error: CrowdStrike executor is not enabled",
                assetEndpoint.getAgents().getFirst());
          }
          this.crowdStrikeExecutorContextService.launchExecutorSubprocess(inject, assetEndpoint);
        }
        case "openbas_agent" ->
            this.openBASExecutorContextService.launchExecutorSubprocess(inject, assetEndpoint);
        default ->
            throw new AgentException(
                "Fatal error: Unsupported executor " + executor.getType(),
                assetEndpoint.getAgents().getFirst());
      }
    }
  }
}
