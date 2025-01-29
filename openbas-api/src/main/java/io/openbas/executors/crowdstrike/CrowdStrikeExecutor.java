package io.openbas.executors.crowdstrike;

import io.openbas.executors.crowdstrike.client.CrowdStrikeExecutorClient;
import io.openbas.executors.crowdstrike.config.CrowdStrikeExecutorConfig;
import io.openbas.executors.crowdstrike.service.CrowdStrikeExecutorContextService;
import io.openbas.executors.crowdstrike.service.CrowdStrikeExecutorService;
import io.openbas.integrations.ExecutorService;
import io.openbas.integrations.InjectorService;
import io.openbas.service.AgentService;
import io.openbas.service.EndpointService;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class CrowdStrikeExecutor {

  private final CrowdStrikeExecutorConfig config;
  private final ThreadPoolTaskScheduler taskScheduler;
  private final CrowdStrikeExecutorClient client;
  private final EndpointService endpointService;
  private final CrowdStrikeExecutorContextService crowdStrikeExecutorContextService;
  private final ExecutorService executorService;
  private final InjectorService injectorService;
  private final AgentService agentService;

  @PostConstruct
  public void init() {
    CrowdStrikeExecutorService service =
        new CrowdStrikeExecutorService(
            this.executorService,
            this.client,
            this.config,
            this.crowdStrikeExecutorContextService,
            this.endpointService,
            this.injectorService,
            this.agentService);
    if (this.config.isEnable()) {
      this.taskScheduler.scheduleAtFixedRate(service, Duration.ofSeconds(60));
    }
  }
}
