package io.openbas.telemetry;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.baggage.propagation.W3CBaggagePropagator;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.metrics.Meter;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator;
import io.opentelemetry.context.propagation.ContextPropagators;
import io.opentelemetry.context.propagation.TextMapPropagator;
import io.opentelemetry.exporter.logging.LoggingMetricExporter;
import io.opentelemetry.exporter.logging.LoggingSpanExporter;
import io.opentelemetry.exporter.otlp.http.metrics.OtlpHttpMetricExporter;
import io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.metrics.SdkMeterProvider;
import io.opentelemetry.sdk.metrics.SdkMeterProviderBuilder;
import io.opentelemetry.sdk.metrics.export.PeriodicMetricReader;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.SdkTracerProviderBuilder;
import io.opentelemetry.sdk.trace.export.SimpleSpanProcessor;
import io.opentelemetry.semconv.ResourceAttributes;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static java.util.Objects.requireNonNull;

@Service
@RequiredArgsConstructor
public class OpenTelemetryConfig {

  private final Environment env;

  @Bean
  public OpenTelemetry openTelemetry() {
    Resource resource;
    try {
      resource = Resource.getDefault()
          .toBuilder()
          .put(ResourceAttributes.SERVICE_NAME, requireNonNull(this.env.getProperty("info.app.name")))
          .put(ResourceAttributes.SERVICE_VERSION, requireNonNull(this.env.getProperty("info.app.version")))
          .put(ResourceAttributes.SERVICE_INSTANCE_ID, UUID.randomUUID().toString())
          .putAll(Attributes.of(ResourceAttributes.HOST_IP, List.of(InetAddress.getLocalHost().getHostAddress())))
          .build();
    } catch (UnknownHostException e) {
      throw new RuntimeException(e);
    }

    // -- METRICS --

    // Log exporter
    SdkMeterProviderBuilder sdkMeterProviderBuilder = SdkMeterProvider.builder()
        .registerMetricReader(
            PeriodicMetricReader.builder(LoggingMetricExporter.create()).setInterval(1, TimeUnit.MINUTES).build());

    // File exporter: FIXME: use log system with retention like logstash
//    sdkMeterProviderBuilder.registerMetricReader(
//        PeriodicMetricReader.builder(FileMetricExporter.create(this.env.getProperty("telemetry.file"))).build()
//    );

    // OTLP exporter
    boolean exporterOtlpEndpointEnabled = Boolean.TRUE.equals(
        this.env.getProperty("telemetry.exporter.otlp.enabled", Boolean.class)
    );
    if (exporterOtlpEndpointEnabled) {
      sdkMeterProviderBuilder.registerMetricReader(PeriodicMetricReader.builder(
          OtlpHttpMetricExporter.builder().build() // Take default endpoint uri
      ).build());
    }

    SdkMeterProvider sdkMeterProvider = sdkMeterProviderBuilder
        .setResource(resource)
        .build();

    // -- SPANS --

    // Log exporter
    SdkTracerProviderBuilder sdkTracerProviderBuilder = SdkTracerProvider.builder()
        .addSpanProcessor(SimpleSpanProcessor.create(LoggingSpanExporter.create()));

    // OTLP exporter
    if (exporterOtlpEndpointEnabled) {
      sdkTracerProviderBuilder.addSpanProcessor(
          SimpleSpanProcessor.create(OtlpGrpcSpanExporter.builder().build())
      );
    }

    SdkTracerProvider sdkTracerProvider = sdkTracerProviderBuilder
        .setResource(resource)
        .build();

    return OpenTelemetrySdk.builder()
        .setMeterProvider(sdkMeterProvider)
        .setTracerProvider(sdkTracerProvider)
        .setPropagators(ContextPropagators.create(
            TextMapPropagator.composite(W3CTraceContextPropagator.getInstance(), W3CBaggagePropagator.getInstance())
        ))
        .build();
  }

  @Bean
  public Meter meter(@NotNull final OpenTelemetry openTelemetry) {
    return openTelemetry.getMeter("openbasApi-meter");
  }

  @Bean
  public Tracer tracer(@NotNull final OpenTelemetry openTelemetry) {
    return openTelemetry.getTracer("openbasApi-tracer");
  }

}

