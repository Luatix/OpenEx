package io.openbas.service;

import static io.openbas.executors.openbas.OpenBASExecutor.OPENBAS_EXECUTOR_ID;
import static io.openbas.executors.openbas.OpenBASExecutor.OPENBAS_EXECUTOR_TYPE;
import static io.openbas.helper.StreamHelper.fromIterable;
import static io.openbas.helper.StreamHelper.iterableToSet;
import static io.openbas.utils.ArchitectureFilterUtils.handleEndpointFilter;
import static io.openbas.utils.pagination.PaginationUtils.buildPaginationJPA;
import static java.time.Instant.now;

import io.openbas.config.OpenBASConfig;
import io.openbas.database.model.Agent;
import io.openbas.database.model.AssetAgentJob;
import io.openbas.database.model.Endpoint;
import io.openbas.database.repository.AssetAgentJobRepository;
import io.openbas.database.repository.EndpointRepository;
import io.openbas.database.repository.ExecutorRepository;
import io.openbas.database.repository.TagRepository;
import io.openbas.database.specification.EndpointSpecification;
import io.openbas.rest.asset.endpoint.form.EndpointRegisterInput;
import io.openbas.rest.asset.endpoint.form.EndpointUpdateInput;
import io.openbas.rest.exception.ElementNotFoundException;
import io.openbas.utils.pagination.SearchPaginationInput;
import jakarta.annotation.Resource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;
import org.apache.commons.io.IOUtils;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
@Log
public class EndpointService {

  private static final int DELETE_TTL = 86400000; // 24 hours

  public static String JFROG_BASE = "https://filigran.jfrog.io/artifactory";

  @Resource private OpenBASConfig openBASConfig;

  @Value("${openbas.admin.token:#{null}}")
  private String adminToken;

  @Value("${info.app.version:unknown}")
  String version;

  @Value("${executor.openbas.binaries.origin:local}")
  private String executorOpenbasBinariesOrigin;

  @Value("${executor.openbas.binaries.version:${info.app.version:unknown}}")
  private String executorOpenbasBinariesVersion;

  private final EndpointRepository endpointRepository;
  private final ExecutorRepository executorRepository;
  private final AssetAgentJobRepository assetAgentJobRepository;
  private final TagRepository tagRepository;
  private final AgentService agentService;

  // -- CRUD --
  public Endpoint createEndpoint(@NotNull final Endpoint endpoint) {
    return this.endpointRepository.save(endpoint);
  }

  public Endpoint endpoint(@NotBlank final String endpointId) {
    return this.endpointRepository
        .findByEndpointId(endpointId)
        .orElseThrow(() -> new ElementNotFoundException("Endpoint not found"));
  }

  @Transactional(readOnly = true)
  public Optional<Endpoint> findEndpointByAgentDetails(
      @NotBlank final String hostname,
      @NotNull final Endpoint.PLATFORM_TYPE platform,
      @NotNull final Endpoint.PLATFORM_ARCH arch) {
    return this.endpointRepository.findByHostnameArchAndPlatform(
        hostname.toLowerCase(), platform.name(), arch.name());
  }

  public List<Endpoint> endpoints() {
    return fromIterable(this.endpointRepository.findAll());
  }

  public List<Endpoint> endpoints(@NotNull final Specification<Endpoint> specification) {
    return fromIterable(this.endpointRepository.findAll(specification));
  }

  public Endpoint updateEndpoint(@NotNull final Endpoint endpoint) {
    endpoint.setUpdatedAt(now());
    return this.endpointRepository.save(endpoint);
  }

  public void deleteEndpoint(@NotBlank final String endpointId) {
    this.endpointRepository.deleteById(endpointId);
  }

  public Endpoint getEndpoint(@NotBlank final String endpointId) {
    return endpoint(endpointId);
  }

  public Page<Endpoint> searchEndpoints(SearchPaginationInput searchPaginationInput) {
    return buildPaginationJPA(
        (Specification<Endpoint> specification, Pageable pageable) ->
            this.endpointRepository.findAll(
                EndpointSpecification.findEndpointsForInjection().and(specification), pageable),
        handleEndpointFilter(searchPaginationInput),
        Endpoint.class);
  }

