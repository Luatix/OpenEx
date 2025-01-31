package io.openbas.executors;

import static io.openbas.database.model.ExecutionStatus.ERROR;
import static io.openbas.database.model.ExecutionStatus.EXECUTING;
import static io.openbas.utils.InjectionUtils.isInInjectableRange;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.openbas.asset.QueueService;
import io.openbas.database.model.*;
import io.openbas.database.model.Injector;
import io.openbas.database.repository.InjectRepository;
import io.openbas.database.repository.InjectStatusRepository;
import io.openbas.database.repository.InjectorRepository;
import io.openbas.execution.ExecutableInject;
import io.openbas.execution.ExecutionExecutorService;
import io.openbas.rest.inject.service.InjectStatusService;
import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class Executor {

  @Resource protected ObjectMapper mapper;

  private final ApplicationContext context;

  private final InjectStatusRepository injectStatusRepository;

  private final InjectorRepository injectorRepository;

  private final InjectRepository injectRepository;

  private final QueueService queueService;

  private final ExecutionExecutorService executionExecutorService;
  private final InjectStatusService injectStatusService;

  private InjectStatus executeExternal(ExecutableInject executableInject, Injector injector) {
    Inject inject = executableInject.getInjection().getInject();
    try {
      String jsonInject = mapper.writeValueAsString(executableInject);
      queueService.publish(injector.getType(), jsonInject);
      InjectStatus injectStatus = this.injectStatusRepository.findByInject(inject).orElseThrow();
      injectStatus.addInfoTrace(
          "The inject has been published and is now waiting to be consumed.",
          ExecutionTraceAction.EXECUTION);
      return this.injectStatusRepository.save(injectStatus);
    } catch (Exception e) {
      return injectStatusService.failInjectStatus(inject.getId(), e.getMessage());
    }
  }

  private InjectStatus executeInternal(ExecutableInject executableInject, Injector injector) {
    Inject inject = executableInject.getInjection().getInject();
    io.openbas.executors.Injector executor =
        this.context.getBean(injector.getType(), io.openbas.executors.Injector.class);
    Execution execution = executor.executeInjection(executableInject);
    // After execution, expectations are already created
    // Injection status is filled after complete execution
    // Report inject execution
    InjectStatus injectStatus = this.injectStatusRepository.findByInject(inject).orElseThrow();
    InjectStatus completeStatus = injectStatusService.fromExecution(execution, injectStatus);
    return injectStatusRepository.save(completeStatus);
  }

  public InjectStatus execute(ExecutableInject executableInject) {
    Inject inject = executableInject.getInjection().getInject();
    InjectorContract injectorContract =
        inject
            .getInjectorContract()
            .orElseThrow(
                () -> new UnsupportedOperationException("Inject does not have a contract"));

    // Depending on injector type (internal or external) execution must be done differently
    Injector injector =
        injectorRepository
            .findByType(injectorContract.getInjector().getType())
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "Injector not found for type: "
                            + injectorContract.getInjector().getType()));

    // Status
    InjectStatus injectStatus = this.injectStatusService.initializeInjectStatus(inject.getId(), EXECUTING);
    if (Boolean.TRUE.equals(injectorContract.getNeedsExecutor())) {
      try {
        this.executionExecutorService.launchExecutorContext(inject);
      } catch (Exception e) {
        injectStatus.setName(ERROR);
        return injectStatusRepository.save(injectStatus);
      }
    }
    if (injector.isExternal()) {
      return executeExternal(executableInject, injector);
    } else {
      return executeInternal(executableInject, injector);
    }
  }

  public InjectStatus directExecute(ExecutableInject executableInject) {
    boolean isScheduledInject = !executableInject.isDirect();
    // If empty content, inject must be rejected
    Inject inject = executableInject.getInjection().getInject();
    if (inject.getContent() == null) {
      throw new UnsupportedOperationException("Inject is empty");
    }
    // If inject is too old, reject the execution
    if (isScheduledInject && !isInInjectableRange(inject)) {
      throw new UnsupportedOperationException("Inject is now too old for execution");
    }

    return this.execute(executableInject);
  }
}
