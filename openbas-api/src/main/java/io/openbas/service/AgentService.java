package io.openbas.service;

import io.openbas.database.model.Agent;
import io.openbas.database.repository.AgentRepository;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class AgentService {

  private final AgentRepository agentRepository;

  public List<Agent> getAgentsByAssetIds(List<String> assetIds) {
    return agentRepository.findByAssetIds(assetIds);
  }

  public List<Agent> getAgentsByAssetGroupIds(List<String> assetGroupIds) {
    return agentRepository.findByAssetGroupIds(assetGroupIds);
  }

  public Map<String, List<Agent>> getAgentsGroupedByAsset(List<String> assetIds) {
    List<Agent> agents = agentRepository.findByAssetIds(assetIds);

    return agents.stream()
            .filter(Agent::isActive)
            .collect(Collectors.groupingBy(agent -> agent.getAsset().getId()));
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

  public Agent createOrUpdateAgent(@NotNull final Agent agent) {
    return this.agentRepository.save(agent);
  }

  public void deleteAgent(@NotBlank final String agentId) { this.agentRepository.deleteById(agentId); }
}
