package io.openbas.injectors.openbas;

import static io.openbas.database.model.ExecutionTraces.getNewErrorTrace;
import static io.openbas.database.model.InjectExpectationSignature.*;
import static io.openbas.model.expectation.DetectionExpectation.*;
import static io.openbas.model.expectation.ManualExpectation.*;
import static io.openbas.model.expectation.PreventionExpectation.*;

import io.openbas.database.model.*;
import io.openbas.execution.ExecutableInject;
import io.openbas.executors.Injector;
import io.openbas.injectors.openbas.model.OpenBASImplantInjectContent;
import io.openbas.model.ExecutionProcess;
import io.openbas.model.Expectation;
import io.openbas.model.expectation.DetectionExpectation;
import io.openbas.model.expectation.ManualExpectation;
import io.openbas.model.expectation.PreventionExpectation;
import io.openbas.rest.inject.service.InjectService;
import io.openbas.service.AssetGroupService;
import io.openbas.service.InjectExpectationService;
import jakarta.validation.constraints.NotNull;
import java.util.*;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;
import org.springframework.stereotype.Component;

@Component(OpenBASImplantContract.TYPE)
@RequiredArgsConstructor
@Log
public class OpenBASImplantExecutor extends Injector {

  private final AssetGroupService assetGroupService;
  private final InjectExpectationService injectExpectationService;
  private final InjectService injectService;

  @Override
  public ExecutionProcess process(Execution execution, ExecutableInject injection)
      throws Exception {
    Inject inject = this.injectService.inject(injection.getInjection().getInject().getId());
    Map<Asset, Boolean> assets = this.injectService.resolveAllAssetsToExecute(inject);

    // Check assets target
    if (assets.isEmpty()) {
      execution.addTrace(
          getNewErrorTrace(
              "Found 0 asset to execute the ability on (likely this inject does not have any target or the targeted asset is inactive and has been purged)",
              ExecutionTraceAction.COMPLETE));
    }

    // Compute expectations
    OpenBASImplantInjectContent content =
        contentConvert(injection, OpenBASImplantInjectContent.class);

    List<Expectation> expectations = new ArrayList<>();
    assets.forEach(
        (asset, isInGroup) -> {
          Optional<InjectorContract> contract = inject.getInjectorContract();
          String payloadType = "";
          if (contract.isPresent()) {
            Payload payload = contract.get().getPayload();
            if (payload == null) {
              log.info(
                  String.format("No payload for inject %s was found, skipping", inject.getId()));
              return;
            }
            payloadType = payload.getType();
          }
          computeExpectationsForAssetAndAgents(
              expectations, content, asset, isInGroup, inject.getId(), payloadType);
        });

    List<AssetGroup> assetGroups = injection.getAssetGroups();
    assetGroups.forEach(
        (assetGroup -> computeExpectationsForAssetGroup(expectations, content, assetGroup)));

    injectExpectationService.buildAndSaveInjectExpectations(injection, expectations);

    return new ExecutionProcess(true);
  }

  // -- PRIVATE --

  /** In case of direct asset, we have an individual expectation for the asset */
  private void computeExpectationsForAssetAndAgents(
      @NotNull final List<Expectation> expectations,
      @NotNull final OpenBASImplantInjectContent content,
      @NotNull final Asset asset,
      final boolean expectationGroup,
      final String injectId,
      final String payloadType) {
    if (!content.getExpectations().isEmpty()) {
      expectations.addAll(
          content.getExpectations().stream()
              .flatMap(
                  expectation ->
                      switch (expectation.getType()) {
                        case PREVENTION -> {
                          PreventionExpectation preventionExpectation =
                              preventionExpectationForAsset(
                                  expectation.getScore(),
                                  expectation.getName(),
                                  expectation.getDescription(),
                                  asset,
                                  expectationGroup, // expectationGroup usefully in front-end
                                  expectation.getExpirationTime());

                          yield Stream.concat(
                              Stream.of(preventionExpectation),
                              // We propagate the asset expectation to agents
                              getPreventionExpectationStream(
                                  asset, injectId, payloadType, preventionExpectation));
                        }
                        case DETECTION -> {
                          DetectionExpectation detectionExpectation =
                              detectionExpectationForAsset(
                                  expectation.getScore(),
                                  expectation.getName(),
                                  expectation.getDescription(),
                                  asset,
                                  expectationGroup,
                                  expectation.getExpirationTime());

                          yield Stream.concat(
                              Stream.of(detectionExpectation),
                              // We propagate the asset expectation to agents
                              getDetectionExpectationStream(
                                  asset, injectId, payloadType, detectionExpectation));
                        }
                        case MANUAL -> {
                          ManualExpectation manualExpectation =
                              manualExpectationForAsset(
                                  expectation.getScore(),
                                  expectation.getName(),
                                  expectation.getDescription(),
                                  asset,
                                  expectation.getExpirationTime(),
                                  expectationGroup);

                          yield Stream.concat(
                              Stream.of(manualExpectation),
                              // We propagate the asset expectation to agents
                              getManualExpectationStream(asset, manualExpectation));
                        }
                        default -> Stream.of();
                      })
              .toList());
    }
  }

