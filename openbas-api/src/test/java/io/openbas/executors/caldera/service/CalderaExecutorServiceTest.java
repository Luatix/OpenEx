package io.openbas.executors.caldera.service;

import static io.openbas.executors.caldera.service.CalderaExecutorService.toArch;
import static io.openbas.executors.caldera.service.CalderaExecutorService.toPlatform;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.openbas.database.model.Endpoint;
import io.openbas.database.model.Executor;
import io.openbas.executors.caldera.client.CalderaExecutorClient;
import io.openbas.executors.caldera.config.CalderaExecutorConfig;
import io.openbas.executors.caldera.model.Agent;
import io.openbas.integrations.ExecutorService;
import io.openbas.integrations.InjectorService;
import io.openbas.service.AgentService;
import io.openbas.service.EndpointService;
import io.openbas.service.PlatformSettingsService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class CalderaExecutorServiceTest {
  private static final String CALDERA_AGENT_HOSTNAME = "calderaHostname";
  private static final String CALDERA_AGENT_EXTERNAL_REF = "calderaExt";
  private static final String CALDERA_AGENT_IP = "10.10.10.10";
  private static final String CALDERA_AGENT_USERNAME = "openbas_user";

  private static final String CALDERA_EXECUTOR_TYPE = "openbas_caldera";
  private static final String CALDERA_EXECUTOR_NAME = "Caldera";

  private static final String DATE = "2024-12-11T12:45:30Z";

  @Mock private ExecutorService executorService;

  @Mock private CalderaExecutorClient client;

  @Mock private CalderaExecutorConfig config;

  @Mock private CalderaExecutorContextService calderaExecutorContextService;

  @Mock private EndpointService endpointService;

  @Mock private AgentService agentService;

  @Mock private InjectorService injectorService;

  @Mock private PlatformSettingsService platformSettingsService;

  @Mock private Executor executor;

  @InjectMocks private CalderaExecutorService calderaExecutorService;

  private Endpoint calderaEndpoint;
  private Endpoint randomEndpoint;
  private Agent calderaAgent;
  private Agent randomAgent;
  private Executor calderaExecutor;
  private Executor randomExecutor;

  @BeforeEach
  void setUp() {
    calderaAgent = new Agent();
    calderaAgent.setArchitecture("Arch");
    calderaAgent.setPaw(CALDERA_AGENT_EXTERNAL_REF);
    calderaExecutor = new Executor();
    calderaExecutor.setName(CALDERA_EXECUTOR_NAME);
    calderaExecutor.setType(CALDERA_EXECUTOR_TYPE);
    randomExecutor = new Executor();
    randomExecutor.setName("NAME");
    randomExecutor.setType("TYPE");
    calderaExecutorService.setExecutor(calderaExecutor);

    calderaAgent =
        createAgent(
            CALDERA_AGENT_HOSTNAME,
            CALDERA_AGENT_IP,
            CALDERA_AGENT_EXTERNAL_REF,
            CALDERA_AGENT_USERNAME);
    randomAgent = createAgent("hostname", "1.1.1.1", "ref", CALDERA_AGENT_USERNAME);
    calderaEndpoint = createEndpoint(calderaAgent, calderaExecutor);
    randomEndpoint = createEndpoint(randomAgent, randomExecutor);

    when(endpointService.findAssetsForInjectionByHostname(CALDERA_AGENT_HOSTNAME))
        .thenReturn(List.of(calderaEndpoint, randomEndpoint));
  }

  private Endpoint createEndpoint(Agent agent, Executor executor) {
    Endpoint endpoint = new Endpoint();
    io.openbas.database.model.Agent agentEndpoint = new io.openbas.database.model.Agent();
    endpoint.setName(agent.getHost());
    endpoint.setDescription("Asset collected by Caldera executor context.");
    endpoint.setIps(agent.getHost_ip_addrs());
    endpoint.setHostname(agent.getHost());
    endpoint.setPlatform(toPlatform("windows"));
    endpoint.setArch(toArch("amd64"));
    agentEndpoint.setProcessName(agent.getExe_name());
    agentEndpoint.setExecutor(executor);
    agentEndpoint.setExternalReference(agent.getPaw());
    agentEndpoint.setPrivilege(io.openbas.database.model.Agent.PRIVILEGE.admin);
    agentEndpoint.setDeploymentMode(io.openbas.database.model.Agent.DEPLOYMENT_MODE.session);
    agentEndpoint.setExecutedByUser(agent.getUsername());
    agentEndpoint.setLastSeen(calderaExecutorService.toInstant(DATE));
    agentEndpoint.setAsset(endpoint);
    endpoint.setAgents(List.of(agentEndpoint));
    return endpoint;
  }

  private Agent createAgent(String hostname, String ip, String externalRef, String username) {
    Agent agent = new Agent();
    agent.setArchitecture("amd64");
    agent.setPaw(externalRef);
    agent.setPlatform("windows");
    agent.setExe_name("exe");
    agent.setLast_seen(DATE);
    agent.setHost_ip_addrs(new String[] {ip});
    agent.setHost(hostname);
    agent.setUsername(username);
    return agent;
  }

  @Test
  void test_run_WITH_one_endpoint_one_agent() {
    when(client.agents()).thenReturn(List.of(calderaAgent));
    calderaExecutorService.run();
    verify(endpointService).updateEndpoint(calderaEndpoint);
  }

  @Test
  void test_run_WITH_2_existing_agents_same_machine() {
    when(client.agents()).thenReturn(List.of(calderaAgent));
    randomEndpoint.setHostname(CALDERA_AGENT_HOSTNAME);
    randomEndpoint.setIps(new String[] {CALDERA_AGENT_IP});
    calderaExecutorService.run();
    verify(endpointService).updateEndpoint(calderaEndpoint);
  }

  @Test
  void test_findExistingEndpointForAnAgent_WITH_2_existing_endpoint_same_host() {
    Optional<Endpoint> result =
        endpointService.findEndpointByAgentDetails(
            calderaAgent.getHost(),
            toPlatform(calderaAgent.getPlatform()),
            toArch(calderaAgent.getArchitecture()));
    assertEquals(calderaEndpoint, result.get());
  }

  @Test
  void test_findExistingEndpointForAnAgent_WITH_no_existing_endpoint() {
    when(endpointService.findAssetsForInjectionByHostname(CALDERA_AGENT_HOSTNAME))
        .thenReturn(List.of());
    Optional<Endpoint> result =
        endpointService.findEndpointByAgentDetails(
            calderaAgent.getHost(),
            toPlatform(calderaAgent.getPlatform()),
            toArch(calderaAgent.getArchitecture()));
    assertTrue(result.isEmpty());
  }

  @Test
  void test_findExistingEndpointForAnAgent_WITH_1_enpdoint_with_null_executor() {
    randomEndpoint.getAgents().getFirst().setExecutor(null);
    randomEndpoint.setHostname(CALDERA_AGENT_HOSTNAME);
    randomEndpoint.setIps(new String[] {CALDERA_AGENT_IP});
    Optional<Endpoint> result =
        endpointService.findEndpointByAgentDetails(
            calderaAgent.getHost(),
            toPlatform(calderaAgent.getPlatform()),
            toArch(calderaAgent.getArchitecture()));
    assertEquals(calderaEndpoint, result.get());
  }
}
