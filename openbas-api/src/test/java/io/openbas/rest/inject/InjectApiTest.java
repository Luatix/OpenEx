package io.openbas.rest.inject;

import static io.openbas.config.SessionHelper.currentUser;
import static io.openbas.database.model.ExerciseStatus.RUNNING;
import static io.openbas.injectors.email.EmailContract.EMAIL_DEFAULT;
import static io.openbas.rest.exercise.ExerciseApi.EXERCISE_URI;
import static io.openbas.rest.inject.InjectApi.INJECT_URI;
import static io.openbas.rest.scenario.ScenarioApi.SCENARIO_URI;
import static io.openbas.utils.JsonUtils.asJsonString;
import static io.openbas.utils.fixtures.InjectFixture.getInjectForEmailContract;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.TestInstance.Lifecycle.PER_CLASS;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jayway.jsonpath.JsonPath;
import io.openbas.IntegrationTest;
import io.openbas.database.model.*;
import io.openbas.database.repository.*;
import io.openbas.execution.ExecutableInject;
import io.openbas.executors.Executor;
import io.openbas.rest.exercise.service.ExerciseService;
import io.openbas.rest.inject.form.*;
import io.openbas.rest.inject.service.InjectStatusService;
import io.openbas.service.ScenarioService;
import io.openbas.utils.fixtures.*;
import io.openbas.utils.fixtures.composers.AgentComposer;
import io.openbas.utils.fixtures.composers.EndpointComposer;
import io.openbas.utils.fixtures.composers.InjectComposer;
import io.openbas.utils.fixtures.composers.InjectStatusComposer;
import io.openbas.utils.mockUser.WithMockAdminUser;
import io.openbas.utils.mockUser.WithMockObserverUser;
import io.openbas.utils.mockUser.WithMockPlannerUser;
import jakarta.annotation.Resource;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import jakarta.transaction.Transactional;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.util.ResourceUtils;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(PER_CLASS)
@ExtendWith(MockitoExtension.class)
class InjectApiTest extends IntegrationTest {

  static Exercise EXERCISE;
  static Scenario SCENARIO;
  static Document DOCUMENT1;
  static Document DOCUMENT2;
  static Team TEAM;
  static String SCENARIO_INJECT_ID;
  static InjectorContract PAYLOAD_INJECTOR_CONTRACT;
  static InjectorContract PAYLOAD_INJECTOR_CONTRACT_2;
  @Resource protected ObjectMapper mapper;
  @Autowired private MockMvc mvc;
  @Autowired private ScenarioService scenarioService;
  @Autowired private ExerciseService exerciseService;
  @SpyBean private InjectStatusService injectStatusService;

  @Autowired private AgentComposer agentComposer;
  @Autowired private EndpointComposer endpointComposer;
  @Autowired private InjectComposer injectComposer;
  @Autowired private InjectStatusComposer injectStatusComposer;

  @Autowired private ExerciseRepository exerciseRepository;
  @SpyBean private Executor executor;
  @Autowired private ScenarioRepository scenarioRepository;
  @Autowired private InjectRepository injectRepository;
  @Autowired private DocumentRepository documentRepository;
  @Autowired private CommunicationRepository communicationRepository;
  @Autowired private InjectExpectationRepository injectExpectationRepository;
  @Autowired private TeamRepository teamRepository;
  @Autowired private PayloadRepository payloadRepository;
  @Autowired private InjectorRepository injectorRepository;
  @Autowired private InjectorContractRepository injectorContractRepository;
  @Autowired private UserRepository userRepository;
  @Resource private ObjectMapper objectMapper;
  @MockBean private JavaMailSender javaMailSender;

  @BeforeAll
  void beforeAll() {
    Scenario scenario = new Scenario();
    scenario.setName("Scenario name");
    scenario.setFrom("test@test.com");
    scenario.setReplyTos(List.of("test@test.com"));
    SCENARIO = scenarioService.createScenario(scenario);

    Exercise exercise = new Exercise();
    exercise.setName("Exercise name");
    exercise.setStart(Instant.now());
    exercise.setFrom("test@test.com");
    exercise.setReplyTos(List.of("test@test.com"));
    exercise.setStatus(RUNNING);
    EXERCISE = exerciseService.createExercise(exercise);

    Document document1 = new Document();
    document1.setName("Document 1");
    document1.setType("image");
    Document document2 = new Document();
    document2.setName("Document 2");
    document2.setType("pdf");
    DOCUMENT1 = documentRepository.save(document1);
    DOCUMENT2 = documentRepository.save(document2);

    Team team = new Team();
    team.setName("team");
    TEAM = teamRepository.save(team);
  }

