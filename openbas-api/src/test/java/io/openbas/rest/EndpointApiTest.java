package io.openbas.rest;

import static io.openbas.rest.asset.endpoint.EndpointApi.ENDPOINT_URI;
import static io.openbas.utils.JsonUtils.asJsonString;
import static io.openbas.utils.fixtures.AgentFixture.createAgent;
import static io.openbas.utils.fixtures.EndpointFixture.*;
import static io.openbas.utils.fixtures.TagFixture.getTag;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.TestInstance.Lifecycle.PER_CLASS;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import io.openbas.IntegrationTest;
import io.openbas.database.model.Agent;
import io.openbas.database.model.Endpoint;
import io.openbas.database.model.Tag;
import io.openbas.database.repository.EndpointRepository;
import io.openbas.database.repository.TagRepository;
import io.openbas.rest.asset.endpoint.form.EndpointInput;
import io.openbas.rest.asset.endpoint.form.EndpointRegisterInput;
import io.openbas.rest.asset.endpoint.form.EndpointUpdateInput;
import io.openbas.service.EndpointService;
import io.openbas.utils.mockUser.WithMockAdminUser;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@TestInstance(PER_CLASS)
@Transactional
class EndpointApiTest extends IntegrationTest {

  @Autowired private MockMvc mvc;
  @Autowired private TagRepository tagRepository;
  @Autowired private EndpointRepository endpointRepository;
  @SpyBean private EndpointService endpointService;

  @DisplayName("Given valid endpoint input, should upsert an endpoint successfully")
  @Test
  @WithMockAdminUser
  void given_validEndpointInput_should_upsertEndpointSuccessfully() throws Exception {
    // --PREPARE--
    Tag tag = tagRepository.save(getTag());
    String externalReference = "external01";
    EndpointRegisterInput registerInput =
        createWindowsEndpointRegisterInput(List.of(tag.getId()), externalReference);
    Endpoint endpoint = new Endpoint();
    endpoint.setUpdateAttributes(registerInput);
    Agent agent = createAgent(endpoint, externalReference);
    endpoint.setAgents(
        new ArrayList<>() {
          {
            add(agent);
          }
        });
    endpointRepository.save(endpoint);

    String newName = "New hostname";
    registerInput.setHostname(newName);

    Mockito.doReturn("command")
        .when(endpointService)
        .generateUpgradeCommand(String.valueOf(Endpoint.PLATFORM_TYPE.Windows));

    // --EXECUTE--
    String response =
        mvc.perform(
                post(ENDPOINT_URI + "/register")
                    .content(asJsonString(registerInput))
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // --ASSERT--
    assertEquals(newName.toLowerCase(), JsonPath.read(response, "$.endpoint_hostname"));
  }

  @DisplayName(
      "Given valid input for a non-existing endpoint, should create and upsert successfully")
  @Test
  @WithMockAdminUser
  void given_validInputForNonExistingEndpoint_should_createAndUpsertSuccessfully()
      throws Exception {
    // --PREPARE--
    Tag tag = tagRepository.save(getTag());
    String externalReference = "external01";
    EndpointRegisterInput registerInput =
        createWindowsEndpointRegisterInput(List.of(tag.getId()), externalReference);
    Endpoint endpoint = new Endpoint();
    endpoint.setUpdateAttributes(registerInput);
    Agent agent = createAgent(endpoint, externalReference);
    endpoint.setAgents(List.of(agent));

    Mockito.doReturn("command")
        .when(endpointService)
        .generateUpgradeCommand(String.valueOf(Endpoint.PLATFORM_TYPE.Windows));

    // --EXECUTE--
    String response =
        mvc.perform(
                post(ENDPOINT_URI + "/register")
                    .content(asJsonString(registerInput))
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // --ASSERT--
    assertEquals(WINDOWS_ASSET_NAME_INPUT, JsonPath.read(response, "$.asset_name"));
  }

  @DisplayName("Given valid input, should update an endpoint successfully")
  @Test
  @WithMockAdminUser
  void given_validInput_should_updateEndpointSuccessfully() throws Exception {
    // --PREPARE--
    Tag tag = tagRepository.save(getTag());
    String externalReference = "external01";
    EndpointInput endpointInput = createWindowsEndpointInput(List.of(tag.getId()));
    Endpoint endpoint = new Endpoint();
    endpoint.setUpdateAttributes(endpointInput);
    Agent agent = createAgent(endpoint, externalReference);
    endpoint.setAgents(
        new ArrayList<>() {
          {
            add(agent);
          }
        });
    Endpoint endpointCreated = endpointRepository.save(endpoint);

    EndpointUpdateInput updateInput = new EndpointUpdateInput();
    String newName = "New hostname";
    updateInput.setName(newName);

    // --EXECUTE--
    String response =
        mvc.perform(
                put(ENDPOINT_URI + "/" + endpointCreated.getId())
                    .content(asJsonString(updateInput))
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // --ASSERT--
    assertEquals(newName.toLowerCase(), JsonPath.read(response, "$.asset_name"));
  }

  @DisplayName("Given valid input, should delete an endpoint successfully")
  @Test
  @WithMockAdminUser
  void given_validInput_should_deleteEndpointSuccessfully() throws Exception {
    // --PREPARE--
    Tag tag = tagRepository.save(getTag());
    String externalReference = "external01";
    EndpointInput endpointInput = createWindowsEndpointInput(List.of(tag.getId()));
    Endpoint endpoint = new Endpoint();
    endpoint.setUpdateAttributes(endpointInput);
    Agent agent = createAgent(endpoint, externalReference);
    endpoint.setAgents(
        new ArrayList<>() {
          {
            add(agent);
          }
        });
    Endpoint endpointCreated = endpointRepository.save(endpoint);

    // -- EXECUTE --
    mvc.perform(
            delete(ENDPOINT_URI + "/" + endpointCreated.getId()).accept(MediaType.APPLICATION_JSON))
        .andExpect(status().is2xxSuccessful());

    // -- ASSERT --
    mvc.perform(
            get(ENDPOINT_URI + "/" + endpointCreated.getId()).accept(MediaType.APPLICATION_JSON))
        .andExpect(status().is4xxClientError());
  }
}
