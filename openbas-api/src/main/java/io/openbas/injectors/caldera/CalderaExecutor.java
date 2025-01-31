package io.openbas.injectors.caldera;

import static io.openbas.database.model.ExecutionTraces.getNewErrorTrace;
import static io.openbas.database.model.ExecutionTraces.getNewInfoTrace;
import static io.openbas.database.model.InjectExpectationSignature.*;
import static io.openbas.model.expectation.DetectionExpectation.detectionExpectationForAssetGroup;
import static io.openbas.model.expectation.ManualExpectation.manualExpectationForAssetGroup;
import static io.openbas.model.expectation.PreventionExpectation.preventionExpectationForAssetGroup;
import static java.time.Instant.now;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.openbas.database.model.*;
import io.openbas.database.model.InjectExpectation.EXPECTATION_TYPE;
import io.openbas.database.model.PayloadCommandBlock;
import io.openbas.execution.ExecutableInject;
import io.openbas.executors.Injector;
import io.openbas.injectors.caldera.client.model.Ability;
import io.openbas.injectors.caldera.client.model.Agent;
import io.openbas.injectors.caldera.client.model.ExploitResult;
import io.openbas.injectors.caldera.model.CalderaInjectContent;
import io.openbas.injectors.caldera.service.CalderaInjectorService;
import io.openbas.model.ExecutionProcess;
import io.openbas.model.Expectation;
import io.openbas.model.expectation.DetectionExpectation;
import io.openbas.model.expectation.ManualExpectation;
import io.openbas.model.expectation.PreventionExpectation;
import io.openbas.rest.inject.service.InjectService;
import io.openbas.service.AgentService;
import io.openbas.service.AssetGroupService;
import io.openbas.service.InjectExpectationService;
import io.openbas.utils.Time;
import jakarta.validation.constraints.NotNull;
import java.util.*;
import java.util.logging.Level;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component(CalderaContract.TYPE)
@RequiredArgsConstructor
@Log
public class CalderaExecutor extends Injector {

  private final int RETRY_NUMBER = 20;

  private final CalderaInjectorService calderaService;
  private final AgentService agentService;
  private final AssetGroupService assetGroupService;
  private final InjectExpectationService injectExpectationService;
  private final InjectService injectService;

