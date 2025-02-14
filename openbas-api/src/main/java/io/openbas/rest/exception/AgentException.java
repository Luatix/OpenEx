package io.openbas.rest.exception;

import io.openbas.database.model.Agent;
import lombok.Getter;

@Getter
public class AgentException extends Exception {
  private final Agent agent;

  public AgentException(String message, Agent agent) {
    super(message);
    this.agent = agent;
  }
}