  public Endpoint updateEndpoint(
      @NotBlank final String endpointId, @NotNull final EndpointUpdateInput input) {
    Endpoint toUpdate = this.endpoint(endpointId);
    toUpdate.setUpdateAttributes(input);
    toUpdate.setTags(iterableToSet(this.tagRepository.findAllById(input.getTagIds())));
    return updateEndpoint(toUpdate);
  }

  // -- INSTALLATION AGENT --

  public void registerAgentEndpoint(Agent agent, String executorType) {
    Endpoint endpoint = (Endpoint) Hibernate.unproxy(agent.getAsset());
    Optional<Endpoint> optionalEndpoint =
        this.findEndpointByAgentDetails(
            endpoint.getHostname(), endpoint.getPlatform(), endpoint.getArch());
    if (agent.isActive()) {
      // Endpoint already created -> attributes to update
      if (optionalEndpoint.isPresent()) {
        Endpoint endpointToUpdate = optionalEndpoint.get();
        Optional<Agent> optionalAgent =
            this.agentService.getAgentByAgentDetailsForAnAsset(
                endpointToUpdate.getId(),
                agent.getExecutedByUser(),
                agent.getDeploymentMode(),
                agent.getPrivilege(),
                executorType);
        endpointToUpdate.setIps(endpoint.getIps());
        endpointToUpdate.setMacAddresses(endpoint.getMacAddresses());
        this.updateEndpoint(endpointToUpdate);
        // Agent already created -> attributes to update
        if (optionalAgent.isPresent()) {
          Agent agentToUpdate = optionalAgent.get();
          agentToUpdate.setAsset(endpointToUpdate);
          agentToUpdate.setLastSeen(agent.getLastSeen());
          agentToUpdate.setExternalReference(agent.getExternalReference());
          this.agentService.createOrUpdateAgent(agentToUpdate);
        } else {
          // New agent to create for the endpoint
          agent.setAsset(endpointToUpdate);
          this.agentService.createOrUpdateAgent(agent);
        }
      } else {
        // New endpoint and new agent to create
        this.createEndpoint(endpoint);
        this.agentService.createOrUpdateAgent(agent);
      }
    } else {
      if (optionalEndpoint.isPresent()) {
        Optional<Agent> optionalAgent =
            this.agentService.getAgentByAgentDetailsForAnAsset(
                optionalEndpoint.get().getId(),
                agent.getExecutedByUser(),
                agent.getDeploymentMode(),
                agent.getPrivilege(),
                executorType);
        if (optionalAgent.isPresent()) {
          Agent existingAgent = optionalAgent.get();
          if ((now().toEpochMilli() - existingAgent.getLastSeen().toEpochMilli()) > DELETE_TTL) {
            log.info(
                "Found stale endpoint "
                    + endpoint.getName()
                    + ", deleting the agent "
                    + existingAgent.getExecutedByUser()
                    + " in it...");
            this.agentService.deleteAgent(existingAgent.getId());
          }
        }
      }
    }
  }

