package io.openbas.scheduler.jobs;

import io.openbas.telemetry.OpenTelemetryService;
import lombok.RequiredArgsConstructor;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.stereotype.Component;

@Component
@DisallowConcurrentExecution
@RequiredArgsConstructor
public class TelemetryExecutionJob implements Job {

  private final OpenTelemetryService openTelemetryService;

  @Override
  public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
    this.openTelemetryService.registerMetric();
  }

}
