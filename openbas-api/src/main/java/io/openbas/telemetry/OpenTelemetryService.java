package io.openbas.telemetry;

import io.opentelemetry.api.metrics.DoubleGaugeBuilder;
import io.opentelemetry.api.metrics.DoubleHistogram;
import io.opentelemetry.api.metrics.Meter;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class OpenTelemetryService {

  private static final String PREFIX_PRODUCT = "openbas.app.";

  private final Meter meter;
  private final ServiceCounter serviceCounter;

  private DoubleHistogram sessionHistogram;
  private DoubleHistogram simulationHistogram;
  private DoubleGaugeBuilder memoryGauge;
  private DoubleGaugeBuilder cpuGauge;


  @PostConstruct
  public void init() {
    this.sessionHistogram = this.meter
        .histogramBuilder(PREFIX_PRODUCT + "sessions")
        .setDescription("Number of active sessions")
        .setUnit("count")
        .build();
    this.simulationHistogram = this.meter
        .histogramBuilder(PREFIX_PRODUCT + "simulations")
        .setDescription("Number of simulations played")
        .setUnit("count")
        .build();
    this.memoryGauge = this.meter
        .gaugeBuilder(PREFIX_PRODUCT + "memory")
        .setDescription("Memory usage")
        .setUnit("GB");
    this.cpuGauge = this.meter
        .gaugeBuilder(PREFIX_PRODUCT + "cpu")
        .setDescription("CPU usage")
        .setUnit("percentage");
  }

  public void registerMetric() {
    this.sessionHistogram.record(this.serviceCounter.getActiveSessions());
    this.simulationHistogram.record(this.serviceCounter.getSimulationPlayed());
    this.memoryGauge.buildWithCallback(measurement -> {
      measurement.record(this.serviceCounter.getMemoryUsage());
    });
    this.cpuGauge.buildWithCallback(measurement -> {
      measurement.record(this.serviceCounter.getCpuUsage());
    });
  }

}
