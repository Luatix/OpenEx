package io.openbas.utils;

import static java.util.Collections.emptyList;
import static java.util.Collections.emptySet;

import io.openbas.database.model.Agent;
import io.openbas.database.model.Endpoint;
import io.openbas.database.model.Tag;
import io.openbas.rest.asset.endpoint.form.AgentOutput;
import io.openbas.rest.asset.endpoint.form.EndpointOutput;
import io.openbas.rest.asset.endpoint.form.EndpointOverviewOutput;
import io.openbas.rest.asset.endpoint.form.ExecutorOutput;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EndpointMapper {

  public EndpointOutput toEndpointOutput(Endpoint endpoint) {
    return EndpointOutput.builder()
        .id(endpoint.getId())
        .name(endpoint.getName())
        .type(endpoint.getType())
        .agents(
            toAgentOutputs(
                endpoint.getAgents().stream()
                    .filter(agent -> agent.getParent() == null && agent.getInject() == null)
                    .collect(Collectors.toList())))
        .platform(endpoint.getPlatform())
        .arch(endpoint.getArch())
        .tags(endpoint.getTags().stream().map(Tag::getId).collect(Collectors.toSet()))
        .build();
  }

  public EndpointOverviewOutput toEndpointOverviewOutput(Endpoint endpoint) {
    return EndpointOverviewOutput.builder()
        .id(endpoint.getId())
        .name(endpoint.getName())
        .description(endpoint.getDescription())
        .hostname(endpoint.getHostname())
        .platform(endpoint.getPlatform())
        .arch(endpoint.getArch())
        .ips(
            endpoint.getIps() != null
                ? new HashSet<>(Arrays.asList(endpoint.getIps()))
                : emptySet())
        .macAddresses(
            endpoint.getMacAddresses() != null
                ? new HashSet<>(Arrays.asList(endpoint.getMacAddresses()))
                : emptySet())
        .agents(
            toAgentOutputs(
                endpoint.getAgents().stream()
                    .filter(agent -> agent.getParent() == null && agent.getInject() == null)
                    .collect(Collectors.toList())))
        .tags(endpoint.getTags().stream().map(Tag::getId).collect(Collectors.toSet()))
        .build();
  }

  private Set<AgentOutput> toAgentOutputs(List<Agent> agents) {
    return Optional.ofNullable(agents).orElse(emptyList()).stream()
        .map(this::toAgentOutput)
        .collect(Collectors.toSet());
  }

  private AgentOutput toAgentOutput(Agent agent) {
    AgentOutput.AgentOutputBuilder builder =
        AgentOutput.builder()
            .id(agent.getId())
            .privilege(agent.getPrivilege())
            .deploymentMode(agent.getDeploymentMode())
            .executedByUser(agent.getExecutedByUser())
            .isActive(agent.isActive())
            .lastSeen(agent.getLastSeen());

    if (agent.getExecutor() != null) {
      builder.executor(
          ExecutorOutput.builder()
              .id(agent.getExecutor().getId())
              .name(agent.getExecutor().getName())
              .type(agent.getExecutor().getType())
              .build());
    }
    return builder.build();
  }
}
