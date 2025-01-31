package io.openbas.injectors.manual;

import io.openbas.config.OpenBASConfig;
import io.openbas.database.model.Execution;
import io.openbas.database.model.ExecutionTraceAction;
import io.openbas.database.model.ExecutionTraces;
import io.openbas.execution.ExecutableInject;
import io.openbas.executors.Injector;
import io.openbas.injectors.manual.model.ManualContent;
import io.openbas.model.ExecutionProcess;
import io.openbas.model.Expectation;
import io.openbas.model.expectation.ManualExpectation;
import io.openbas.service.InjectExpectationService;
import jakarta.annotation.Resource;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component(ManualContract.TYPE)
@RequiredArgsConstructor
public class ManualExecutor extends Injector {

  @Resource private OpenBASConfig openBASConfig;
  private final InjectExpectationService injectExpectationService;

  @Override
  public ExecutionProcess process(
      @NotNull final Execution execution, @NotNull final ExecutableInject injection)
      throws Exception {

    ManualContent content = contentConvert(injection, ManualContent.class);

    List<Expectation> expectations =
        content.getExpectations().stream()
            .flatMap(
                (entry) ->
                    switch (entry.getType()) {
                      case MANUAL -> Stream.of((Expectation) new ManualExpectation(entry));
                      default -> Stream.of();
                    })
            .toList();

    injectExpectationService.buildAndSaveInjectExpectations(injection, expectations);
    execution.addTrace(
        ExecutionTraces.getNewSuccessTrace(
            "Manual inject execution", ExecutionTraceAction.COMPLETE));
    return new ExecutionProcess(false);
  }
}