  @Override
  @Transactional
  public ExecutionProcess process(
      @NotNull final Execution execution, @NotNull final ExecutableInject injection)
      throws Exception {
    CalderaInjectContent content = contentConvert(injection, CalderaInjectContent.class);
    String obfuscator =
        content.getObfuscator() != null
            ? content.getObfuscator()
            : CalderaInjectContent.getDefaultObfuscator();
    Inject inject = this.injectService.inject(injection.getInjection().getInject().getId());

    Map<Asset, Boolean> assets = this.injectService.resolveAllAssetsToExecute(inject);
    // Execute inject for all assets
    if (assets.isEmpty()) {
      execution.addTrace(
          getNewErrorTrace(
              "Found 0 asset to execute the ability on (likely this inject does not have any target or the targeted asset is inactive and has been purged)",
              ExecutionTraceAction.COMPLETE));
    }

    List<String> asyncIds = new ArrayList<>();
    List<Expectation> expectations = new ArrayList<>();
    List<Map<String, String>> additionalFields = new ArrayList<>();

    inject
        .getInjectorContract()
        .ifPresentOrElse(
            injectorContract -> {
              ObjectNode rawContent = injection.getInjection().getInject().getContent();
              ObjectNode contractContent = injectorContract.getConvertedContent();
              List<JsonNode> contractTextFields =
                  StreamSupport.stream(contractContent.get("fields").spliterator(), false)
                      .filter(
                          contractElement -> contractElement.get("type").asText().equals("text"))
                      .toList();

              if (!contractTextFields.isEmpty()) {
                contractTextFields.forEach(
                    jsonField -> {
                      String key = jsonField.get("key").asText();
                      if (rawContent.get(key) != null) {
                        Map<String, String> additionalField = new HashMap<>();
                        additionalField.put("trait", key);
                        additionalField.put("value", rawContent.get(key).asText());
                        additionalFields.add(additionalField);
                      }
                    });
              }

              String contract;
              if (injectorContract.getPayload() != null) {
                // This is a payload, need to create the ability on the fly
                List<Ability> abilities =
                    calderaService.abilities().stream()
                        .filter(
                            ability ->
                                ability.getName().equals(injectorContract.getPayload().getId()))
                        .toList();
                if (!abilities.isEmpty()) {
                  calderaService.deleteAbility(abilities.getFirst());
                }
                Ability abilityToExecute =
                    calderaService.createAbility(injectorContract.getPayload());
                contract = abilityToExecute.getAbility_id();
              } else {
                contract = injectorContract.getId();
              }
              assets.keySet().stream()
                  .map(as -> (Endpoint) as)
                  .flatMap(as -> as.getAgents().stream())
                  .forEach(
                      (agent) -> {
                        try {
                          Endpoint endpointAgent = (Endpoint) Hibernate.unproxy(agent.getAsset());
                          io.openbas.database.model.Agent executionAgent =
                              this.findAndRegisterAgentForExecution(
                                  injection.getInjection().getInject(), endpointAgent, agent);

                          if (executionAgent != null) {
                            if (Arrays.stream(injectorContract.getPlatforms())
                                .anyMatch(s -> s.equals(endpointAgent.getPlatform()))) {
                              String result =
                                  this.calderaService.exploit(
                                      obfuscator,
                                      executionAgent.getExternalReference(),
                                      contract,
                                      additionalFields);
                              if (result.contains("complete")) {
                                ExploitResult exploitResult =
                                    this.calderaService.exploitResult(
                                        executionAgent.getExternalReference(), contract);
                                asyncIds.add(exploitResult.getLinkId());
                                execution.addTrace(
                                    getNewInfoTrace(
                                        exploitResult.getCommand(),
                                        ExecutionTraceAction.EXECUTION,
                                        executionAgent,
                                        List.of()));

                                List<InjectExpectationSignature> injectExpectationSignatures =
                                    new ArrayList<>();
                                if (injectorContract.getPayload() != null) {
                                  switch (injectorContract.getPayload().getTypeEnum()) {
                                    case PayloadType.COMMAND:
                                      injectExpectationSignatures.add(
                                          InjectExpectationSignature.builder()
                                              .type(EXPECTATION_SIGNATURE_TYPE_PROCESS_NAME)
                                              .value(executionAgent.getProcessName())
                                              .build());
                                      break;
                                    case PayloadType.EXECUTABLE:
                                      Executable payloadExecutable =
                                          (Executable)
                                              Hibernate.unproxy(injectorContract.getPayload());
                                      injectExpectationSignatures.add(
                                          InjectExpectationSignature.builder()
                                              .type(EXPECTATION_SIGNATURE_TYPE_FILE_NAME)
                                              .value(
                                                  payloadExecutable.getExecutableFile().getName())
                                              .build());
                                      // TODO File hash
                                      break;
                                    case PayloadType.FILE_DROP:
                                      FileDrop payloadFileDrop =
                                          (FileDrop)
                                              Hibernate.unproxy(injectorContract.getPayload());
                                      injectExpectationSignatures.add(
                                          InjectExpectationSignature.builder()
                                              .type(EXPECTATION_SIGNATURE_TYPE_FILE_NAME)
                                              .value(payloadFileDrop.getFileDropFile().getName())
                                              .build());
                                      // TODO File hash
                                      break;
                                    case PayloadType.DNS_RESOLUTION:
                                      DnsResolution payloadDnsResolution =
                                          (DnsResolution)
                                              Hibernate.unproxy(injectorContract.getPayload());
                                      injectExpectationSignatures.add(
                                          InjectExpectationSignature.builder()
                                              .type(EXPECTATION_SIGNATURE_TYPE_HOSTNAME)
                                              .value(
                                                  payloadDnsResolution.getHostname()
                                                      .split("\\r?\\n")[0])
                                              .build());
                                      break;
                                    default:
                                      throw new UnsupportedOperationException(
                                          "Payload type "
                                              + injectorContract.getPayload().getType()
                                              + " is not supported");
                                  }
                                } else {
                                  injectExpectationSignatures.add(
                                      InjectExpectationSignature.builder()
                                          .type(EXPECTATION_SIGNATURE_TYPE_PROCESS_NAME)
                                          .value(executionAgent.getProcessName())
                                          .build());
                                }

                                execution.addTrace(
                                    getNewInfoTrace(
                                        "Caldera executed the ability on agent"
                                            + executionAgent.getExecutedByUser()
                                            + " using "
                                            + executionAgent.getProcessName()
                                            + " (paw: "
                                            + executionAgent.getExternalReference()
                                            + ", linkID: "
                                            + exploitResult.getLinkId()
                                            + ")",
                                        ExecutionTraceAction.EXECUTION,
                                        executionAgent,
                                        List.of(exploitResult.getLinkId())));
                              } else {
                                execution.addTrace(
                                    getNewErrorTrace(
                                        "Caldera failed to execute the ability on agent"
                                            + executionAgent.getExecutedByUser()
                                            + " ("
                                            + result
                                            + ")",
                                        ExecutionTraceAction.COMPLETE,
                                        executionAgent));
                              }
                            } else {
                              execution.addTrace(
                                  getNewErrorTrace(
                                      "Caldera failed to execute ability on agent "
                                          + executionAgent.getExecutedByUser()
                                          + "(platform is not compatible:"
                                          + endpointAgent.getPlatform().name()
                                          + ")",
                                      ExecutionTraceAction.COMPLETE,
                                      executionAgent));
                            }
                          } else {
                            execution.addTrace(
                                getNewErrorTrace(
                                    "Caldera failed to execute the ability on agent "
                                        + agent.getExecutedByUser()
                                        + " (temporary injector not spawned correctly)",
                                    ExecutionTraceAction.COMPLETE,
                                    agent));
                          }
                        } catch (Exception e) {
                          execution.addTrace(
                              getNewErrorTrace(
                                  "Caldera failed to execute the ability on agent "
                                      + agent.getExecutedByUser()
                                      + " ("
                                      + e.getMessage()
                                      + ")",
                                  ExecutionTraceAction.COMPLETE,
                                  agent));
                          log.severe(Arrays.toString(e.getStackTrace()));
                        }
                      });
            },
            () ->
                execution.addTrace(
                    getNewErrorTrace(
                        "Inject does not have a contract", ExecutionTraceAction.COMPLETE)));

    if (asyncIds.isEmpty()) {
      throw new UnsupportedOperationException(
          "Caldera failed to execute the ability due to above errors");
    }

    List<AssetGroup> assetGroups = injection.getAssetGroups();
    assetGroups.forEach(
        (assetGroup ->
            computeExpectationsForAssetGroup(
                expectations, content, assetGroup, new ArrayList<>())));

    String message = "Caldera executed the ability on " + asyncIds.size() + " asset(s)";
    execution.addTrace(getNewInfoTrace(message, ExecutionTraceAction.EXECUTION, asyncIds));
    injectExpectationService.buildAndSaveInjectExpectations(injection, expectations);
    return new ExecutionProcess(true);
  }

