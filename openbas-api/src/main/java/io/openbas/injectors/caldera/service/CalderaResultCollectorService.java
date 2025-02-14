package io.openbas.injectors.caldera.service;

import io.openbas.database.model.*;
import io.openbas.database.model.InjectStatus;
import io.openbas.database.repository.InjectRepository;
import io.openbas.injectors.caldera.CalderaContract;
import io.openbas.injectors.caldera.model.ResultStatus;
import io.openbas.rest.inject.service.InjectStatusService;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Log
@Service
public class CalderaResultCollectorService implements Runnable {
  private final int EXPIRATION_TIME = 900;

  private final InjectRepository injectRepository;
  private final CalderaInjectorService calderaService;
  private final InjectStatusService injectStatusService;

  @Autowired
  public CalderaResultCollectorService(
      InjectRepository injectRepository,
      CalderaInjectorService calderaService,
      InjectStatusService injectStatusService) {
    this.injectRepository = injectRepository;
    this.calderaService = calderaService;
    this.injectStatusService = injectStatusService;
  }

  @Override
  @Transactional
  public void run() {
    // Retrieve Caldera inject not done
    List<InjectStatus> injectStatuses =
        this.injectStatusService.findPendingInjectStatusByType(CalderaContract.TYPE);
    // For each one ask for traces and status
    injectStatuses.forEach(
        (injectStatus -> {
          log.log(Level.INFO, "Found inject status: " + injectStatus.getId());
          Map<String, Agent> linksMap = injectStatus.getStatusMapIdentifierAgent();

          log.log(Level.INFO, "Found links IDs: " + linksMap.keySet());
          ResultStatus resultStatus = new ResultStatus();
          for (Map.Entry<String, Agent> entry : linksMap.entrySet()) {
            try {
              log.log(Level.INFO, "Trying to get result for " + entry.getKey());
              resultStatus = this.calderaService.results(entry.getKey());
            } catch (Exception e) {
              injectStatus.addMayBePreventedTrace(
                  "Cannot get result for linkID " + entry.getKey() + ", injection has failed",
                  ExecutionTraceAction.COMPLETE,
                  entry.getValue());
              log.log(
                  Level.INFO,
                  "Cannot get result for linkID " + entry.getKey() + ", injection has failed");
            }

            if (resultStatus.getPaw() == null
                && injectStatus
                    .getTrackingSentDate()
                    .isBefore(Instant.now().minus(EXPIRATION_TIME / 60, ChronoUnit.MINUTES))) {
              injectStatus.addMayBePreventedTrace(
                  "Cannot get result for linkID " + entry.getKey() + ", injection has failed",
                  ExecutionTraceAction.COMPLETE,
                  entry.getValue());
              log.log(
                  Level.INFO,
                  "Cannot get result for linkID " + entry.getKey() + ", injection has failed");

            } else if (resultStatus.getPaw() != null
                && resultStatus.isComplete()
                && resultStatus.isFail()) {
              injectStatus.addTrace(
                  new ExecutionTraces(
                      injectStatus,
                      ExecutionTraceStatus.MAYBE_PREVENTED,
                      List.of(),
                      "Failed result for linkID "
                          + entry.getKey()
                          + " ("
                          + resultStatus.getContent()
                          + ")",
                      ExecutionTraceAction.COMPLETE,
                      entry.getValue(),
                      resultStatus.getFinish()));

            } else if (resultStatus.getPaw() != null
                && resultStatus.isComplete()
                && !resultStatus.isFail()) {
              injectStatus.addTrace(
                  new ExecutionTraces(
                      injectStatus,
                      ExecutionTraceStatus.SUCCESS,
                      List.of(),
                      "Success result for linkID "
                          + entry.getKey()
                          + " ("
                          + resultStatus.getContent()
                          + ")",
                      ExecutionTraceAction.COMPLETE,
                      entry.getValue(),
                      resultStatus.getFinish()));

            } else if (resultStatus.getPaw() != null
                && !resultStatus.isComplete()
                && injectStatus
                    .getTrackingSentDate()
                    .isBefore(Instant.now().minus(5L, ChronoUnit.MINUTES))) {

              injectStatus.addTrace(
                  new ExecutionTraces(
                      injectStatus,
                      ExecutionTraceStatus.MAYBE_PREVENTED,
                      List.of(),
                      "Timeout on linkID " + entry.getKey() + ", injection has failed",
                      ExecutionTraceAction.COMPLETE,
                      entry.getValue(),
                      resultStatus.getFinish()));

              log.log(Level.INFO, "Timeout on linkID " + entry.getKey() + ", injection has failed");
            }
          }

          Inject relatedInject = injectStatus.getInject();
          if (injectStatusService.isAllInjectAgentsExecuted(relatedInject)) {
            injectStatusService.updateFinalInjectStatus(injectStatus);
          }

          injectRepository.save(relatedInject);
        }));
  }
}