  private Stream<ManualExpectation> getManualExpectationStream(
      Asset asset, ManualExpectation manualExpectation) {
    return getActiveAgents(asset).stream()
        .map(
            agent ->
                manualExpectationForAgent(
                    manualExpectation.getScore(),
                    manualExpectation.getName(),
                    manualExpectation.getDescription(),
                    agent,
                    asset,
                    manualExpectation.getExpirationTime()));
  }

  private Stream<DetectionExpectation> getDetectionExpectationStream(
      Asset asset, String injectId, String payloadType, DetectionExpectation detectionExpectation) {
    return getActiveAgents(asset).stream()
        .map(
            agent ->
                detectionExpectationForAgent(
                    detectionExpectation.getScore(),
                    detectionExpectation.getName(),
                    detectionExpectation.getDescription(),
                    agent,
                    asset,
                    detectionExpectation.getExpirationTime(),
                    computeSignatures(injectId, agent.getId(), payloadType)));
  }

  private Stream<PreventionExpectation> getPreventionExpectationStream(
      Asset asset,
      String injectId,
      String payloadType,
      PreventionExpectation preventionExpectation) {
    return getActiveAgents(asset).stream()
        .map(
            agent ->
                preventionExpectationForAgent(
                    preventionExpectation.getScore(),
                    preventionExpectation.getName(),
                    preventionExpectation.getDescription(),
                    agent,
                    asset,
                    preventionExpectation.getExpirationTime(),
                    computeSignatures(injectId, agent.getId(), payloadType)));
  }

  private List<Agent> getActiveAgents(Asset asset) {
    return ((Endpoint) asset)
        .getAgents().stream()
            .filter(agent -> agent.getParent() == null && agent.getInject() == null)
            .filter(Agent::isActive)
            .toList();
  }

  /**
   * In case of asset group if expectation group -> we have an expectation for the group and one for
   * each asset if not expectation group -> we have an individual expectation for each asset
   */
  private void computeExpectationsForAssetGroup(
      @NotNull final List<Expectation> expectations,
      @NotNull final OpenBASImplantInjectContent content,
      @NotNull final AssetGroup assetGroup) {
    if (!content.getExpectations().isEmpty()) {
      expectations.addAll(
          content.getExpectations().stream()
              .flatMap(
                  expectation ->
                      switch (expectation.getType()) {
                        case PREVENTION -> {
                          // Verify that at least one asset in the group has been executed
                          List<Asset> assets =
                              this.assetGroupService.assetsFromAssetGroup(assetGroup.getId());
                          if (assets.stream()
                              .anyMatch(
                                  asset ->
                                      expectations.stream()
                                          .filter(
                                              prevExpectation ->
                                                  InjectExpectation.EXPECTATION_TYPE.PREVENTION
                                                      == prevExpectation.type())
                                          .anyMatch(
                                              prevExpectation ->
                                                  ((PreventionExpectation) prevExpectation)
                                                              .getAsset()
                                                          != null
                                                      && ((PreventionExpectation) prevExpectation)
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
                                    expectation.getExpirationTime()));
                          }
                          yield Stream.of();
                        }
                        case DETECTION -> {
                          // Verify that at least one asset in the group has been executed
                          List<Asset> assets =
                              this.assetGroupService.assetsFromAssetGroup(assetGroup.getId());
                          if (assets.stream()
                              .anyMatch(
                                  asset ->
                                      expectations.stream()
                                          .filter(
                                              detExpectation ->
                                                  InjectExpectation.EXPECTATION_TYPE.DETECTION
                                                      == detExpectation.type())
                                          .anyMatch(
                                              detExpectation ->
                                                  ((DetectionExpectation) detExpectation).getAsset()
                                                          != null
                                                      && ((DetectionExpectation) detExpectation)
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
                                    expectation.getExpirationTime()));
                          }
                          yield Stream.of();
                        }
                        case MANUAL -> {
                          // Verify that at least one asset in the group has been executed
                          List<Asset> assets =
                              this.assetGroupService.assetsFromAssetGroup(assetGroup.getId());
                          if (assets.stream()
                              .anyMatch(
                                  asset ->
                                      expectations.stream()
                                          .filter(
                                              manExpectation ->
                                                  InjectExpectation.EXPECTATION_TYPE.MANUAL
                                                      == manExpectation.type())
                                          .anyMatch(
                                              manExpectation ->
                                                  ((ManualExpectation) manExpectation).getAsset()
                                                          != null
                                                      && ((ManualExpectation) manExpectation)
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

  private static List<InjectExpectationSignature> computeSignatures(
      String injectId, String agentId, String payloadType) {
    List<InjectExpectationSignature> signatures = new ArrayList<>();
    List<String> knownPayloadTypes =
        Arrays.asList("Command", "Executable", "FileDrop", "DnsResolution");

    /*
     * Always add the "Parent process" signature type for the OpenBAS Implant Executor
     */
    signatures.add(
        createSignature(
            EXPECTATION_SIGNATURE_TYPE_PARENT_PROCESS_NAME,
            "obas-implant-" + injectId + "-agent-" + agentId));

    if (!knownPayloadTypes.contains(payloadType)) {
      throw new UnsupportedOperationException("Payload type " + payloadType + " is not supported");
    }
    return signatures;
  }

  private static InjectExpectationSignature createSignature(
      String signatureType, String signatureValue) {
    return builder().type(signatureType).value(signatureValue).build();
  }
}
