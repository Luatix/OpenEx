package io.openbas.telemetry;

import io.pyroscope.javaagent.PyroscopeAgent;
import io.pyroscope.labels.LabelsSet;
import io.pyroscope.labels.Pyroscope;
import io.swagger.v3.oas.annotations.Operation;
import java.lang.reflect.Method;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

@Aspect
@Component
public class PyroscopeConfig {

  /** The pointcut to use. Targets all method in the package and subpackages io.openbas.rest */
  @Pointcut("execution(* io.openbas.rest..*.*(..))")
  public void allRESTMethods() {}

  /**
   * Method to add pyroscope labels to all rest api endpoints. The method will add labels only on
   * method that have annotation like @GetMapping, @PostMapping, ...
   *
   * @param proceedingJoinPoint the joinpoint
   * @return the object returned by the method
   * @throws Throwable in case of exception
   */
  @Around("allRESTMethods()")
  public Object addLabels(ProceedingJoinPoint proceedingJoinPoint) throws Throwable {
    // We add labels only if pyroscope is started
    if (PyroscopeAgent.isStarted()) {
      // We're getting the method itself
      MethodSignature signature = (MethodSignature) proceedingJoinPoint.getSignature();
      Method method = signature.getMethod();
      // We check if there are @GetMapping, @PostMapping, ... annotation to only add labels to those
      boolean hasGetMapping = method.getAnnotation(GetMapping.class) != null;
      boolean hasPutMapping = method.getAnnotation(PutMapping.class) != null;
      boolean hasPostMapping = method.getAnnotation(PostMapping.class) != null;
      boolean hasDeleteMapping = method.getAnnotation(DeleteMapping.class) != null;
      boolean hasPatchMapping = method.getAnnotation(PatchMapping.class) != null;

      // If they do have those annotation, we will add labels
      if (hasGetMapping || hasPatchMapping || hasDeleteMapping || hasPutMapping || hasPostMapping) {
        // We get the type of endpoint we're in to add it as label
        String type = "GET";
        if (hasPostMapping) {
          type = "POST";
        } else if (hasPutMapping) {
          type = "PUT";
        } else if (hasDeleteMapping) {
          type = "DELETE";
        } else if (hasPatchMapping) {
          type = "PATCH";
        }

        // We also get the swagger operation annotation as it's easier to read than the name of the
        // method itself
        Operation operationAnnotation = method.getAnnotation(Operation.class);

        // We get the class name
        String className = signature.getDeclaringType().getCanonicalName();

        return Pyroscope.LabelsWrapper.run(
            new LabelsSet(
                "Class",
                // We're removing the full name of the package for readibility
                className.substring(className.lastIndexOf(".") + 1),
                "Operation",
                type,
                "Method",
                // If we can, we use the operation summary as the method name as it's more explicit
                operationAnnotation != null ? operationAnnotation.summary() : method.getName()),
            () -> {
              try {
                return proceedingJoinPoint.proceed();
              } catch (Throwable e) {
                throw new RuntimeException(e);
              }
            });
      }
    }
    return proceedingJoinPoint.proceed();
  }
}
