package io.openbas.service;

import static io.openbas.executors.openbas.OpenBASExecutor.OPENBAS_EXECUTOR_ID;
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
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class EndpointService {

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

  // -- CRUD --
  public Endpoint createEndpoint(@NotNull final Endpoint endpoint) {
    return this.endpointRepository.save(endpoint);
  }

  public Endpoint endpoint(@NotBlank final String endpointId) {
    return this.endpointRepository
        .findByEndpointIdWithAgents(endpointId)
        .orElseThrow(() -> new ElementNotFoundException("Endpoint not found"));
  }

  @Transactional(readOnly = true)
  public List<Endpoint> findAssetsForInjectionByHostname(@NotBlank final String hostname) {
    return endpoints(EndpointSpecification.findEndpointsForInjectionByHostname(hostname));
  }

  @Transactional(readOnly = true)
  public Optional<Endpoint> findByExternalReference(@NotBlank final String externalReference) {
    return this.endpointRepository.findByExternalReference(externalReference);
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

  public Endpoint register(final EndpointRegisterInput input) throws IOException {
    Optional<Endpoint> optionalEndpoint = findByExternalReference(input.getExternalReference());
    Endpoint endpoint;
    if (optionalEndpoint.isPresent()) {
      endpoint = optionalEndpoint.get();
      endpoint.setIps(input.getIps());
      endpoint.setMacAddresses(input.getMacAddresses());
      endpoint.setHostname(input.getHostname());
      endpoint.setPlatform(input.getPlatform());
      endpoint.setArch(input.getArch());
      endpoint.setName(input.getName());
      endpoint.getAgents().getFirst().setVersion(input.getAgentVersion());
      endpoint.setDescription(input.getDescription());
      endpoint.getAgents().getFirst().setLastSeen(Instant.now());
      endpoint
          .getAgents()
          .getFirst()
          .setExecutor(executorRepository.findById(OPENBAS_EXECUTOR_ID).orElse(null));
      endpoint
          .getAgents()
          .getFirst()
          .setPrivilege(input.isElevated() ? Agent.PRIVILEGE.admin : Agent.PRIVILEGE.standard);
      endpoint
          .getAgents()
          .getFirst()
          .setDeploymentMode(
              input.isService() ? Agent.DEPLOYMENT_MODE.service : Agent.DEPLOYMENT_MODE.session);
      endpoint.getAgents().getFirst().setExecutedByUser(input.getExecutedByUser());
    } else {
      endpoint = new Endpoint();
      Agent agent = new Agent();
      agent.setVersion(input.getAgentVersion());
      agent.setExternalReference(input.getExternalReference());
      endpoint.setUpdateAttributes(input);
      agent.setLastSeen(Instant.now());
      agent.setPrivilege(input.isElevated() ? Agent.PRIVILEGE.admin : Agent.PRIVILEGE.standard);
      agent.setDeploymentMode(
          input.isService() ? Agent.DEPLOYMENT_MODE.service : Agent.DEPLOYMENT_MODE.session);
      agent.setExecutedByUser(input.getExecutedByUser());
      endpoint.setTags(iterableToSet(this.tagRepository.findAllById(input.getTagIds())));
      agent.setExecutor(executorRepository.findById(OPENBAS_EXECUTOR_ID).orElse(null));
      agent.setAsset(endpoint);
      endpoint.setAgents(List.of(agent));
    }
    Endpoint updatedEndpoint = updateEndpoint(endpoint);
    // If agent is not temporary and not the same version as the platform => Create an upgrade task
    // for the agent
    if (updatedEndpoint.getAgents().getFirst().getParent() == null
        && !updatedEndpoint.getAgents().getFirst().getVersion().equals(version)) {
      AssetAgentJob assetAgentJob = new AssetAgentJob();
      assetAgentJob.setCommand(generateUpgradeCommand(updatedEndpoint.getPlatform().name()));
      assetAgentJob.setAgent(updatedEndpoint.getAgents().getFirst());
      assetAgentJobRepository.save(assetAgentJob);
    }
    return updatedEndpoint;
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
