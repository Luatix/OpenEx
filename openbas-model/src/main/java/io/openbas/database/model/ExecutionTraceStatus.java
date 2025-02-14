package io.openbas.database.model;

public enum ExecutionTraceStatus {
  SUCCESS,
  ERROR,

  // Implant Status
  MAYBE_PREVENTED,
  COMMAND_NOT_FOUND,
  COMMAND_CANNOT_BE_EXECUTED,
  WARNING,

  // INJECT/ASSET STATUS
  PARTIAL,
  MAYBE_PARTIAL_PREVENTED,

  // Other informations
  AGENT_INACTIVE,
  INFO,
}
