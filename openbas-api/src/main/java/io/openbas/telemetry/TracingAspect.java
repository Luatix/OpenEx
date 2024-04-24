package io.openbas.telemetry;

import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Scope;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

import static io.openbas.config.SessionHelper.currentUser;

@Aspect
@Component
@RequiredArgsConstructor
public class TracingAspect {

  private final Tracer tracer;

  @Around("@annotation(io.openbas.telemetry.Tracing)")
  public Object tracing(ProceedingJoinPoint proceedingJoinPoint) throws Throwable {
    MethodSignature signature = (MethodSignature) proceedingJoinPoint.getSignature();
    Method method = signature.getMethod();
    Tracing tracing = method.getAnnotation(Tracing.class);

    Span span = tracer.spanBuilder(tracing.name())
        .setAttribute("USER", currentUser().getId())
        .setAttribute("LAYER", tracing.layer())
        .setAttribute("OPERATION", tracing.operation())
        .startSpan();
    try (Scope ignored = span.makeCurrent()) {
      return proceedingJoinPoint.proceed();
    } finally {
      span.end();
    }
  }
}
