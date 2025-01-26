package io.openbas.rest.inject_expectation;

import static java.util.Collections.emptyList;
import static org.junit.jupiter.api.Assertions.assertEquals;

import io.openbas.IntegrationTest;
import io.openbas.collectors.expectations_expiration_manager.service.ExpectationsExpirationManagerService;
import io.openbas.database.model.*;
import io.openbas.database.repository.*;
import io.openbas.execution.ExecutableInject;
import io.openbas.model.expectation.DetectionExpectation;
import io.openbas.service.InjectExpectationService;
import io.openbas.utils.fixtures.*;
import io.openbas.utils.mockUser.WithMockAdminUser;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@ExtendWith(MockitoExtension.class)
public class ExpectationsExpirationManagerServiceTest extends IntegrationTest {

  public static final long EXPIRATION_TIME_1_s = 1L;
  @Autowired private AssetGroupRepository assetGroupRepository;
  @Autowired private EndpointRepository endpointRepository;
  @Autowired private AgentRepository agentRepository;
  @Autowired private InjectRepository injectRepository;
  @Autowired private InjectorRepository injectorRepository;
  @Autowired private InjectorContractRepository injectorContractRepository;
  @Autowired private InjectExpectationRepository injectExpectationRepository;
  @Autowired private InjectExpectationService injectExpectationService;
  @Autowired private ExpectationsExpirationManagerService expectationsExpirationManagerService;

  // Saved entities for test setup
  private static Injector savedInjector;
  private static InjectorContract savedInjectorContract;
  private static AssetGroup savedAssetGroup;
  private static Endpoint savedEndpoint;
  private static Agent savedAgent;
  private static Agent savedAgent1;
  private static Inject savedInject;

  @BeforeAll
  void beforeAll() {
    InjectorContract injectorContract =
        InjectorContractFixture.createInjectorContract(
            "84b3b140-6b7d-47d9-9b61-8fa05882fc7e",
            Map.of("en", "AMSI Bypass - AMSI InitFailed"),
            "{}");
    savedInjector =
        injectorRepository.save(
            InjectorFixture.createInjector(
                "49229430-b5b5-431f-ba5b-f36f599b0144", "OpenBAS Implant", "openbas_implant"));
    injectorContract.setInjector(savedInjector);
    savedInjectorContract = injectorContractRepository.save(injectorContract);

    // -- Targets --
    savedEndpoint = endpointRepository.save(EndpointFixture.createEndpoint());
    savedAgent = agentRepository.save(AgentFixture.createAgent(savedEndpoint, "external01"));
    savedAgent1 = agentRepository.save(AgentFixture.createAgent(savedEndpoint, "external02"));
    savedAssetGroup =
        assetGroupRepository.save(
            AssetGroupFixture.createAssetGroupWithAssets(
                "asset group name", List.of(savedEndpoint)));

    // -- Inject --
    savedInject =
        injectRepository.save(
            InjectFixture.createTechnicalInjectWithAssetGroup(
                savedInjectorContract, "AMSI Bypass - AMSI InitFailed", savedAssetGroup));
  }

  @AfterAll
  void afterAll() {
    agentRepository.deleteAll();
    injectRepository.deleteAll();
    endpointRepository.deleteAll();
  }

  @AfterEach
  void afterEach() {
    injectExpectationRepository.deleteAll();
  }

  @Nested
  @WithMockAdminUser
  @DisplayName("Update injectExpectations with expectationsExpirationManagerService")
  class ComputeExpectationsWithExpectationExpiredManagerService {

    @Test
    @DisplayName("All injectExpectations are expired")
    @WithMockAdminUser
    void allExpectationAreExpired() {
      // -- PREPARE --
      // Build and save expectations for asset group with one asset and two agents
      ExecutableInject executableInject =
          new ExecutableInject(
              false,
              true,
              savedInject,
              emptyList(),
              List.of(savedEndpoint),
              List.of(savedAssetGroup),
              emptyList());
      DetectionExpectation detectionExpectation =
          ExpectationFixture.createDetectionExpectationForAssetGroup(
              savedAssetGroup, EXPIRATION_TIME_1_s);
      DetectionExpectation detectionExpectationForAsset =
          ExpectationFixture.createDetectionExpectationAssetForAssetGroup(
              savedEndpoint, EXPIRATION_TIME_1_s);

      injectExpectationService.buildAndSaveInjectExpectations(
          executableInject, List.of(detectionExpectation, detectionExpectationForAsset));

      // Verify inject expectations : existence and score null
      assertEquals(
          1,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .size());
      assertEquals(
          null,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .get(0)
              .getScore());
      assertEquals(
          null,
          injectExpectationRepository
              .findAllByInjectAndAsset(savedInject.getId(), savedEndpoint.getId())
              .get(0)
              .getScore());
      assertEquals(
          null,
          injectExpectationRepository
              .findAllByInjectAndAgent(savedInject.getId(), savedAgent.getId())
              .get(0)
              .getScore());
      assertEquals(
          null,
          injectExpectationRepository
              .findAllByInjectAndAgent(savedInject.getId(), savedAgent1.getId())
              .get(0)
              .getScore());

      // -- EXECUTE --
      expectationsExpirationManagerService.computeExpectations();

      // -- ASSERT --
      assertEquals(
          1,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .size());
      assertEquals(
          0.0,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .get(0)
              .getScore());
      assertEquals(
          0.0,
          injectExpectationRepository
              .findAllByInjectAndAsset(savedInject.getId(), savedEndpoint.getId())
              .get(0)
              .getScore());
      assertEquals(
          0.0,
          injectExpectationRepository
              .findAllByInjectAndAgent(savedInject.getId(), savedAgent.getId())
              .get(0)
              .getScore());
      assertEquals(
          0.0,
          injectExpectationRepository
              .findAllByInjectAndAgent(savedInject.getId(), savedAgent1.getId())
              .get(0)
              .getScore());
    }

