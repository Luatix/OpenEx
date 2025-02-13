package io.openbas.injectors.caldera.service;

import static java.time.Instant.now;

import io.openbas.injectors.caldera.client.CalderaInjectorClient;
import io.openbas.injectors.caldera.client.model.Agent;
import io.openbas.service.AgentService;
import io.openbas.utils.Time;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Log
@Service
public class CalderaGarbageCollectorService implements Runnable {
  private final int KILL_TTL = 900000; // 15 min
  private final int DELETE_TTL = 1200000; // 20 min

  private final CalderaInjectorClient client;
  private final AgentService agentService;

  @Autowired
  public CalderaGarbageCollectorService(CalderaInjectorClient client, AgentService agentService) {
    this.client = client;
    this.agentService = agentService;
  }

  @Override
  public void run() {
    log.info("Running Caldera injector garbage collector...");
    List<io.openbas.database.model.Agent> agents = this.agentService.getAgentsForExecution();
    log.info("Running Caldera injector garbage collector on " + agents.size() + " agents");
    agents.forEach(
        agent -> {
          if ((now().toEpochMilli() - agent.getCreatedAt().toEpochMilli()) > DELETE_TTL) {
            this.agentService.deleteAgent(agent.getId());
          }
        });
    List<Agent> agentsCaldera = this.client.agents();
    log.info("Running Caldera injector garbage collector on " + agentsCaldera.size() + " agents");
    List<String> killedAgents = new ArrayList<>();
    agentsCaldera.forEach(
        agentCaldera -> {
          if (agentCaldera.getExe_name().contains("implant")
              && (now().toEpochMilli() - Time.toInstant(agentCaldera.getCreated()).toEpochMilli())
                  > KILL_TTL
              && (now().toEpochMilli() - Time.toInstant(agentCaldera.getLast_seen()).toEpochMilli())
                  < KILL_TTL) {
            try {
              log.info("Killing agent " + agentCaldera.getHost());
              client.killAgent(agentCaldera);
              killedAgents.add(agentCaldera.getPaw());
            } catch (RuntimeException e) {
              log.info("Failed to kill agent, probably already killed");
            }
          }
        });
    agentsCaldera.forEach(
        agentCaldera -> {
          if (agentCaldera.getExe_name().contains("implant")
              && (now().toEpochMilli() - Time.toInstant(agentCaldera.getCreated()).toEpochMilli())
                  > DELETE_TTL
              && !killedAgents.contains(agentCaldera.getPaw())) {
            try {
              log.info("Deleting agent " + agentCaldera.getHost());
              client.deleteAgent(agentCaldera);
            } catch (RuntimeException e) {
              log.severe("Failed to delete agent");
            }
          }
        });
  }
}
