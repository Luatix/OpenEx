package io.openbas.telemetry.exporter;

import io.opentelemetry.sdk.common.CompletableResultCode;
import io.opentelemetry.sdk.metrics.InstrumentType;
import io.opentelemetry.sdk.metrics.data.AggregationTemporality;
import io.opentelemetry.sdk.metrics.data.MetricData;
import io.opentelemetry.sdk.metrics.export.MetricExporter;
import jakarta.validation.constraints.NotBlank;
import org.jetbrains.annotations.NotNull;

import java.io.FileWriter;
import java.io.IOException;
import java.util.Collection;

public class FileMetricExporter implements MetricExporter {

  private final String filePath;
  private final AggregationTemporality aggregationTemporality = AggregationTemporality.CUMULATIVE;

  public FileMetricExporter(@NotBlank final String filePath) {
    this.filePath = filePath;
  }

  public static FileMetricExporter create(@NotBlank final String filePath) {
    return new FileMetricExporter(filePath);
  }

  @Override
  public CompletableResultCode export(Collection<MetricData> metrics) {
    try (FileWriter writer = new FileWriter(filePath, true)) {
      for (MetricData metric : metrics) {
        writer.write(metric + "\n");
      }
    } catch (IOException e) {
      return CompletableResultCode.ofFailure();
    }
    return CompletableResultCode.ofSuccess();
  }

  @Override
  public CompletableResultCode flush() {
    return CompletableResultCode.ofSuccess();
  }

  @Override
  public CompletableResultCode shutdown() {
    return CompletableResultCode.ofSuccess();
  }

  @Override
  public void close() {
    MetricExporter.super.close();
  }

  @Override
  public AggregationTemporality getAggregationTemporality(@NotNull InstrumentType instrumentType) {
    return aggregationTemporality;
  }
}