  @AfterAll
  void afterAll() {
    this.scenarioRepository.delete(SCENARIO);
    this.exerciseRepository.delete(EXERCISE);
    this.documentRepository.deleteAll(List.of(DOCUMENT1, DOCUMENT2));
    this.teamRepository.delete(TEAM);
    this.injectorContractRepository.deleteAll(
        List.of(PAYLOAD_INJECTOR_CONTRACT, PAYLOAD_INJECTOR_CONTRACT_2));
  }

  // -- SCENARIOS --

  @DisplayName("Add an inject for scenario")
  @Test
  @Order(1)
  @WithMockPlannerUser
  void addInjectForScenarioTest() throws Exception {
    // -- PREPARE --
    InjectInput input = new InjectInput();
    input.setTitle("Test inject");
    input.setInjectorContract(EMAIL_DEFAULT);
    input.setDependsDuration(0L);

    // -- EXECUTE --
    String response =
        mvc.perform(
                post(SCENARIO_URI + "/" + SCENARIO.getId() + "/injects")
                    .content(asJsonString(input))
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // -- ASSERT --
    assertNotNull(response);
    SCENARIO_INJECT_ID = JsonPath.read(response, "$.inject_id");
    response =
        mvc.perform(get(SCENARIO_URI + "/" + SCENARIO.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();
    assertEquals(SCENARIO_INJECT_ID, JsonPath.read(response, "$.scenario_injects[0]"));
  }

  @DisplayName("Retrieve injects for scenario")
  @Test
  @Order(2)
  @WithMockObserverUser
  void retrieveInjectsForScenarioTest() throws Exception {
    // -- EXECUTE --
    String response =
        mvc.perform(
                get(SCENARIO_URI + "/" + SCENARIO.getId() + "/injects")
                    .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // -- ASSERT --
    assertNotNull(response);
    assertEquals(SCENARIO_INJECT_ID, JsonPath.read(response, "$[0].inject_id"));
  }

  @DisplayName("Retrieve inject for scenario")
  @Test
  @Order(3)
  @WithMockObserverUser
  void retrieveInjectForScenarioTest() throws Exception {
    // -- EXECUTE --
    String response =
        mvc.perform(
                get(SCENARIO_URI + "/" + SCENARIO.getId() + "/injects/" + SCENARIO_INJECT_ID)
                    .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // -- ASSERT --
    assertNotNull(response);
    assertEquals(SCENARIO_INJECT_ID, JsonPath.read(response, "$.inject_id"));
  }

  @DisplayName("Update inject for scenario")
  @Test
  @Order(4)
  @WithMockPlannerUser
  void updateInjectForScenarioTest() throws Exception {
    // -- PREPARE --
    Inject inject = injectRepository.findById(SCENARIO_INJECT_ID).orElseThrow();
    InjectInput input = new InjectInput();
    String injectTitle = "A new title";
    input.setTitle(injectTitle);
    input.setInjectorContract(
        inject.getInjectorContract().map(InjectorContract::getId).orElse(null));
    input.setDependsDuration(inject.getDependsDuration());

    // -- EXECUTE --
    String response =
        mvc.perform(
                put(SCENARIO_URI + "/" + SCENARIO.getId() + "/injects/" + SCENARIO_INJECT_ID)
                    .content(asJsonString(input))
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // -- ASSERT --
    assertNotNull(response);
    assertEquals(injectTitle, JsonPath.read(response, "$.inject_title"));
  }

  @DisplayName("Delete inject for scenario")
  @Test
  @Order(5)
  @WithMockPlannerUser
  void deleteInjectForScenarioTest() throws Exception {
    // -- EXECUTE 1 ASSERT --
    mvc.perform(delete(SCENARIO_URI + "/" + SCENARIO.getId() + "/injects/" + SCENARIO_INJECT_ID))
        .andExpect(status().is2xxSuccessful());

    assertFalse(injectRepository.existsById(SCENARIO_INJECT_ID));
  }

  // BULK DELETE
  @DisplayName("Delete list of injects for scenario")
  @Test
  @Order(6)
  @WithMockPlannerUser
  void deleteInjectsForScenarioTest() throws Exception {
    // -- PREPARE --
    Inject injectForScenario1 = new Inject();
    injectForScenario1.setTitle("Inject for scenario 1");
    injectForScenario1.setCreatedAt(Instant.now());
    injectForScenario1.setUpdatedAt(Instant.now());
    injectForScenario1.setDependsDuration(5L);
    injectForScenario1.setInjectorContract(
        injectorContractRepository.findById(EMAIL_DEFAULT).orElseThrow());
    injectForScenario1.setScenario(SCENARIO);
    Inject createdInject = injectRepository.save(injectForScenario1);

    InjectDocument injectDocument4 = new InjectDocument();
    injectDocument4.setInject(createdInject);
    injectDocument4.setDocument(DOCUMENT2);
    createdInject.setDocuments(List.of(injectDocument4));

    injectExpectationRepository.save(
        InjectExpectationFixture.createArticleInjectExpectation(TEAM, createdInject));

    // -- ASSERT --
    assertTrue(
        injectRepository.existsById(createdInject.getId()),
        "The inject should exist from the database");
    assertFalse(
        injectRepository.findByScenarioId(SCENARIO.getId()).isEmpty(),
        "There should be injects for the scenario in the database");
    assertFalse(
        injectExpectationRepository
            .findAllByInjectAndTeam(createdInject.getId(), TEAM.getId())
            .isEmpty(),
        "There should be expectations for the scenario in the database");

    // -- PREPARE --
    InjectBulkProcessingInput input = new InjectBulkProcessingInput();
    input.setInjectIDsToProcess(List.of(createdInject.getId()));
    input.setSimulationOrScenarioId(SCENARIO.getId());

    // -- EXECUTE --
    mvc.perform(
            delete(INJECT_URI).content(asJsonString(input)).contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().is2xxSuccessful());

    // -- ASSERT --
    assertFalse(
        injectRepository.existsById(createdInject.getId()),
        "The inject should be deleted from the database");
    assertTrue(
        scenarioRepository.existsById(SCENARIO.getId()),
        "The scenario should still exist in the database");
    assertTrue(
        injectRepository.findByScenarioId(SCENARIO.getId()).isEmpty(),
        "There should be no injects for the scenario in the database");
    assertTrue(
        documentRepository.existsById(DOCUMENT2.getId()),
        "The document should still exist in the database");
    assertTrue(
        injectExpectationRepository
            .findAllByInjectAndTeam(createdInject.getId(), TEAM.getId())
            .isEmpty(),
        "There should be no expectations related to the inject in the database");
  }

  // -- EXERCISES --

  @DisplayName("Add an inject for simulation")
  @Test
  @WithMockPlannerUser
  void addInjectForSimulationTest() throws Exception {
    // -- PREPARE --
    InjectInput input = new InjectInput();
    input.setTitle("Test inject");
    input.setInjectorContract(EMAIL_DEFAULT);
    input.setDependsDuration(0L);

    // -- EXECUTE --
    String response =
        mvc.perform(
                post(EXERCISE_URI + "/" + EXERCISE.getId() + "/injects")
                    .content(asJsonString(input))
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // -- ASSERT --
    assertNotNull(response);
    assertEquals("Test inject", JsonPath.read(response, "$.inject_title"));
  }

  @DisplayName("Update inject for simulation")
  @Test
  @WithMockPlannerUser
  void updateInjectForSimulationTest() throws Exception {
    // -- PREPARE --
    InjectInput injectInput = new InjectInput();
    injectInput.setTitle("Test inject");
    injectInput.setDependsDuration(0L);
    Inject inject =
        injectInput.toInject(injectorContractRepository.findById(EMAIL_DEFAULT).orElseThrow());
    Inject savedInject = injectRepository.save(inject);

    Inject injectToUpdate = injectRepository.findById(savedInject.getId()).orElseThrow();
    InjectInput input = new InjectInput();
    String injectTitle = "A new title";
    input.setTitle(injectTitle);
    input.setDependsDuration(inject.getDependsDuration());

    // -- EXECUTE --
    String response =
        mvc.perform(
                put(INJECT_URI + "/" + EXERCISE.getId() + "/" + injectToUpdate.getId())
                    .content(asJsonString(input))
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // -- ASSERT --
    assertNotNull(response);
    assertEquals(injectTitle, JsonPath.read(response, "$.inject_title"));
  }

  @DisplayName("Execute an email inject for exercise")
  @Test
  @WithMockPlannerUser
  void executeEmailInjectForExerciseTest() throws Exception {
    // -- PREPARE --
    InjectorContract injectorContract =
        this.injectorContractRepository.findById(EMAIL_DEFAULT).orElseThrow();
    Inject inject = getInjectForEmailContract(injectorContract);
    User user = userRepository.findById(currentUser().getId()).orElseThrow();
    DirectInjectInput input = new DirectInjectInput();
    input.setTitle(inject.getTitle());
    input.setDescription(inject.getDescription());
    input.setInjectorContract(inject.getInjectorContract().orElseThrow().getId());
    input.setUserIds(List.of(user.getId()));
    ObjectNode content = objectMapper.createObjectNode();
    content.set("subject", objectMapper.convertValue("Subject", JsonNode.class));
    content.set("body", objectMapper.convertValue("Test body", JsonNode.class));
    content.set("expectationType", objectMapper.convertValue("none", JsonNode.class));
    input.setContent(content);

    MockMultipartFile inputJson =
        new MockMultipartFile(
            "input", null, "application/json", objectMapper.writeValueAsString(input).getBytes());

    // Getting a test file
    File testFile = ResourceUtils.getFile("classpath:xls-test-files/test_file_1.xlsx");
    InputStream in = new FileInputStream(testFile);
    MockMultipartFile fileJson =
        new MockMultipartFile("file", "my-awesome-file.xls", "application/xlsx", in.readAllBytes());

    // Mock the behavior of JavaMailSender
    ArgumentCaptor<MimeMessage> mimeMessageArgumentCaptor =
        ArgumentCaptor.forClass(MimeMessage.class);
    doNothing().when(javaMailSender).send(ArgumentMatchers.any(SimpleMailMessage.class));
    when(javaMailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));

    // -- EXECUTE --
    String response =
        mvc.perform(
                multipart(EXERCISE_URI + "/" + EXERCISE.getId() + "/inject")
                    .file(inputJson)
                    .file(fileJson))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // -- ASSERT --
    assertNotNull(response);
    assertEquals("SUCCESS", JsonPath.read(response, "$.status_name"));
    ArgumentCaptor<ExecutableInject> executableInjectCaptor =
        ArgumentCaptor.forClass(ExecutableInject.class);
    verify(executor).execute(executableInjectCaptor.capture());

    verify(javaMailSender).send(mimeMessageArgumentCaptor.capture());
    assertEquals("Subject", mimeMessageArgumentCaptor.getValue().getSubject());

    // -- THEN ---
    userRepository.delete(user);
  }

  @DisplayName("Execute an email inject for exercise with no team")
  @Test
  @WithMockPlannerUser
  void executeEmailInjectForExerciseWithNoTeam() throws Exception {
    // -- PREPARE --
    InjectorContract injectorContract =
        this.injectorContractRepository.findById(EMAIL_DEFAULT).orElseThrow();
    Inject inject = getInjectForEmailContract(injectorContract);

    DirectInjectInput input = new DirectInjectInput();
    input.setTitle(inject.getTitle());
    input.setDescription(inject.getDescription());
    input.setInjectorContract(inject.getInjectorContract().orElseThrow().getId());
    ObjectNode content = objectMapper.createObjectNode();
    content.set("subject", objectMapper.convertValue("Subject", JsonNode.class));
    content.set("body", objectMapper.convertValue("Test body", JsonNode.class));
    content.set("expectationType", objectMapper.convertValue("none", JsonNode.class));
    input.setContent(content);

    MockMultipartFile inputJson =
        new MockMultipartFile(
            "input", null, "application/json", objectMapper.writeValueAsString(input).getBytes());

    // -- EXECUTE --
    String response =
        mvc.perform(multipart(EXERCISE_URI + "/" + EXERCISE.getId() + "/inject").file(inputJson))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // -- ASSERT --
    assertNotNull(response);
    assertEquals("ERROR", JsonPath.read(response, "$.status_name"));
    assertEquals(
        "Email needs at least one user",
        JsonPath.read(response, "$.status_traces[0].execution_message"));
  }

  @DisplayName("Execute an email inject for exercise with no content")
  @Test
  @WithMockPlannerUser
  void executeEmailInjectForExerciseWithNoContentTest() throws Exception {
    // -- PREPARE --
    InjectorContract injectorContract =
        this.injectorContractRepository.findById(EMAIL_DEFAULT).orElseThrow();
    Inject inject = getInjectForEmailContract(injectorContract);

    DirectInjectInput input = new DirectInjectInput();
    input.setTitle(inject.getTitle());
    input.setDescription(inject.getDescription());
    input.setInjectorContract(inject.getInjectorContract().orElseThrow().getId());

    MockMultipartFile inputJson =
        new MockMultipartFile(
            "input", null, "application/json", objectMapper.writeValueAsString(input).getBytes());

    // -- EXECUTION --
    String response =
        mvc.perform(multipart(EXERCISE_URI + "/" + EXERCISE.getId() + "/inject").file(inputJson))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // -- ASSERT --
    assertNotNull(response);
    assertTrue(JsonPath.read(response, "$.status_traces").toString().contains("Inject is empty"));
  }

  // -- BULK DELETE --

  @DisplayName("Delete list of inject for exercise")
  @Test
  @Order(8)
  @WithMockPlannerUser
  void deleteInjectsForExerciseTest() throws Exception {
    // -- PREPARE --
    Inject injectForExercise1 = new Inject();
    injectForExercise1.setTitle("Inject for exercise 1");
    injectForExercise1.setCreatedAt(Instant.now());
    injectForExercise1.setUpdatedAt(Instant.now());
    injectForExercise1.setDependsDuration(1L);
    injectForExercise1.setExercise(EXERCISE);

    Inject injectForExercise2 = new Inject();
    injectForExercise2.setTitle("Inject for exercise 2");
    injectForExercise2.setCreatedAt(Instant.now());
    injectForExercise2.setUpdatedAt(Instant.now());
    injectForExercise2.setDependsDuration(2L);
    injectForExercise2.setExercise(EXERCISE);

    Inject createdInject1 = injectRepository.save(injectForExercise1);
    Inject createdInject2 = injectRepository.save(injectForExercise2);

    InjectDocument injectDocument1 = new InjectDocument();
    injectDocument1.setInject(createdInject1);
    injectDocument1.setDocument(DOCUMENT1);

    InjectDocument injectDocument2 = new InjectDocument();
    injectDocument2.setInject(createdInject1);
    injectDocument2.setDocument(DOCUMENT2);

    InjectDocument injectDocument3 = new InjectDocument();
    injectDocument3.setInject(createdInject2);
    injectDocument3.setDocument(DOCUMENT1);

    createdInject1.setDocuments(List.of(injectDocument1, injectDocument2));
    createdInject2.setDocuments(List.of(injectDocument3));

    injectRepository.save(createdInject1);
    injectRepository.save(createdInject2);

    Communication communication = new Communication();
    communication.setInject(createdInject1);
    communication.setIdentifier("messageId");
    communication.setFrom("test@test.com");
    communication.setTo("test@test.com");
    communication.setSentAt(Instant.now());
    communication.setReceivedAt(Instant.now());
    Communication createdCommunication = communicationRepository.save(communication);

    injectExpectationRepository.save(
        InjectExpectationFixture.createPreventionInjectExpectation(TEAM, createdInject1));
    injectExpectationRepository.save(
        InjectExpectationFixture.createDetectionInjectExpectation(TEAM, createdInject1));
    injectExpectationRepository.save(
        InjectExpectationFixture.createManualInjectExpectation(TEAM, createdInject2));

    // -- ASSERT --
    assertTrue(
        injectRepository.existsById(createdInject1.getId()),
        "The inject should exist from the database");
    assertFalse(
        injectRepository.findByExerciseId(EXERCISE.getId()).isEmpty(),
        "There should be injects for the exercise in the database");
    assertEquals(1, communicationRepository.findByInjectId(createdInject1.getId()).size());
    assertEquals(
        2,
        injectExpectationRepository
            .findAllByInjectAndTeam(createdInject1.getId(), TEAM.getId())
            .size());
    assertEquals(
        1,
        injectExpectationRepository
            .findAllByInjectAndTeam(createdInject2.getId(), TEAM.getId())
            .size());

    // -- PREPARE --
    InjectBulkProcessingInput input = new InjectBulkProcessingInput();
    input.setInjectIDsToProcess(List.of(createdInject1.getId(), createdInject2.getId()));
    input.setSimulationOrScenarioId(EXERCISE.getId());

    // -- EXECUTE --
    mvc.perform(
            delete(INJECT_URI).content(asJsonString(input)).contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().is2xxSuccessful());

    // -- ASSERT --
    assertFalse(
        injectRepository.existsById(createdInject1.getId()),
        "The inject should be deleted from the database");
    assertFalse(
        injectRepository.existsById(createdInject2.getId()),
        "The inject should be deleted from the database");
    assertTrue(
        exerciseRepository.existsById(EXERCISE.getId()),
        "The exercise should still exist in the database");
    assertTrue(
        injectRepository.findByExerciseId(EXERCISE.getId()).isEmpty(),
        "There should be no injects for the exercise in the database");
    assertTrue(
        documentRepository.existsById(DOCUMENT1.getId()),
        "The document should still exist in the database");
    assertFalse(
        communicationRepository.existsById(createdCommunication.getId()),
        "The communication should be deleted from the database");
    assertTrue(
        injectExpectationRepository
            .findAllByInjectAndTeam(createdInject1.getId(), TEAM.getId())
            .isEmpty(),
        "There should be no expectations related to the inject in the database");
  }

  @Nested
  @WithMockAdminUser
  @DisplayName("Retrieving executable payloads injects")
  class RetrievingExecutablePayloadInject {

    @DisplayName("Get encoded command payload with arguments")
    @Test
    void getExecutablePayloadInjectWithArguments() throws Exception {
      // -- PREPARE --
      PayloadPrerequisite prerequisite = new PayloadPrerequisite();
      prerequisite.setGetCommand("cd ./src");
      prerequisite.setExecutor("bash");
      Command payloadCommand =
          PayloadFixture.createCommand(
              "bash", "echo command name #{arg_value}", List.of(prerequisite), "echo cleanup cmd");
      Payload payloadSaved = payloadRepository.save(payloadCommand);

      Injector injector = injectorRepository.findByType("openbas_implant").orElseThrow();
      InjectorContract injectorContract =
          InjectorContractFixture.createPayloadInjectorContract(injector, payloadSaved);
      PAYLOAD_INJECTOR_CONTRACT = injectorContractRepository.save(injectorContract);

      String argValue = "Hello world";
      Map<String, String> payloadArguments = new HashMap<>();
      payloadArguments.put("arg_value", argValue);
      Inject inject =
          InjectFixture.createInjectCommandPayload(PAYLOAD_INJECTOR_CONTRACT, payloadArguments);

      Inject injectSaved = injectRepository.save(inject);
      doNothing()
          .when(injectStatusService)
          .addStartImplantExecutionTraceByInject(any(), any(), any());

      // -- EXECUTE --
      String response =
          mvc.perform(
                  get(INJECT_URI + "/" + injectSaved.getId() + "/fakeId/executable-payload")
                      .accept(MediaType.APPLICATION_JSON))
              .andExpect(status().is2xxSuccessful())
              .andReturn()
              .getResponse()
              .getContentAsString();

      // -- ASSERT --
      assertNotNull(response);
      // Verify prerequisite command
      String expectedPrerequisiteCmdEncoded =
          Base64.getEncoder().encodeToString(prerequisite.getGetCommand().getBytes());
      assertEquals(
          expectedPrerequisiteCmdEncoded,
          JsonPath.read(response, "$.payload_prerequisites[0].get_command"));

      // Verify cleanup command
      String expectedCleanupCmdEncoded =
          Base64.getEncoder().encodeToString(payloadCommand.getCleanupCommand().getBytes());
      assertEquals(expectedCleanupCmdEncoded, JsonPath.read(response, "$.payload_cleanup_command"));

      // Verify command
      String cmdToExecute = payloadCommand.getContent().replace("#{arg_value}", "Hello world");
      String expectedCmdEncoded = Base64.getEncoder().encodeToString(cmdToExecute.getBytes());
      assertEquals(expectedCmdEncoded, JsonPath.read(response, "$.command_content"));
    }

    @DisplayName("Get obfuscate command")
    @Test
    void getExecutableObfuscatePayloadInject() throws Exception {
      // -- PREPARE --
      Command payloadCommand =
          PayloadFixture.createCommand("psh", "echo Hello World", List.of(), "echo cleanup cmd");
      Payload payloadSaved = payloadRepository.save(payloadCommand);

      Injector injector = injectorRepository.findByType("openbas_implant").orElseThrow();
      InjectorContract injectorContract =
          InjectorContractFixture.createPayloadInjectorContractWithObfuscator(
              injector, payloadSaved);
      PAYLOAD_INJECTOR_CONTRACT_2 = injectorContractRepository.save(injectorContract);

      Map<String, String> payloadArguments = new HashMap<>();
      payloadArguments.put("obfuscator", "base64");
      Inject inject =
          InjectFixture.createInjectCommandPayload(PAYLOAD_INJECTOR_CONTRACT_2, payloadArguments);

      Inject injectSaved = injectRepository.save(inject);
      doNothing()
          .when(injectStatusService)
          .addStartImplantExecutionTraceByInject(any(), any(), any());

      // -- EXECUTE --
      String response =
          mvc.perform(
                  get(INJECT_URI + "/" + injectSaved.getId() + "/fakeagentID/executable-payload")
                      .accept(MediaType.APPLICATION_JSON))
              .andExpect(status().is2xxSuccessful())
              .andReturn()
              .getResponse()
              .getContentAsString();

      // -- ASSERT --
      assertNotNull(response);

      // Verify command
      byte[] utf16Bytes = payloadCommand.getContent().getBytes(StandardCharsets.UTF_16LE);
      String base64 = Base64.getEncoder().encodeToString(utf16Bytes);
      String cmdToExecute = String.format("powershell -Enc %s", base64);

      String expectedCmdEncoded = Base64.getEncoder().encodeToString(cmdToExecute.getBytes());
      assertEquals(expectedCmdEncoded, JsonPath.read(response, "$.command_content"));
    }
  }

  @Nested
  @Transactional
  @WithMockAdminUser
  @DisplayName("Inject Execution Callback Handling (simulating a request from an implant)")
  class handleInjectExecutionCallback {

    private Inject getPendingInjectWithAssets() {
      return injectComposer
          .forInject(InjectFixture.getDefaultInject())
          .withEndpoint(
              endpointComposer
                  .forEndpoint(EndpointFixture.createEndpoint())
                  .withAgent(agentComposer.forAgent(AgentFixture.createDefaultAgent())))
          .withEndpoint(
              endpointComposer
                  .forEndpoint(EndpointFixture.createEndpoint())
                  .withAgent(agentComposer.forAgent(AgentFixture.createDefaultAgent())))
          .withInjectStatus(
              injectStatusComposer.forInjectStatus(InjectStatusFixture.createDefaultInjectStatus()))
          .persist()
          .get();
    }

    private void performCallbackRequest(String agentId, String injectId, InjectExecutionInput input)
        throws Exception {
      mvc.perform(
              post(INJECT_URI + "/execution/" + agentId + "/callback/" + injectId)
                  .content(asJsonString(input))
                  .contentType(MediaType.APPLICATION_JSON)
                  .accept(MediaType.APPLICATION_JSON))
          .andExpect(status().is2xxSuccessful())
          .andReturn()
          .getResponse()
          .getContentAsString();
    }

    @Nested
    @DisplayName("Action Handling:")
    class ActionHandlingTest {
      @DisplayName("Should add trace when process is not finished")
      @Test
      void shouldAddTraceWhenProcessNotFinished() throws Exception {
        // -- PREPARE --
        InjectExecutionInput input = new InjectExecutionInput();
        String logMessage = "First log received";
        input.setMessage(logMessage);
        input.setAction(InjectExecutionAction.command_execution);
        input.setStatus("SUCCESS");
        Inject inject = getPendingInjectWithAssets();

        // -- EXECUTE --
        String agentId = ((Endpoint) inject.getAssets().getFirst()).getAgents().getFirst().getId();
        performCallbackRequest(agentId, inject.getId(), input);

        // -- ASSERT --
        Inject injectSaved = injectRepository.findById(inject.getId()).orElseThrow();
        InjectStatus injectStatusSaved = injectSaved.getStatus().orElseThrow();
        assertEquals(ExecutionStatus.PENDING, injectStatusSaved.getName());
        assertEquals(1, injectStatusSaved.getTraces().size());
        assertEquals(
            ExecutionTraceStatus.SUCCESS, injectStatusSaved.getTraces().getFirst().getStatus());
        assertEquals(
            ExecutionTraceAction.EXECUTION, injectStatusSaved.getTraces().getFirst().getAction());
        assertEquals(logMessage, injectStatusSaved.getTraces().getFirst().getMessage());
      }

      @DisplayName(
          "Should add trace and compute agent status when one of two agents finishes execution")
      @Test
      void shouldAddTraceAndComputeAgentStatusWhenOneAgentFinishes() throws Exception {
        // -- PREPARE --
        InjectExecutionInput input = new InjectExecutionInput();
        input.setMessage("First log received");
        input.setAction(InjectExecutionAction.command_execution);
        input.setStatus("COMMAND_NOT_FOUND");
        Inject inject = getPendingInjectWithAssets();

        // -- EXECUTE --
        String agentId = ((Endpoint) inject.getAssets().getFirst()).getAgents().getFirst().getId();
        performCallbackRequest(agentId, inject.getId(), input);

        InjectExecutionInput input2 = new InjectExecutionInput();
        String lastLogMessage = "Complete log received";
        input2.setMessage(lastLogMessage);
        input2.setAction(InjectExecutionAction.complete);
        input2.setStatus("INFO");
        performCallbackRequest(agentId, inject.getId(), input2);

        // -- ASSERT --
        Inject injectSaved = injectRepository.findById(inject.getId()).orElseThrow();
        InjectStatus injectStatusSaved = injectSaved.getStatus().orElseThrow();
        // Check inject status
        assertEquals(ExecutionStatus.PENDING, injectStatusSaved.getName());
        assertEquals(2, injectStatusSaved.getTraces().size());
        // The status of the complete trace should be ERROR
        List<ExecutionTraces> completeTraces =
            injectStatusSaved.getTraces().stream()
                .filter(t -> ExecutionTraceAction.COMPLETE.equals(t.getAction()))
                .toList();
        assertEquals(1, completeTraces.size());
        assertEquals(
            ExecutionTraceStatus.ERROR, completeTraces.stream().findFirst().get().getStatus());
      }

      @DisplayName(
          "Should add trace, compute agent status, and update inject status when all agents finish execution")
      @Test
      void shouldAddTraceComputeAgentStatusAndUpdateInjectStatusWhenAllAgentsFinish()
          throws Exception {
        // -- PREPARE --
        InjectExecutionInput input = new InjectExecutionInput();
        input.setMessage("First log received");
        input.setAction(InjectExecutionAction.command_execution);
        input.setStatus("COMMAND_NOT_FOUND");
        Inject inject = getPendingInjectWithAssets();

        // -- EXECUTE --
        String firstAgentId =
            ((Endpoint) inject.getAssets().getFirst()).getAgents().getFirst().getId();
        String secondAgentId =
            ((Endpoint) inject.getAssets().getFirst()).getAgents().getLast().getId();
        performCallbackRequest(firstAgentId, inject.getId(), input);
        input.setStatus("SUCCESS");
        performCallbackRequest(secondAgentId, inject.getId(), input);

        InjectExecutionInput input2 = new InjectExecutionInput();
        String lastLogMessage = "Complete log received";
        input2.setMessage(lastLogMessage);
        input2.setAction(InjectExecutionAction.complete);
        input2.setStatus("INFO");
        performCallbackRequest(firstAgentId, inject.getId(), input2);
        performCallbackRequest(secondAgentId, inject.getId(), input2);

        // -- ASSERT --
        Inject injectSaved = injectRepository.findById(inject.getId()).orElseThrow();
        InjectStatus injectStatusSaved = injectSaved.getStatus().orElseThrow();
        // Check inject status
        assertEquals(ExecutionStatus.PARTIAL, injectStatusSaved.getName());
      }
    }

    @Nested
    @DisplayName("Agent Status Computation")
    class AgentStatusComputationTest {

      private void testAgentStatusFunction(
          String inputTraceStatus1,
          String inputTraceStatus2,
          ExecutionTraceStatus expectedAgentStatus)
          throws Exception {
        // -- PREPARE --
        InjectExecutionInput input = new InjectExecutionInput();
        input.setMessage("First log received");
        input.setAction(InjectExecutionAction.command_execution);
        input.setStatus(inputTraceStatus1);
        Inject inject = getPendingInjectWithAssets();

        // -- EXECUTE --
        String firstAgentId =
            ((Endpoint) inject.getAssets().getFirst()).getAgents().getFirst().getId();
        performCallbackRequest(firstAgentId, inject.getId(), input);
        input.setStatus(inputTraceStatus2);
        performCallbackRequest(firstAgentId, inject.getId(), input);
        // send complete trace
        input.setAction(InjectExecutionAction.complete);
        input.setStatus("INFO");
        performCallbackRequest(firstAgentId, inject.getId(), input);

        // -- ASSERT --
        Inject injectSaved = injectRepository.findById(inject.getId()).orElseThrow();
        InjectStatus injectStatusSaved = injectSaved.getStatus().orElseThrow();
        List<ExecutionTraces> completeTraces =
            injectStatusSaved.getTraces().stream()
                .filter(t -> ExecutionTraceAction.COMPLETE.equals(t.getAction()))
                .toList();
        assertEquals(1, completeTraces.size());
        assertEquals(expectedAgentStatus, completeTraces.stream().findFirst().get().getStatus());
      }

      @Test
      @DisplayName("Should compute agent status as ERROR")
      void shouldComputeAgentStatusAsError() throws Exception {
        testAgentStatusFunction("COMMAND_NOT_FOUND", "ERROR", ExecutionTraceStatus.ERROR);
      }

      @Test
      @DisplayName("Should compute agent status as SUCCESS")
      void shouldComputeAgentStatusAsSuccess() throws Exception {
        testAgentStatusFunction("SUCCESS", "WARNING", ExecutionTraceStatus.SUCCESS);
      }

      @Test
      @DisplayName("Should compute agent status as PARTIAL")
      void shouldComputeAgentStatusAsPartial() throws Exception {
        testAgentStatusFunction("SUCCESS", "COMMAND_NOT_FOUND", ExecutionTraceStatus.PARTIAL);
      }

      @Test
      @DisplayName("Should compute agent status as MAYBE_PREVENTED")
      void shouldComputeAgentStatusAsMayBePrevented() throws Exception {
        testAgentStatusFunction(
            "COMMAND_CANNOT_BE_EXECUTED", "MAYBE_PREVENTED", ExecutionTraceStatus.MAYBE_PREVENTED);
      }
    }
  }
}
