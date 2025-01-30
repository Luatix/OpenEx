package io.openbas.injectors.openbas;

import static io.openbas.database.model.InjectExpectationSignature.*;
import static io.openbas.database.model.InjectStatusExecution.traceError;
import static io.openbas.model.expectation.DetectionExpectation.*;
import static io.openbas.model.expectation.ManualExpectation.*;
import static io.openbas.model.expectation.PreventionExpectation.*;

import io.openbas.database.model.*;
import io.openbas.database.repository.InjectRepository;
import io.openbas.execution.ExecutableInject;
import io.openbas.executors.Injector;
import io.openbas.injectors.openbas.model.OpenBASImplantInjectContent;
import io.openbas.model.ExecutionProcess;
import io.openbas.model.Expectation;
import io.openbas.model.expectation.DetectionExpectation;
import io.openbas.model.expectation.ManualExpectation;
import io.openbas.model.expectation.PreventionExpectation;
import io.openbas.service.AssetGroupService;
import io.openbas.service.InjectExpectationService;
import jakarta.persistence.EntityNotFoundException;
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
  private final InjectRepository injectRepository;
  private final InjectExpectationService injectExpectationService;

  private Map<Endpoint, Boolean> resolveAllEndpoints(@NotNull final ExecutableInject inject) {
    Map<Endpoint, Boolean> assets = new HashMap<>();
    inject
        .getAssets()
        .forEach(
            (asset -> {
              assets.put((Endpoint) asset, false);
            }));
    inject
        .getAssetGroups()
        .forEach(
            (assetGroup -> {
              List<Asset> assetsFromGroup =
                  this.assetGroupService.assetsFromAssetGroup(assetGroup.getId());
              // Verify asset validity
              assetsFromGroup.forEach(
                  (asset) -> {
                    assets.put((Endpoint) asset, true);
                  });
            }));
    return assets;
  }

  /** In case of direct endpoint, we have an individual expectation for the endpoint */
  private void computeExpectationsForAssetAndAgents(
      @NotNull final List<Expectation> expectations,
      @NotNull final OpenBASImplantInjectContent content,
      @NotNull final Endpoint endpoint,
      final boolean expectationGroup,
      final List<InjectExpectationSignature> injectExpectationSignatures) {
    if (!content.getExpectations().isEmpty()) {
      expectations.addAll(
          content.getExpectations().stream()
              .flatMap(
                  (expectation) ->
                      switch (expectation.getType()) {
                        case PREVENTION -> {
                          PreventionExpectation preventionExpectation =
                              preventionExpectationForAsset(
                                  expectation.getScore(),
                                  expectation.getName(),
                                  expectation.getDescription(),
                                  endpoint,
                                  expectationGroup,
                                  expectation.getExpirationTime());

                          List<PreventionExpectation> agentExpectations =
                              endpoint.getAgents().stream()
                                  .map(
                                      agent ->
                                          preventionExpectationForAgent(
                                              agent,
                                              endpoint,
                                              preventionExpectation,
                                              injectExpectationSignatures.add(
                                                  createSignature(
                                                      EXPECTATION_SIGNATURE_TYPE_PARENT_PROCESS_NAME,
                                                      "obas-implant-"
                                                          + agent.getInject().getId()
                                                          + "-agent-"
                                                          + agent.getId()))))
                                  .toList();
                          yield Stream.of(preventionExpectation, agentExpectations);
                        } // expectationGroup usefully in front-end
                        case DETECTION -> {
                          DetectionExpectation detectionExpectation =
                              detectionExpectationForAsset(
                                  expectation.getScore(),
                                  expectation.getName(),
                                  expectation.getDescription(),
                                  endpoint,
                                  expectationGroup,
                                  expectation.getExpirationTime(),
                                  injectExpectationSignatures);
                          List<DetectionExpectation> agentExpectations =
                              endpoint.getAgents().stream()
                                  .map(
                                      agent ->
                                          detectionExpectationForAgent(
                                              agent,
                                              endpoint,
                                              detectionExpectation,
                                              injectExpectationSignatures.add(
                                                  createSignature(
                                                      EXPECTATION_SIGNATURE_TYPE_PARENT_PROCESS_NAME,
                                                      "obas-implant-"
                                                          + agent.getInject().getId()
                                                          + "-agent-"
                                                          + agent.getId()))))
                                  .toList();
                          yield Stream.of(detectionExpectation, agentExpectations);
                        }
                        case MANUAL -> {
                          ManualExpectation manualExpectation =
                              manualExpectationForAsset(
                                  expectation.getScore(),
                                  expectation.getName(),
                                  expectation.getDescription(),
                                  endpoint,
                                  expectation.getExpirationTime(),
                                  expectationGroup);
                          List<ManualExpectation> agentExpectations =
                              endpoint.getAgents().stream()
                                  .map(
                                      agent ->
                                          manualExpectationForAgent(
                                              agent, endpoint, manualExpectation))
                                  .toList();
                          yield Stream.of(manualExpectation, agentExpectations);
                        }
                        default -> Stream.of();
                      })
              .toList());
    }
  }

  /**
   * In case of asset group if expectation group -> we have an expectation for the group and one for
   * each asset if not expectation group -> we have an individual expectation for each asset
   */
  private void computeExpectationsForAssetGroup(
      @NotNull final List<Expectation> expectations,
      @NotNull final OpenBASImplantInjectContent content,
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
                                          .filter(
                                              e ->
                                                  InjectExpectation.EXPECTATION_TYPE.PREVENTION
                                                      == e.type())
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
                                          .filter(
                                              e ->
                                                  InjectExpectation.EXPECTATION_TYPE.DETECTION
                                                      == e.type())
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
                                          .filter(
                                              e ->
                                                  InjectExpectation.EXPECTATION_TYPE.MANUAL
                                                      == e.type())
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

  @Override
  public ExecutionProcess process(Execution execution, ExecutableInject injection)
      throws Exception {
    Inject inject =
        this.injectRepository
            .findById(injection.getInjection().getInject().getId())
            .orElseThrow(() -> new EntityNotFoundException("Inject not found"));
    Map<Endpoint, Boolean> endpoints = this.resolveAllEndpoints(injection);

    // Check endpoints target
    if (endpoints.isEmpty()) {
      execution.addTrace(
          traceError(
              "Found 0 asset to execute the ability on (likely this inject does not have any target or the targeted asset is inactive and has been purged)"));
    }

    // Compute expectations
    OpenBASImplantInjectContent content =
        contentConvert(injection, OpenBASImplantInjectContent.class);

    List<Expectation> expectations = new ArrayList<>();
    endpoints.forEach(
        (endpoint, isInGroup) -> {
          Optional<InjectorContract> contract = inject.getInjectorContract();
          List<InjectExpectationSignature> injectExpectationSignatures = new ArrayList<>();

          if (contract.isPresent()) {
            Payload payload = contract.get().getPayload();
            if (payload == null) {
              log.info(
                  String.format("No payload for inject %s was found, skipping", inject.getId()));
              return;
            }
            injectExpectationSignatures = spawnSignatures(payload);
            execution.setExpectedCount(
                payload.getPrerequisites().size()
                    + (payload.getCleanupCommand() != null ? 1 : 0)
                    + payload.getNumberOfActions());
          }
          computeExpectationsForAssetAndAgents(
              expectations, content, endpoint, isInGroup, injectExpectationSignatures);
        });

    List<AssetGroup> assetGroups = injection.getAssetGroups();
    assetGroups.forEach(
        (assetGroup ->
            computeExpectationsForAssetGroup(
                expectations, content, assetGroup, new ArrayList<>())));

    injectExpectationService.buildAndSaveInjectExpectations(injection, expectations);

    return new ExecutionProcess(true);
  }

  private List<InjectExpectationSignature> spawnSignatures(Payload payload) {
    List<InjectExpectationSignature> signatures = new ArrayList<>();
    List<String> knownPayloadTypes =
        Arrays.asList("Command", "Executable", "FileDrop", "DnsResolution");

    if (!knownPayloadTypes.contains(payload.getType())) {
      throw new UnsupportedOperationException(
          "Payload type " + payload.getType() + " is not supported");
    }
    return signatures;
  }

  private static InjectExpectationSignature createSignature(
      String signatureType, String signatureValue) {
    return InjectExpectationSignature.builder().type(signatureType).value(signatureValue).build();
  }
}
