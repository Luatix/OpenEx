package io.openbas.service;

import io.openbas.database.model.Agent;
import io.openbas.database.model.ExecutionTraceStatus;
import io.openbas.database.model.Inject;
import io.openbas.database.model.InjectStatus;
import io.openbas.database.repository.AgentRepository;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class AgentService {

  private final AgentRepository agentRepository;

  public List<Agent> getAgentsByInjectId(String injectId) {
    return agentRepository.findByInjectId(injectId);
  }

  public Optional<Agent> getAgentByAgentDetailsForAnAsset(
      String assetId,
      String user,
      Agent.DEPLOYMENT_MODE deploymentMode,
      Agent.PRIVILEGE privilege,
      String executor) {
    return agentRepository.findByAssetExecutorUserDeploymentAndPrivilege(
        assetId, user, deploymentMode.name(), privilege.name(), executor);
  }

  public List<Agent> getAgentsForExecution() {
    return agentRepository.findForExecution();
  }

  public Agent createOrUpdateAgent(@NotNull final Agent agent) {
    return this.agentRepository.save(agent);
  }

  public void deleteAgent(@NotBlank final String agentId) {
    this.agentRepository.deleteByAgentId(agentId);
  }

  public Optional<Agent> findByExternalReference(String externalReference) {
    return agentRepository.findByExternalReference(externalReference);
  }

  public static boolean hasOnlyValidTraces(Inject inject, io.openbas.database.model.Agent agent) {
    return inject
        .getStatus()
        .map(InjectStatus::getTraces)
        .map(
            traces ->
                Boolean.valueOf(
                    traces.stream()
                        .noneMatch(
                            trace ->
                                trace.getAgent() != null
                                    && trace.getAgent().getId().equals(agent.getId())
                                    && (ExecutionTraceStatus.ERROR.equals(trace.getStatus())
                                        || ExecutionTraceStatus.AGENT_INACTIVE.equals(
                                            trace.getStatus())))))
        .orElse(Boolean.TRUE)
        .booleanValue(); // If there are no traces, return true by default
  }
}
