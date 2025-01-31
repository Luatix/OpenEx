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
import io.openbas.service.AgentService;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
@Log
public class ExecutionExecutorService {
  private final CalderaExecutorConfig calderaExecutorConfig;
  private final CalderaExecutorContextService calderaExecutorContextService;
  private final TaniumExecutorConfig taniumExecutorConfig;
  private final TaniumExecutorContextService taniumExecutorContextService;
  private final CrowdStrikeExecutorConfig crowdStrikeExecutorConfig;
  private final CrowdStrikeExecutorContextService crowdStrikeExecutorContextService;
  private final OpenBASExecutorContextService openBASExecutorContextService;
  private final InjectStatusRepository injectStatusRepository;
  private final AgentService agentService;

  public void launchExecutorContext(ExecutableInject executableInject, Inject inject)
      throws InterruptedException {
    // First, get the agents of this injects
    List<Agent> agents =
        this.agentService.getAgentsByAssetIds(
            inject.getAssets().stream().map(Asset::getId).collect(Collectors.toList()));
    agents.addAll(
        this.agentService.getAgentsByAssetGroupIds(
            inject.getAssetGroups().stream().map(AssetGroup::getId).collect(Collectors.toList())));
    InjectStatus injectStatus =
        inject.getStatus().orElseThrow(() -> new IllegalArgumentException("Status should exists"));
    AtomicBoolean atLeastOneExecution = new AtomicBoolean(false);
    AtomicBoolean atOneTraceAdded = new AtomicBoolean(false);
    agents.forEach(
        agent -> {
          try {
            launchExecutorContextForAgent(inject, agent);
            atLeastOneExecution.set(true);
          } catch (AgentException e) {
            ExecutionTraceStatus traceStatus =
                e.getMessage().startsWith("Agent error")
                    ? ExecutionTraceStatus.AGENT_INACTIVE
                    : ExecutionTraceStatus.ERROR;
            injectStatus.addTrace(
                traceStatus, e.getMessage(), ExecutionTraceAction.COMPLETE, e.getAgent());
            atOneTraceAdded.set(true);
          }
        });
    // if launchExecutorContextForAgent fail for every agents we throw to manually set injectStatus
    // to error
    if (atOneTraceAdded.get()) {
      this.injectStatusRepository.save(injectStatus);
    }
    if (!atLeastOneExecution.get()) {
      throw new ExecutionExecutorException("No asset executed");
    }
  }

  private void launchExecutorContextForAgent(Inject inject, Agent agent) {
    Endpoint assetEndpoint = (Endpoint) Hibernate.unproxy(agent.getAsset());
    Executor executor = agent.getExecutor();
    if (executor == null) {
      log.log(
          Level.SEVERE,
          "Cannot find the executor for the agent "
              + agent.getExecutedByUser()
              + " from the asset "
              + assetEndpoint.getName());
    } else if (!agent.isActive()) {
      throw new AgentException(
          "Agent error: agent "
              + agent.getExecutedByUser()
              + " is inactive for the asset "
              + assetEndpoint.getName(),
          agent);
    } else {
      switch (executor.getType()) {
        case "openbas_caldera" -> {
          if (!this.calderaExecutorConfig.isEnable()) {
            throw new AgentException("Fatal error: Caldera executor is not enabled", agent);
          }
          this.calderaExecutorContextService.launchExecutorSubprocess(inject, assetEndpoint, agent);
        }
        case "openbas_tanium" -> {
          if (!this.taniumExecutorConfig.isEnable()) {
            throw new AgentException("Fatal error: Tanium executor is not enabled", agent);
          }
          this.taniumExecutorContextService.launchExecutorSubprocess(inject, assetEndpoint, agent);
        }
        case "openbas_crowdstrike" -> {
          if (!this.crowdStrikeExecutorConfig.isEnable()) {
            throw new AgentException("Fatal error: CrowdStrike executor is not enabled", agent);
          }
          this.crowdStrikeExecutorContextService.launchExecutorSubprocess(
              inject, assetEndpoint, agent);
        }
        case "openbas_agent" ->
            this.openBASExecutorContextService.launchExecutorSubprocess(
                inject, assetEndpoint, agent);
        default ->
            throw new AgentException(
                "Fatal error: Unsupported executor " + executor.getType(), agent);
      }
    }
  }
}
