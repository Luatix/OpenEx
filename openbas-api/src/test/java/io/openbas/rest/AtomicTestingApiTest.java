package io.openbas.rest;

import static io.openbas.injectors.email.EmailContract.EMAIL_DEFAULT;
import static io.openbas.utils.JsonUtils.asJsonString;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.TestInstance.Lifecycle.PER_CLASS;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import io.openbas.IntegrationTest;
import io.openbas.database.model.*;
import io.openbas.database.repository.InjectRepository;
import io.openbas.database.repository.InjectStatusRepository;
import io.openbas.database.repository.InjectorContractRepository;
import io.openbas.rest.atomic_testing.form.AtomicTestingInput;
import io.openbas.utils.fixtures.AtomicTestingInputFixture;
import io.openbas.utils.fixtures.InjectFixture;
import io.openbas.utils.fixtures.InjectStatusFixture;
import io.openbas.utils.mockUser.WithMockAdminUser;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@TestInstance(PER_CLASS)
public class AtomicTestingApiTest extends IntegrationTest {

  public static final String ATOMIC_TESTINGS_URI = "/api/atomic-testings";

  static Inject INJECT_WITH_STATUS_AND_COMMAND_LINES;
  static Inject INJECT_WITHOUT_STATUS;
  static InjectStatus INJECT_STATUS;
  static InjectorContract INJECTOR_CONTRACT;

  @Autowired private MockMvc mvc;
  @Autowired private InjectRepository injectRepository;
  @Autowired private InjectorContractRepository injectorContractRepository;
  @Autowired private InjectStatusRepository injectStatusRepository;

  @BeforeAll
  void beforeAll() {
    INJECTOR_CONTRACT = injectorContractRepository.findById(EMAIL_DEFAULT).orElseThrow();
    Inject injectWithoutPayload = InjectFixture.createDefaultInjectEmail(INJECTOR_CONTRACT);
    INJECT_WITHOUT_STATUS = injectRepository.save(injectWithoutPayload);

    Inject injectWithPayload = InjectFixture.createDefaultInjectEmail(INJECTOR_CONTRACT);
    INJECT_WITH_STATUS_AND_COMMAND_LINES = injectRepository.save(injectWithPayload);
    InjectStatus injectStatus = InjectStatusFixture.createDefaultInjectStatus();
    injectStatus.setInject(injectWithPayload);
    INJECT_STATUS = injectStatusRepository.save(injectStatus);
  }

  @Test
  @DisplayName("Find an atomic testing without status")
  @WithMockAdminUser
  void findAnAtomicTestingWithoutStatus() throws Exception {
    String response =
        mvc.perform(
                get(ATOMIC_TESTINGS_URI + "/" + INJECT_WITHOUT_STATUS.getId())
                    .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();
    // -- ASSERT --
    assertNotNull(response);
    assertEquals(INJECT_WITHOUT_STATUS.getId(), JsonPath.read(response, "$.inject_id"));
  }

  @Test
  @DisplayName("Find an atomic testing with status and command lines")
  @WithMockAdminUser
  void findAnAtomicTestingWithStatusAndCommandLines() throws Exception {
    String response =
        mvc.perform(
                get(ATOMIC_TESTINGS_URI + "/" + INJECT_WITH_STATUS_AND_COMMAND_LINES.getId())
                    .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();
    // -- ASSERT --
    assertNotNull(response);
    assertEquals(
        INJECT_WITH_STATUS_AND_COMMAND_LINES.getId(), JsonPath.read(response, "$.inject_id"));
  }

  @Test
  @DisplayName("Duplicate and delete an atomic testing")
  @WithMockAdminUser
  void duplicateAndDeleteAtomicTesting() throws Exception {
    // Duplicate
    String response =
        mvc.perform(
                post(ATOMIC_TESTINGS_URI + "/" + INJECT_WITHOUT_STATUS.getId() + "/duplicate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();
    assertNotNull(response);
    // Assert duplicate
    String newInjectId = JsonPath.read(response, "$.inject_id");
    response =
        mvc.perform(get(ATOMIC_TESTINGS_URI + "/" + newInjectId).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();
    assertEquals(newInjectId, JsonPath.read(response, "$.inject_id"));
    // Delete
    mvc.perform(delete(ATOMIC_TESTINGS_URI + "/" + newInjectId).accept(MediaType.APPLICATION_JSON))
        .andExpect(status().is2xxSuccessful());
    // Assert delete
    mvc.perform(get(ATOMIC_TESTINGS_URI + "/" + newInjectId).accept(MediaType.APPLICATION_JSON))
        .andExpect(status().is4xxClientError());
  }

  @Test
  @DisplayName("Launch an Atomic Testing")
  @WithMockAdminUser
  void launchAtomicTesting() throws Exception {
    AtomicTestingInput atomicTestingInput =
        AtomicTestingInputFixture.createDefaultAtomicTestingInput();
    atomicTestingInput.setInjectorContract(INJECTOR_CONTRACT.getId());

    String createdInject =
        mvc.perform(
                post(ATOMIC_TESTINGS_URI)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(atomicTestingInput)))
            .andExpect(status().is2xxSuccessful())
            .andExpect(jsonPath("$.inject_status.status_name").value("DRAFT"))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String injectId = JsonPath.read(createdInject, "$.inject_id");

    mvc.perform(post(ATOMIC_TESTINGS_URI + "/" + injectId + "/launch"))
        .andExpect(status().is2xxSuccessful())
        .andExpect(jsonPath("$.inject_status.status_name").value("QUEUING"));
  }

  @Test
  @DisplayName("Relaunch an Atomic Testing")
  @WithMockAdminUser
  void relaunchAtomicTesting() throws Exception {
    AtomicTestingInput atomicTestingInput =
        AtomicTestingInputFixture.createDefaultAtomicTestingInput();
    atomicTestingInput.setInjectorContract(INJECTOR_CONTRACT.getId());

    String createdInject =
        mvc.perform(
                post(ATOMIC_TESTINGS_URI)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(atomicTestingInput)))
            .andExpect(status().is2xxSuccessful())
            .andExpect(jsonPath("$.inject_status.status_name").value("DRAFT"))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String injectId = JsonPath.read(createdInject, "$.inject_id");

    mvc.perform(post(ATOMIC_TESTINGS_URI + "/" + injectId + "/launch"))
        .andExpect(status().is2xxSuccessful())
        .andExpect(jsonPath("$.inject_status.status_name").value("QUEUING"));

    String relaunchedInject =
        mvc.perform(post(ATOMIC_TESTINGS_URI + "/" + injectId + "/relaunch"))
            .andExpect(status().is2xxSuccessful())
            .andExpect(jsonPath("$.inject_status.status_name").value("QUEUING"))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String relaunchedInjectId = JsonPath.read(relaunchedInject, "$.inject_id");

    mvc.perform(get(ATOMIC_TESTINGS_URI + "/" + injectId)).andExpect(status().is4xxClientError());

    mvc.perform(get(ATOMIC_TESTINGS_URI + "/" + relaunchedInjectId))
        .andExpect(status().is2xxSuccessful());
  }

  @AfterAll
  void afterAll() {
    injectStatusRepository.deleteAll();
    injectRepository.deleteAll();
  }
}