  @Override
  public StatusPayload getPayloadOutput(String externalId) {
    StatusPayload statusPayload = new StatusPayload();
    Ability ability = calderaService.findAbilityById(externalId);
    if (ability != null) {
      ability
          .getExecutors()
          .forEach(
              executor -> {
                PayloadCommandBlock payloadCommandBlock = new PayloadCommandBlock();
                if (executor.getCommand() != null && !executor.getCommand().isBlank()) {
                  payloadCommandBlock.setContent(executor.getCommand());
                }
                if (executor.getCleanup() != null && !executor.getCleanup().isEmpty()) {
                  payloadCommandBlock.setCleanupCommand(executor.getCleanup());
                }
                if (executor.getCommandExecutor() != null
                    && !executor.getCommandExecutor().isBlank()) {
                  payloadCommandBlock.setExecutor(executor.getCommandExecutor());
                }
                statusPayload.setPayloadCommandBlocks(
                    Collections.singletonList(payloadCommandBlock));
              });
      statusPayload.setExternalId(externalId);
    }

    return statusPayload;
  }

  // -- PRIVATE --

  private io.openbas.database.model.Agent findAndRegisterAgentForExecution(
      @NotNull final Inject inject,
      @NotNull final Endpoint assetEndpoint,
      @NotNull final io.openbas.database.model.Agent agent)
      throws InterruptedException {
    io.openbas.database.model.Agent agentForExecution = null;
    if (!assetEndpoint.getType().equals("Endpoint")) {
      log.log(
          Level.SEVERE,
          "Caldera failed to execute ability on the assetEndpoint because type is not supported: "
              + assetEndpoint.getType());
      return null;
    }
    log.log(Level.INFO, "Trying to find an available executor for " + assetEndpoint.getName());
    for (int i = 0; i < RETRY_NUMBER; i++) {
      // Find an executor agent matching the assetEndpoint
      log.log(Level.INFO, "Listing agentsCaldera...");
      List<Agent> agentsCaldera =
          this.calderaService.agents().stream()
              .filter(
                  agentCaldera ->
                      agentCaldera.getExe_name().contains("implant")
                          && (now().toEpochMilli()
                                  - Time.toInstant(agentCaldera.getCreated()).toEpochMilli())
                              < io.openbas.database.model.Agent.ACTIVE_THRESHOLD
                          && (agentCaldera.getHost().equals(assetEndpoint.getHostname())
                              || agentCaldera
                                  .getHost()
                                  .split("\\.")[0]
                                  .equals(assetEndpoint.getHostname().split("\\.")[0]))
                          && Arrays.stream(assetEndpoint.getIps())
                              .anyMatch(
                                  s ->
                                      Arrays.stream(agentCaldera.getHost_ip_addrs())
                                          .toList()
                                          .contains(s)))
              .toList();
      log.log(Level.INFO, "List return with " + agentsCaldera.size() + " agents");

      //
      if (!agentsCaldera.isEmpty()) {
        for (Agent agentCaldera : agentsCaldera) {
          // Check in the database if not exist
          Optional<io.openbas.database.model.Agent> resolvedExistingAgent =
              this.agentService.findByExternalReference(agentCaldera.getPaw());

          if (resolvedExistingAgent.isEmpty()) {
            log.log(Level.INFO, "Agent found and not present in the database, creating it...");
            io.openbas.database.model.Agent newAgent = new io.openbas.database.model.Agent();
            newAgent.setInject(inject);
            newAgent.setParent(agent);
            newAgent.setProcessName(agentCaldera.getExe_name());
            newAgent.setExecutor(agent.getExecutor());
            newAgent.setExternalReference(agentCaldera.getPaw());
            newAgent.setPrivilege(io.openbas.database.model.Agent.PRIVILEGE.admin);
            newAgent.setDeploymentMode(io.openbas.database.model.Agent.DEPLOYMENT_MODE.session);
            newAgent.setExecutedByUser(agentCaldera.getUsername());
            newAgent.setAsset(assetEndpoint);
            agentForExecution = this.agentService.createOrUpdateAgent(newAgent);
            break;
          }
        }
      }
      if (agentForExecution != null) {
        break;
      }
      Thread.sleep(5000);
    }
    return agentForExecution;
  }

