package io.openbas.executors.caldera;

import io.openbas.executors.caldera.client.CalderaExecutorClient;
import io.openbas.executors.caldera.config.CalderaExecutorConfig;
import io.openbas.executors.caldera.service.CalderaExecutorContextService;
import io.openbas.executors.caldera.service.CalderaExecutorService;
import io.openbas.integrations.ExecutorService;
import io.openbas.integrations.InjectorService;
import io.openbas.service.AgentService;
import io.openbas.service.EndpointService;
import io.openbas.service.PlatformSettingsService;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class CalderaExecutor {

  private final CalderaExecutorConfig config;
  private final ThreadPoolTaskScheduler taskScheduler;
  private final CalderaExecutorClient client;
  private final EndpointService endpointService;
  private final CalderaExecutorContextService calderaExecutorContextService;
  private final ExecutorService executorService;
  private final InjectorService injectorService;
  private final PlatformSettingsService platformSettingsService;
  private final AgentService agentService;

  @PostConstruct
  public void init() {
    CalderaExecutorService service =
        new CalderaExecutorService(
            this.executorService,
            this.client,
            this.config,
            this.calderaExecutorContextService,
            this.endpointService,
            this.injectorService,
            this.platformSettingsService,
            this.agentService);
    if (this.config.isEnable()) {
      this.taskScheduler.scheduleAtFixedRate(service, Duration.ofSeconds(60));
    }
  }
}