    @Test
    @DisplayName("One injectExpectations is already filled")
    @WithMockAdminUser
    void OneExpectationIsAlreadyFilled() {
      // -- PREPARE --
      // Build and save expectations for asset group with one asset and two agents
      ExecutableInject executableInject =
          new ExecutableInject(
              false,
              true,
              savedInject,
              emptyList(),
              List.of(savedEndpoint),
              List.of(savedAssetGroup),
              emptyList());
      DetectionExpectation detectionExpectation =
          ExpectationFixture.createDetectionExpectationForAssetGroup(
              savedAssetGroup, EXPIRATION_TIME_1_s);
      DetectionExpectation detectionExpectationForAsset =
          ExpectationFixture.createDetectionExpectationAssetForAssetGroup(
              savedEndpoint, EXPIRATION_TIME_1_s);

      injectExpectationService.buildAndSaveInjectExpectations(
          executableInject, List.of(detectionExpectation, detectionExpectationForAsset));

      // Update one expectation from one agent with source collector-id
      List<InjectExpectation> injectExpectations =
          injectExpectationRepository.findAllByInjectAndAgent(
              savedInject.getId(), savedAgent.getId());

      injectExpectations
          .get(0)
          .setResults(
              List.of(
                  InjectExpectationResult.builder()
                      .sourceId("collector-id")
                      .sourceName("collector-name")
                      .sourceType("collector-type")
                      .score(50.0)
                      .build()));

      injectExpectationRepository.save(injectExpectations.get(0));

      // Verify inject expectations : existence and score null
      assertEquals(
          1,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .size());
      assertEquals(
          null,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .get(0)
              .getScore());
      assertEquals(
          null,
          injectExpectationRepository
              .findAllByInjectAndAsset(savedInject.getId(), savedEndpoint.getId())
              .get(0)
              .getScore());
      assertEquals(
          50.0,
          injectExpectationRepository
              .findAllByInjectAndAgent(savedInject.getId(), savedAgent.getId())
              .get(0)
              .getResults()
              .get(0)
              .getScore());
      assertEquals(
          null,
          injectExpectationRepository
              .findAllByInjectAndAgent(savedInject.getId(), savedAgent1.getId())
              .get(0)
              .getScore());

      // -- EXECUTE --
      expectationsExpirationManagerService.computeExpectations();

      // -- ASSERT --
      assertEquals(
          1,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .size());
      assertEquals(
          0.0,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .get(0)
              .getScore());
      assertEquals(
          0.0,
          injectExpectationRepository
              .findAllByInjectAndAsset(savedInject.getId(), savedEndpoint.getId())
              .get(0)
              .getScore());
      assertEquals(
          50.0,
          injectExpectationRepository
              .findAllByInjectAndAgent(savedInject.getId(), savedAgent.getId())
              .get(0)
              .getResults()
              .get(0)
              .getScore());
      assertEquals(
          0.0,
          injectExpectationRepository
              .findAllByInjectAndAgent(savedInject.getId(), savedAgent1.getId())
              .get(0)
              .getScore());
    }