  public Endpoint register(final EndpointRegisterInput input) throws IOException {
    Optional<Endpoint> optionalEndpoint =
        findEndpointByAgentDetails(input.getHostname(), input.getPlatform(), input.getArch());
    Endpoint endpoint;
    Agent agent;
    // Endpoint already created -> attributes to update
    if (optionalEndpoint.isPresent()) {
      endpoint = optionalEndpoint.get();
      endpoint.setIps(input.getIps());
      endpoint.setMacAddresses(input.getMacAddresses());
      Agent.PRIVILEGE privilege =
          input.isElevated() ? Agent.PRIVILEGE.admin : Agent.PRIVILEGE.standard;
      Agent.DEPLOYMENT_MODE deploymentMode =
          input.isService() ? Agent.DEPLOYMENT_MODE.service : Agent.DEPLOYMENT_MODE.session;
      Optional<Agent> optionalAgent =
          agentService.getAgentByAgentDetailsForAnAsset(
              endpoint.getId(),
              input.getExecutedByUser(),
              deploymentMode,
              privilege,
              OPENBAS_EXECUTOR_TYPE);
      // Agent already created -> attributes to update
      if (optionalAgent.isPresent()) {
        agent = optionalAgent.get();
      } else {
        // New agent to create for the endpoint
        agent = new Agent();
        setAgentAttributes(input, agent);
      }
    } else {
      // New endpoint and new agent to create
      endpoint = new Endpoint();
      agent = new Agent();
      endpoint.setUpdateAttributes(input);
      endpoint.setTags(iterableToSet(this.tagRepository.findAllById(input.getTagIds())));
      setAgentAttributes(input, agent);
    }
    agent.setVersion(input.getAgentVersion());
    agent.setLastSeen(Instant.now());
    agent.setAsset(endpoint);
    Endpoint updatedEndpoint = updateEndpoint(endpoint);
    agentService.createOrUpdateAgent(agent);
    // If agent is not temporary and not the same version as the platform => Create an upgrade task
    // for the agent
    if (agent.getParent() == null && !agent.getVersion().equals(version)) {
      AssetAgentJob assetAgentJob = new AssetAgentJob();
      assetAgentJob.setCommand(generateUpgradeCommand(updatedEndpoint.getPlatform().name()));
      assetAgentJob.setAgent(agent);
      assetAgentJobRepository.save(assetAgentJob);
    }
    return updatedEndpoint;
  }

  private void setAgentAttributes(EndpointRegisterInput input, Agent agent) {
    agent.setExternalReference(input.getExternalReference());
    agent.setPrivilege(input.isElevated() ? Agent.PRIVILEGE.admin : Agent.PRIVILEGE.standard);
    agent.setDeploymentMode(
        input.isService() ? Agent.DEPLOYMENT_MODE.service : Agent.DEPLOYMENT_MODE.session);
    agent.setExecutedByUser(input.getExecutedByUser());
    agent.setExecutor(executorRepository.findById(OPENBAS_EXECUTOR_ID).orElse(null));
  }

  public String getFileOrDownloadFromJfrog(String platform, String file, String adminToken)
      throws IOException {
    String extension =
        switch (platform.toLowerCase()) {
          case "windows" -> "ps1";
          case "linux", "macos" -> "sh";
          default -> throw new UnsupportedOperationException("");
        };
    InputStream in = null;
    String filename;
    String resourcePath = "/openbas-agent/" + platform.toLowerCase() + "/";

    if (executorOpenbasBinariesOrigin.equals("local")) { // if we want the local binaries
      filename = file + "-" + version + "." + extension;
      in = getClass().getResourceAsStream("/agents" + resourcePath + filename);
    } else if (executorOpenbasBinariesOrigin.equals(
        "repository")) { // if we want a specific version from artifactory
      filename = file + "-" + executorOpenbasBinariesVersion + "." + extension;
      in = new BufferedInputStream(new URL(JFROG_BASE + resourcePath + filename).openStream());
    }
    if (in == null) {
      throw new UnsupportedOperationException(
          "Agent installer version " + executorOpenbasBinariesVersion + " not found");
    }

    return IOUtils.toString(in, StandardCharsets.UTF_8)
        .replace("${OPENBAS_URL}", openBASConfig.getBaseUrlForAgent())
        .replace("${OPENBAS_TOKEN}", adminToken)
        .replace(
            "${OPENBAS_UNSECURED_CERTIFICATE}",
            String.valueOf(openBASConfig.isUnsecuredCertificate()))
        .replace("${OPENBAS_WITH_PROXY}", String.valueOf(openBASConfig.isWithProxy()));
  }

  public String generateInstallCommand(String platform, String token) throws IOException {
    return getFileOrDownloadFromJfrog(platform, "openbas-agent-installer", token);
  }

  public String generateUpgradeCommand(String platform) throws IOException {
    return getFileOrDownloadFromJfrog(platform, "openbas-agent-upgrade", adminToken);
  }
}
