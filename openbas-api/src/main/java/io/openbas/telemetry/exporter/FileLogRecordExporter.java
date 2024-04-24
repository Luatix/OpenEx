package io.openbas.telemetry.exporter;

import io.opentelemetry.sdk.common.CompletableResultCode;
import io.opentelemetry.sdk.logs.data.LogRecordData;
import io.opentelemetry.sdk.logs.export.LogRecordExporter;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

import java.io.FileWriter;
import java.io.IOException;
import java.time.Instant;
import java.util.Collection;

public class FileLogRecordExporter implements LogRecordExporter {

  private final String filePath;

  public FileLogRecordExporter(@NotBlank final String filePath) {
    this.filePath = filePath;
  }

  public static FileLogRecordExporter create(@NotBlank final String filePath) {
    return new FileLogRecordExporter(filePath);
  }

  @Override
  public CompletableResultCode export(Collection<LogRecordData> logs) {
    try (FileWriter writer = new FileWriter(this.filePath, true)) {
      for (LogRecordData log : logs) {
        LogOutput logOutput = LogOutput.builder()
            .body(log.getBody().asString())
            .date(
                Instant.ofEpochSecond(
                    0L,
                    log.getObservedTimestampEpochNanos()
                ).toString()
            )
            .build();
        writer.write(logOutput + "\n");
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
    LogRecordExporter.super.close();
  }

  @Builder
  public static class LogOutput {

    private String body;
    private String date;

    public String toString() {
      return this.date + " " + this.body;
    }
  }

}
