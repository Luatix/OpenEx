package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Type;

@Setter
@Getter
@Entity
@Table(name = "injects_statuses")
public class InjectStatus extends BaseInjectStatus {

  // commands lines tracking
  @Type(JsonType.class)
  @Column(name = "status_payload_output", columnDefinition = "json")
  @JsonProperty("status_payload_output")
  private StatusPayload payloadOutput;

  @OneToMany(
      mappedBy = "injectStatus",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.EAGER)
  @JsonProperty("status_traces")
  private List<ExecutionTraces> traces = new ArrayList<>();

  // region transient
  public List<String> statusIdentifiers() {
    return this.getTraces().stream().flatMap(ex -> ex.getIdentifiers().stream()).toList();
  }

  public Map<String, Agent> getStatusMapIdentifierAgent() {
    Map<String, Agent> info = new HashMap<>();
    this.getTraces()
        .forEach(
            t -> {
              if (t.getAgent() != null
                  && t.getIdentifiers() != null
                  && !t.getIdentifiers().isEmpty()) {
                info.put(t.getIdentifiers().getFirst(), t.getAgent());
              }
            });
    return info;
  }

  public void addTrace(ExecutionTraces trace) {
    this.getTraces().add(trace);
  }

  public void addTrace(
      ExecutionTraceStatus status, String message, ExecutionTraceAction action, Agent agent) {
    ExecutionTraces newTrace = new ExecutionTraces(this, status, List.of(), message, action, agent);
    this.getTraces().add(newTrace);
  }

  public void addMayBePreventedTrace(String message, ExecutionTraceAction action, Agent agent) {
    ExecutionTraces newTrace =
        new ExecutionTraces(
            this, ExecutionTraceStatus.MAYBE_PREVENTED, List.of(), message, action, agent);
    this.getTraces().add(newTrace);
  }

  public void addSuccess(String message, ExecutionTraceAction action, Agent agent) {
    ExecutionTraces newTrace =
        new ExecutionTraces(this, ExecutionTraceStatus.SUCCESS, List.of(), message, action, agent);
    this.getTraces().add(newTrace);
  }

  public void addErrorTrace(String message, ExecutionTraceAction action) {
    ExecutionTraces newTrace =
        new ExecutionTraces(this, ExecutionTraceStatus.ERROR, List.of(), message, action, null);
    this.getTraces().add(newTrace);
  }

  public void addInfoTrace(String message, ExecutionTraceAction action) {
    ExecutionTraces newTrace =
        new ExecutionTraces(this, ExecutionTraceStatus.INFO, List.of(), message, action, null);
    this.getTraces().add(newTrace);
  }
}