  /**
   * In case of asset group if expectation group -> we have an expectation for the group and one for
   * each asset if not expectation group -> we have an individual expectation for each asset
   */
  private void computeExpectationsForAssetGroup(
      @NotNull final List<Expectation> expectations,
      @NotNull final CalderaInjectContent content,
      @NotNull final AssetGroup assetGroup,
      final List<InjectExpectationSignature> injectExpectationSignatures) {
    if (!content.getExpectations().isEmpty()) {
      expectations.addAll(
          content.getExpectations().stream()
              .flatMap(
                  (expectation) ->
                      switch (expectation.getType()) {
                        case PREVENTION -> {
                          // Verify that at least one asset in the group has been executed
                          List<Asset> assets =
                              this.assetGroupService.assetsFromAssetGroup(assetGroup.getId());
                          if (assets.stream()
                              .anyMatch(
                                  (asset) ->
                                      expectations.stream()
                                          .filter(e -> EXPECTATION_TYPE.PREVENTION == e.type())
                                          .anyMatch(
                                              (e) ->
                                                  ((PreventionExpectation) e).getAsset() != null
                                                      && ((PreventionExpectation) e)
                                                          .getAsset()
                                                          .getId()
                                                          .equals(asset.getId())))) {
                            yield Stream.of(
                                preventionExpectationForAssetGroup(
                                    expectation.getScore(),
                                    expectation.getName(),
                                    expectation.getDescription(),
                                    assetGroup,
                                    expectation.isExpectationGroup(),
                                    expectation.getExpirationTime(),
                                    injectExpectationSignatures));
                          }
                          yield Stream.of();
                        }
                        case DETECTION -> {
                          // Verify that at least one asset in the group has been executed
                          List<Asset> assets =
                              this.assetGroupService.assetsFromAssetGroup(assetGroup.getId());
                          if (assets.stream()
                              .anyMatch(
                                  (asset) ->
                                      expectations.stream()
                                          .filter(e -> EXPECTATION_TYPE.DETECTION == e.type())
                                          .anyMatch(
                                              (e) ->
                                                  ((DetectionExpectation) e).getAsset() != null
                                                      && ((DetectionExpectation) e)
                                                          .getAsset()
                                                          .getId()
                                                          .equals(asset.getId())))) {
                            yield Stream.of(
                                detectionExpectationForAssetGroup(
                                    expectation.getScore(),
                                    expectation.getName(),
                                    expectation.getDescription(),
                                    assetGroup,
                                    expectation.isExpectationGroup(),
                                    expectation.getExpirationTime(),
                                    injectExpectationSignatures));
                          }
                          yield Stream.of();
                        }
                        case MANUAL -> {
                          // Verify that at least one asset in the group has been executed
                          List<Asset> assets =
                              this.assetGroupService.assetsFromAssetGroup(assetGroup.getId());
                          if (assets.stream()
                              .anyMatch(
                                  (asset) ->
                                      expectations.stream()
                                          .filter(e -> EXPECTATION_TYPE.MANUAL == e.type())
                                          .anyMatch(
                                              (e) ->
                                                  ((ManualExpectation) e).getAsset() != null
                                                      && ((ManualExpectation) e)
                                                          .getAsset()
                                                          .getId()
                                                          .equals(asset.getId())))) {
                            yield Stream.of(
                                manualExpectationForAssetGroup(
                                    expectation.getScore(),
                                    expectation.getName(),
                                    expectation.getDescription(),
                                    assetGroup,
                                    expectation.getExpirationTime(),
                                    expectation.isExpectationGroup()));
                          }
                          yield Stream.of();
                        }
                        default -> Stream.of();
                      })
              .toList());
    }
  }
}
