package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Setter
@Getter
@Entity
@Table(name = "injects_tests_statuses")
public class InjectTestStatus extends BaseInjectStatus implements Base {

  @JsonProperty("inject_id")
  public String getInjectId() {
    return inject.getId();
  }

  @JsonProperty("inject_title")
  public String getInjectTitle() {
    return inject.getTitle();
  }

  @JsonProperty("injector_contract")
  public Optional<InjectorContract> getInjectContract() {
    return inject.getInjectorContract();
  }

  @JsonProperty("inject_type")
  private String getType() {
    return inject
        .getInjectorContract()
        .map(InjectorContract::getInjector)
        .map(Injector::getType)
        .orElse(null);
  }

  @OneToMany(
      mappedBy = "injectTestStatus",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.EAGER)
  @JsonProperty("status_traces")
  private List<ExecutionTraces> traces = new ArrayList<>();

  @CreationTimestamp
  @Column(name = "status_created_at")
  @JsonProperty("inject_test_status_created_at")
  private Instant testCreationDate;

  @UpdateTimestamp
  @Column(name = "status_updated_at")
  @JsonProperty("inject_test_status_updated_at")
  private Instant testUpdateDate;

  public static InjectTestStatus fromExecutionTest(Execution execution) {
    InjectTestStatus injectTestStatus = new InjectTestStatus();
    injectTestStatus.setTrackingSentDate(Instant.now());
    injectTestStatus.getTraces().addAll(execution.getTraces());
    if (!execution.getTraces().isEmpty()) {
      List<ExecutionTraces> traces =
          execution.getTraces().stream()
              .peek(t -> t.setInjectTestStatus(injectTestStatus))
              .toList();
      injectTestStatus.getTraces().addAll(traces);
    }

    int numberOfError =
        (int)
            execution.getTraces().stream()
                .filter(ex -> ExecutionTraceStatus.ERROR.equals(ex.getStatus()))
                .count();
    int numberOfSuccess =
        (int)
            execution.getTraces().stream()
                .filter(ex -> ExecutionTraceStatus.SUCCESS.equals(ex.getStatus()))
                .count();
    ExecutionStatus globalStatus =
        numberOfSuccess > 0 ? ExecutionStatus.SUCCESS : ExecutionStatus.ERROR;
    ExecutionStatus finalStatus =
        numberOfError > 0 && numberOfSuccess > 0 ? ExecutionStatus.PARTIAL : globalStatus;
    injectTestStatus.setName(execution.isAsync() ? ExecutionStatus.PENDING : finalStatus);
    injectTestStatus.setTrackingEndDate(Instant.now());
    return injectTestStatus;
  }
}