    @Test
    @DisplayName("The agent expectation are already filled")
    @WithMockAdminUser
    void agentExpectationsAreAlreadyFilled() {
      // -- PREPARE --
      // Build and save expectations for asset group with one asset and two agents
      ExecutableInject executableInject =
          new ExecutableInject(
              false,
              true,
              savedInject,
              emptyList(),
              List.of(savedEndpoint),
              List.of(savedAssetGroup),
              emptyList());
      DetectionExpectation detectionExpectation =
          ExpectationFixture.createDetectionExpectationForAssetGroup(
              savedAssetGroup, EXPIRATION_TIME_1_s);
      DetectionExpectation detectionExpectationForAsset =
          ExpectationFixture.createDetectionExpectationAssetForAssetGroup(
              savedEndpoint, EXPIRATION_TIME_1_s);

      injectExpectationService.buildAndSaveInjectExpectations(
          executableInject, List.of(detectionExpectation, detectionExpectationForAsset));

      // Update one expectation from one agent with source collector-id
      List<InjectExpectation> injectExpectations =
          List.of(
              injectExpectationRepository
                  .findAllByInjectAndAgent(savedInject.getId(), savedAgent.getId())
                  .get(0),
              injectExpectationRepository
                  .findAllByInjectAndAgent(savedInject.getId(), savedAgent1.getId())
                  .get(0));

      injectExpectations.forEach(
          injectExpectation -> {
            injectExpectation.setResults(
                List.of(
                    InjectExpectationResult.builder()
                        .sourceId("collector-id")
                        .sourceName("collector-name")
                        .sourceType("collector-type")
                        .score(100.0)
                        .build()));
            injectExpectation.setScore(100.0);
          });

      injectExpectationRepository.saveAll(injectExpectations);

      // Verify inject expectations : existence and score null
      assertEquals(
          1,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .size());
      assertEquals(
          null,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .get(0)
              .getScore());
      assertEquals(
          null,
          injectExpectationRepository
              .findAllByInjectAndAsset(savedInject.getId(), savedEndpoint.getId())
              .get(0)
              .getScore());
      assertEquals(
          100.0,
          injectExpectationRepository
              .findAllByInjectAndAgent(savedInject.getId(), savedAgent.getId())
              .get(0)
              .getScore());
      assertEquals(
          100.0,
          injectExpectationRepository
              .findAllByInjectAndAgent(savedInject.getId(), savedAgent1.getId())
              .get(0)
              .getScore());

      // -- EXECUTE --
      expectationsExpirationManagerService.computeExpectations();

      // -- ASSERT --
      assertEquals(
          1,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .size());
      assertEquals(
          100.0,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .get(0)
              .getScore());
      assertEquals(
          100.0,
          injectExpectationRepository
              .findAllByInjectAndAsset(savedInject.getId(), savedEndpoint.getId())
              .get(0)
              .getScore());
      assertEquals(
          100.0,
          injectExpectationRepository
              .findAllByInjectAndAgent(savedInject.getId(), savedAgent.getId())
              .get(0)
              .getScore());
      assertEquals(
          100.0,
          injectExpectationRepository
              .findAllByInjectAndAgent(savedInject.getId(), savedAgent1.getId())
              .get(0)
              .getScore());
    }

    @Test
    @DisplayName("Asset expectations without agent expectation linked")
    @WithMockAdminUser
    void assetExpectationWithoutAgentExpectationsLinked() {
      // -- PREPARE --
      // Build and save expectations for asset group with one asset and two agents
      ExecutableInject executableInject =
          new ExecutableInject(
              false,
              true,
              savedInject,
              emptyList(),
              List.of(savedEndpoint),
              List.of(savedAssetGroup),
              emptyList());
      DetectionExpectation detectionExpectation =
          ExpectationFixture.createDetectionExpectationForAssetGroup(
              savedAssetGroup, EXPIRATION_TIME_1_s);
      DetectionExpectation detectionExpectationForAsset =
          ExpectationFixture.createDetectionExpectationAssetForAssetGroup(
              savedEndpoint, EXPIRATION_TIME_1_s);

      injectExpectationService.buildAndSaveInjectExpectations(
          executableInject, List.of(detectionExpectation, detectionExpectationForAsset));

      // Delete agent inject expectations to test behavior of assets without agents
      List<InjectExpectation> injectExpectations =
          List.of(
              injectExpectationRepository
                  .findAllByInjectAndAgent(savedInject.getId(), savedAgent.getId())
                  .get(0),
              injectExpectationRepository
                  .findAllByInjectAndAgent(savedInject.getId(), savedAgent1.getId())
                  .get(0));

      List<String> ids = injectExpectations.stream().map(e->e.getId()).toList();

      injectExpectationRepository.deleteAllById(ids);

      // Verify inject expectations : existence and score null
      assertEquals(
          1,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .size());
      assertEquals(
          null,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .get(0)
              .getScore());
      assertEquals(
          null,
          injectExpectationRepository
              .findAllByInjectAndAsset(savedInject.getId(), savedEndpoint.getId())
              .get(0)
              .getScore());

      // -- EXECUTE --
      expectationsExpirationManagerService.computeExpectations();

      // -- ASSERT --
      assertEquals(
          1,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .size());
      assertEquals(
          0.0,
          injectExpectationRepository
              .findAllByInjectAndAssetGroup(savedInject.getId(), savedAssetGroup.getId())
              .get(0)
              .getScore());
      assertEquals(
          0.0,
          injectExpectationRepository
              .findAllByInjectAndAsset(savedInject.getId(), savedEndpoint.getId())
              .get(0)
              .getScore());
    }
  }
}
