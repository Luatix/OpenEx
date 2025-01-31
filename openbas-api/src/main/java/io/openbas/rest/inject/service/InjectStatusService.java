package io.openbas.rest.inject.service;

import static java.time.Instant.now;

import io.openbas.database.model.*;
import io.openbas.database.model.InjectStatus;
import io.openbas.database.repository.AgentRepository;
import io.openbas.database.repository.InjectRepository;
import io.openbas.database.repository.InjectStatusRepository;
import io.openbas.rest.exception.ElementNotFoundException;
import io.openbas.rest.inject.form.InjectExecutionAction;
import io.openbas.rest.inject.form.InjectExecutionInput;
import io.openbas.rest.inject.form.InjectUpdateStatusInput;
import io.openbas.utils.InjectUtils;
import jakarta.annotation.Nullable;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class InjectStatusService {
  private final InjectRepository injectRepository;
  private final AgentRepository agentRepository;
  private final InjectUtils injectUtils;
  private final InjectStatusRepository injectStatusRepository;
  private final InjectService injectService;

  public List<InjectStatus> findPendingInjectStatusByType(String injectType) {
    return this.injectStatusRepository.pendingForInjectType(injectType);
  }

  @Transactional(rollbackOn = Exception.class)
  public Inject updateInjectStatus(String injectId, InjectUpdateStatusInput input) {
    Inject inject = injectRepository.findById(injectId).orElseThrow();
    // build status
    InjectStatus injectStatus = new InjectStatus();
    injectStatus.setInject(inject);
    injectStatus.setTrackingSentDate(now());
    injectStatus.setName(ExecutionStatus.valueOf(input.getStatus()));
    // Save status for inject
    inject.setStatus(injectStatus);
    return injectRepository.save(inject);
  }

  private ExecutionTraceStatus convertExecutionStatus(ExecutionStatus status) {
    return switch (status) {
      case SUCCESS -> ExecutionTraceStatus.SUCCESS;
      case ERROR -> ExecutionTraceStatus.ERROR;
      case MAYBE_PREVENTED -> ExecutionTraceStatus.MAYBE_PREVENTED;
      case PARTIAL -> ExecutionTraceStatus.PARTIAL;
      case MAYBE_PARTIAL_PREVENTED -> ExecutionTraceStatus.MAYBE_PARTIAL_PREVENTED;
      default -> null;
    };
  }

  private ExecutionTraceAction convertExecutionAction(InjectExecutionAction status) {
    return switch (status) {
      case InjectExecutionAction.prerequisite_check -> ExecutionTraceAction.PREREQUISITE_CHECK;
      case InjectExecutionAction.prerequisite_execution ->
          ExecutionTraceAction.PREREQUISITE_EXECUTION;
      case InjectExecutionAction.cleanup_execution -> ExecutionTraceAction.CLEANUP_EXECUTION;
      case InjectExecutionAction.complete -> ExecutionTraceAction.COMPLETE;
      default -> ExecutionTraceAction.EXECUTION;
    };
  }

  private int getCompleteTrace(Inject inject) {
    return inject.getStatus().map(InjectStatus::getTraces).orElse(Collections.emptyList()).stream()
        .filter(trace -> ExecutionTraceAction.COMPLETE.equals(trace.getAction()))
        .toList()
        .size();
  }

  public boolean isAllInjectAssetsExecuted(Inject inject) {
    int totalCompleteTrace = getCompleteTrace(inject);
    Map<Asset, Boolean> assets = this.injectService.resolveAllAssetsToExecute(inject);
    return assets.size() == totalCompleteTrace;
  }

  public void updateFinalInjectStatus(InjectStatus injectStatus, Instant finishTime) {
    ExecutionStatus finalStatus =
        computeStatus(
            injectStatus.getTraces().stream()
                .filter(t -> ExecutionTraceAction.COMPLETE.equals(t.getAction()))
                .toList());

    injectStatus.addTrace(
        ExecutionTraceStatus.INFO, "Process finished", ExecutionTraceAction.COMPLETE, null);
    injectStatus.setTrackingEndDate(finishTime == null ? Instant.now() : finishTime);
    injectStatus.setName(finalStatus);
    injectStatus.getInject().setUpdatedAt(Instant.now());
  }

  public ExecutionTraces createExecutionTrace(
      InjectStatus injectStatus, InjectExecutionInput input, Agent agent) {
    ExecutionTraceAction executionAction = convertExecutionAction(input.getAction());
    ExecutionTraceStatus traceStatus = ExecutionTraceStatus.valueOf(input.getStatus());
    return new ExecutionTraces(
        injectStatus, traceStatus, null, input.getMessage(), executionAction, agent);
  }

  private void computeExecutionTraceStatusIfNeeded(
      InjectStatus injectStatus, ExecutionTraces executionTraces, String agentId) {
    if (agentId != null && executionTraces.getAction().equals(ExecutionTraceAction.COMPLETE)) {
      ExecutionTraceStatus traceStatus =
          convertExecutionStatus(
              computeStatus(
                  injectStatus.getTraces().stream()
                      .filter(t -> t.getAgent().getId().equals(agentId))
                      .toList()));
      executionTraces.setStatus(traceStatus);
    }
  }

  public Inject handleInjectExecutionCallback(
      String injectId, String agentId, InjectExecutionInput input) {
    Inject inject = injectRepository.findById(injectId).orElseThrow(ElementNotFoundException::new);
    Agent agent =
        agentId == null
            ? null
            : agentRepository.findById(agentId).orElseThrow(ElementNotFoundException::new);
    InjectStatus injectStatus = inject.getStatus().orElseThrow(ElementNotFoundException::new);

    ExecutionTraces executionTraces = createExecutionTrace(injectStatus, input, agent);
    computeExecutionTraceStatusIfNeeded(injectStatus, executionTraces, agentId);
    injectStatus.addTrace(executionTraces);

    if (executionTraces.getAction().equals(ExecutionTraceAction.COMPLETE)
        && (agentId == null || isAllInjectAssetsExecuted(inject))) {
      updateFinalInjectStatus(injectStatus, now());
    }
    return injectRepository.save(inject);
  }

  public ExecutionStatus computeStatus(List<ExecutionTraces> traces) {
    ExecutionStatus executionStatus;
    int successCount = 0, errorCount = 0, partialCount = 0, maybePreventedCount = 0;

    for (ExecutionTraces trace : traces) {
      switch (trace.getStatus()) {
        case SUCCESS, WARNING -> successCount++;
        case PARTIAL -> partialCount++;
        case ERROR, COMMAND_NOT_FOUND, ASSET_INACTIVE -> errorCount++;
        case MAYBE_PREVENTED, MAYBE_PARTIAL_PREVENTED, COMMAND_CANNOT_BE_EXECUTED ->
            maybePreventedCount++;
      }
    }

    if (successCount > 0 && errorCount == 0 && maybePreventedCount == 0 && partialCount == 0) {
      executionStatus = ExecutionStatus.SUCCESS;
    } else if (errorCount > 0
        && successCount == 0
        && maybePreventedCount == 0
        && partialCount == 0) {
      executionStatus = ExecutionStatus.ERROR;
    } else if (maybePreventedCount > 0
        && successCount == 0
        && errorCount == 0
        && partialCount == 0) {
      executionStatus = ExecutionStatus.MAYBE_PREVENTED;
    } else if (partialCount > 0 && errorCount == 0 && maybePreventedCount == 0
        || successCount > 0) {
      executionStatus = ExecutionStatus.PARTIAL;
    } else {
      executionStatus = ExecutionStatus.MAYBE_PARTIAL_PREVENTED;
    }
    return executionStatus;
  }

  public InjectStatus fromExecution(Execution execution, Inject executedInject) {
    InjectStatus injectStatus = executedInject.getStatus().orElse(new InjectStatus());
    injectStatus.setTrackingSentDate(Instant.now());
    injectStatus.setInject(executedInject);

    if (!execution.getTraces().isEmpty()) {
      List<ExecutionTraces> traces =
          execution.getTraces().stream().peek(t -> t.setInjectStatus(injectStatus)).toList();
      injectStatus.getTraces().addAll(traces);
    }

    if (execution.isAsync()) {
      injectStatus.setName(ExecutionStatus.PENDING);
    } else {
      updateFinalInjectStatus(injectStatus, now());
    }

    return injectStatus;
  }

  private InjectStatus getOrInitializeInjectStatus(Inject inject) {
    return inject
        .getStatus()
        .orElseGet(
            () -> {
              InjectStatus newStatus = new InjectStatus();
              newStatus.setInject(inject);
              newStatus.setTrackingSentDate(Instant.now());
              return newStatus;
            });
  }

  public InjectStatus failInjectStatus(@NotNull String injectId, @Nullable String message) {
    Inject inject = this.injectRepository.findById(injectId).orElseThrow();
    InjectStatus injectStatus = getOrInitializeInjectStatus(inject);
    if (message != null) {
      injectStatus.addErrorTrace(message, ExecutionTraceAction.COMPLETE);
    }
    injectStatus.setName(ExecutionStatus.ERROR);
    injectStatus.setTrackingEndDate(Instant.now());
    injectStatus.setPayloadOutput(injectUtils.getStatusPayloadFromInject(inject));
    return injectStatusRepository.save(injectStatus);
  }

  @Transactional
  public InjectStatus initializeInjectStatus(
      @NotNull String injectId, @NotNull ExecutionStatus status) {
    Inject inject = this.injectRepository.findById(injectId).orElseThrow();
    InjectStatus injectStatus = getOrInitializeInjectStatus(inject);
    injectStatus.setName(status);
    injectStatus.setTrackingSentDate(Instant.now());
    injectStatus.setPayloadOutput(injectUtils.getStatusPayloadFromInject(inject));
    return injectStatusRepository.save(injectStatus);
  }
}
