package io.openbas.rest.inject;

import static io.openbas.helper.StreamHelper.fromIterable;
import static io.openbas.rest.inject.InjectApi.INJECT_URI;
import static net.javacrumbs.jsonunit.assertj.JsonAssertions.assertThatJson;
import static org.junit.jupiter.api.TestInstance.Lifecycle.PER_CLASS;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.openbas.IntegrationTest;
import io.openbas.database.model.*;
import io.openbas.database.model.Tag;
import io.openbas.database.repository.ExerciseRepository;
import io.openbas.database.repository.InjectRepository;
import io.openbas.database.repository.InjectorContractRepository;
import io.openbas.rest.exercise.exports.ExportOptions;
import io.openbas.rest.inject.form.InjectImportInput;
import io.openbas.rest.inject.form.InjectImportTargetDefinition;
import io.openbas.rest.inject.form.InjectImportTargetType;
import io.openbas.rest.inject.service.InjectExportService;
import io.openbas.service.ChallengeService;
import io.openbas.utils.fixtures.*;
import io.openbas.utils.fixtures.composers.*;
import io.openbas.utils.helpers.ExerciseHelper;
import io.openbas.utils.mockUser.WithMockPlannerUser;
import io.openbas.utils.mockUser.WithMockUnprivilegedUser;
import jakarta.persistence.EntityManager;
import java.io.IOException;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@TestInstance(PER_CLASS)
@DisplayName("Importing injects tests")
public class InjectImportTest extends IntegrationTest {

  @Autowired ObjectMapper objectMapper;
  @Autowired MockMvc mvc;
  @Autowired InjectExportService exportService;
  @Autowired private InjectComposer injectComposer;
  @Autowired private InjectorContractComposer injectorContractComposer;
  @Autowired private ExerciseComposer exerciseComposer;
  @Autowired private ScenarioComposer scenarioComposer;
  @Autowired private ArticleComposer articleComposer;
  @Autowired private ChannelComposer channelComposer;
  @Autowired private ChallengeComposer challengeComposer;
  @Autowired private DocumentComposer documentComposer;
  @Autowired private ExerciseRepository exerciseRepository;
  @Autowired private TeamComposer teamComposer;
  @Autowired private UserComposer userComposer;
  @Autowired private OrganizationComposer organizationComposer;
  @Autowired private TagComposer tagComposer;
  @Autowired private PayloadComposer payloadComposer;
  @Autowired private InjectorFixture injectorFixture;
  @Autowired private ChallengeService challengeService;
  @Autowired private EntityManager entityManager;

  @Autowired private InjectRepository injectRepository;
  @Autowired private InjectorContractRepository injectorContractRepository;

  public final String INJECT_IMPORT_URI = INJECT_URI + "/import";

  private List<InjectComposer.Composer> getInjectFromExerciseWrappers() {
    // Inject in exercise with an article attached
    ArticleComposer.Composer articleWrapper =
        articleComposer
            .forArticle(ArticleFixture.getDefaultArticle())
            .withChannel(channelComposer.forChannel(ChannelFixture.getDefaultChannel()))
            .withDocument(
                documentComposer
                    .forDocument(DocumentFixture.getDocument(FileFixture.getPngFileContent()))
                    .withInMemoryFile(FileFixture.getPngFileContent()));
    InjectComposer.Composer injectWithArticleInExercise =
        injectComposer
            .forInject(InjectFixture.getDefaultInject())
            .withDocument(
                documentComposer
                    .forDocument(DocumentFixture.getDocument(FileFixture.getPngFileContent()))
                    .withInMemoryFile(FileFixture.getPngFileContent()))
            .withInjectorContract(
                injectorContractComposer
                    .forInjectorContract(InjectorContractFixture.createDefaultInjectorContract())
                    .withArticle(articleWrapper))
            .withTag(tagComposer.forTag(TagFixture.getTagWithText("inject with article tag")))
            .withTeam(
                teamComposer
                    .forTeam(TeamFixture.getDefaultTeam())
                    .withUser(
                        userComposer
                            .forUser(UserFixture.getUserWithDefaultEmail())
                            .withOrganization(
                                organizationComposer.forOrganization(
                                    OrganizationFixture.createDefaultOrganisation()))));
    // Inject with challenge in exercise
    InjectComposer.Composer injectWithChallengeInExercise =
        injectComposer
            .forInject(InjectFixture.getDefaultInject())
            .withInjectorContract(
                injectorContractComposer
                    .forInjectorContract(InjectorContractFixture.createDefaultInjectorContract())
                    .withChallenge(
                        challengeComposer.forChallenge(ChallengeFixture.createDefaultChallenge())))
            .withTag(tagComposer.forTag(TagFixture.getTagWithText("inject with challenge tag")))
            .withTeam(
                teamComposer
                    .forTeam(TeamFixture.getDefaultTeam())
                    .withUser(userComposer.forUser(UserFixture.getUserWithDefaultEmail())));
    // Inject with payload !
    InjectComposer.Composer injectWithPayload =
        injectComposer
            .forInject(InjectFixture.getDefaultInject())
            .withInjectorContract(
                injectorContractComposer
                    .forInjectorContract(InjectorContractFixture.createDefaultInjectorContract())
                    .withInjector(injectorFixture.getWellKnownObasImplantInjector())
                    .withPayload(payloadComposer.forPayload(PayloadFixture.createDefaultCommand())))
            .withTag(tagComposer.forTag(TagFixture.getTagWithText("inject with payload tag")));
    // wrap it into an exercise
    exerciseComposer
        .forExercise(ExerciseFixture.createDefaultExercise())
        .withArticle(articleWrapper)
        .withInject(injectWithArticleInExercise)
        .withInject(injectWithChallengeInExercise)
        .withInject(injectWithPayload)
        .persist();

    return List.of(injectWithArticleInExercise, injectWithChallengeInExercise);
  }

  private void clearEntityManager() {
    entityManager.flush();
    entityManager.clear();
  }

  private byte[] getExportData(
      List<InjectComposer.Composer> wrappers,
      boolean withPlayers,
      boolean withTeams,
      boolean withVariableValues)
      throws IOException {
    List<Inject> injects = wrappers.stream().map(InjectComposer.Composer::get).toList();
    byte[] data =
        exportService.exportInjectsToZip(
            injects, ExportOptions.mask(withPlayers, withTeams, withVariableValues));
    clearEntityManager();
    return data;
  }

  private ResultActions doImport(byte[] importZipData, InjectImportInput input) throws Exception {
    return doImportStringInput(importZipData, objectMapper.writeValueAsString(input));
  }

  private ResultActions doImportStringInput(byte[] importZipData, String input) throws Exception {
    ResultActions ra =
        mvc.perform(
            multipart(INJECT_IMPORT_URI)
                .file(new MockMultipartFile("file", importZipData))
                .content(input)
                .contentType(MediaType.APPLICATION_JSON));
    clearEntityManager();
    return ra;
  }

  private InjectImportInput createTargetInput(InjectImportTargetType targetType, String targetId) {
    InjectImportInput input = new InjectImportInput();
    InjectImportTargetDefinition targetDefinition = new InjectImportTargetDefinition();
    targetDefinition.setType(targetType);
    targetDefinition.setId(targetId);
    input.setTarget(targetDefinition);
    return input;
  }

  private List<Document> crawlDocumentsFromInjects(List<Inject> injects) {
    List<Document> documents = new ArrayList<>();

    documents.addAll(
        injects.stream()
            .flatMap(inject -> inject.getDocuments().stream().map(InjectDocument::getDocument))
            .toList());
    documents.addAll(
        fromIterable(challengeService.getInjectsChallenges(injects)).stream()
            .flatMap(challenge -> challenge.getDocuments().stream())
            .toList());
    documents.addAll(
        injects.stream()
            .flatMap(inject -> inject.getArticles().stream())
            .flatMap(article -> article.getDocuments().stream())
            .toList());
    documents.addAll(
        injects.stream()
            .flatMap(inject -> inject.getArticles().stream())
            .map(Article::getChannel)
            .flatMap(channel -> channel.getLogos().stream())
            .toList());

    return documents;
  }

  @Nested
  @WithMockUnprivilegedUser
  @DisplayName("When passing null input")
  public class WhenPassingNullInput {
    @Test
    @DisplayName("Return BAD REQUEST")
    public void returnBADREQUEST() throws Exception {
      byte[] exportData = getExportData(getInjectFromExerciseWrappers(), false, false, false);

      doImport(exportData, null).andExpect(status().isBadRequest());
    }
  }

  @Nested
  @WithMockUnprivilegedUser
  @DisplayName("When passing null target")
  public class WhenPassingNullTarget {
    @Test
    @DisplayName("Return UNPROCESSABLE CONTENT")
    public void returnUNPROCESSABLECONTENT() throws Exception {
      byte[] exportData = getExportData(getInjectFromExerciseWrappers(), false, false, false);

      doImport(exportData, new InjectImportInput()).andExpect(status().isUnprocessableEntity());
    }
  }

  @Nested
  @WithMockUnprivilegedUser
  @DisplayName("When passing invalid target type")
  public class WhenPassingInvalidTargetType {
    @Test
    @DisplayName("Return BAD REQUEST")
    public void returnBADREQUEST() throws Exception {
      byte[] exportData = getExportData(getInjectFromExerciseWrappers(), false, false, false);

      InjectImportInput input = createTargetInput(InjectImportTargetType.SCENARIO, null);
      ObjectNode inputAsNode = objectMapper.valueToTree(input);
      ((ObjectNode) inputAsNode.get("target"))
          .set("type", objectMapper.valueToTree("something_bad"));

      doImportStringInput(exportData, objectMapper.writeValueAsString(inputAsNode))
          .andExpect(status().isBadRequest());
    }
  }

  @Nested
  @WithMockUnprivilegedUser
  @DisplayName("When lacking PLANNER permissions on destination exercise")
  public class WhenLackingPLANNERPermissionsOnExercise {
    @Test
    @DisplayName("Return NOT FOUND")
    public void returnNOTFOUND() throws Exception {
      byte[] exportData = getExportData(getInjectFromExerciseWrappers(), false, false, false);

      Exercise targetExercise =
          exerciseComposer.forExercise(ExerciseFixture.createDefaultExercise()).persist().get();

      InjectImportInput input =
          createTargetInput(InjectImportTargetType.SIMULATION, targetExercise.getId());

      // the backend hides UNAUTHORIZED with NOT_FOUND
      doImport(exportData, input).andExpect(status().isNotFound());
    }
  }

  @Nested
  @WithMockUnprivilegedUser
  @DisplayName("When destination exercise is not found")
  public class WhenDestinationExerciseNotFound {
    @Test
    @DisplayName("Return NOT FOUND")
    public void returnNotFound() throws Exception {
      byte[] exportData = getExportData(getInjectFromExerciseWrappers(), false, false, false);

      InjectImportInput input =
          createTargetInput(InjectImportTargetType.SIMULATION, UUID.randomUUID().toString());

      doImport(exportData, input).andExpect(status().isNotFound());
    }
  }

  @Nested
  @WithMockUnprivilegedUser
  @DisplayName("When lacking PLANNER permissions on scenario")
  public class WhenLackingPLANNERPermissionsOnScenario {
    @Test
    @DisplayName("Return NOT FOUND")
    public void returnNOTFOUND() throws Exception {
      byte[] exportData = getExportData(getInjectFromExerciseWrappers(), false, false, false);

      Scenario targetScenario =
          scenarioComposer
              .forScenario(ScenarioFixture.createDefaultIncidentResponseScenario())
              .persist()
              .get();

      InjectImportInput input =
          createTargetInput(InjectImportTargetType.SCENARIO, targetScenario.getId());

      // the backend hides UNAUTHORIZED with NOT_FOUND
      doImport(exportData, input).andExpect(status().isNotFound());
    }
  }

  @Nested
  @WithMockUnprivilegedUser
  @DisplayName("When destination scenario is not found")
  public class WhenDestinationScenarioNotFound {
    @Test
    @DisplayName("Return NOT FOUND")
    public void returnNotFound() throws Exception {
      byte[] exportData = getExportData(getInjectFromExerciseWrappers(), false, false, false);

      InjectImportInput input =
          createTargetInput(InjectImportTargetType.SCENARIO, UUID.randomUUID().toString());

      doImport(exportData, input).andExpect(status().isNotFound());
    }
  }

  @Nested
  @WithMockUnprivilegedUser
  @DisplayName("When lacking ADMIN permissions for atomic testings")
  public class WhenLackingADMINPermissionsForAtomicTests {
    @Test
    @DisplayName("Return NOT FOUND")
    public void returnNOTFOUND() throws Exception {
      byte[] exportData = getExportData(getInjectFromExerciseWrappers(), false, false, false);

      InjectImportInput input =
          createTargetInput(InjectImportTargetType.ATOMIC_TESTING, UUID.randomUUID().toString());

      doImport(exportData, input).andExpect(status().isNotFound());
    }
  }

  @Nested
  @WithMockPlannerUser
  @DisplayName("When imported objects don't already exist on the destination")
  public class WhenImportedObjectsDontAlreadyExistOnDestination {

    private byte[] getExportDataThenDelete(List<InjectComposer.Composer> wrappers)
        throws IOException {
      return getExportDataThenDelete(wrappers, false, false, false);
    }

    private byte[] getExportDataThenDelete(
        List<InjectComposer.Composer> wrappers,
        boolean withPlayers,
        boolean withTeams,
        boolean withVariableValues)
        throws IOException {
      byte[] data = getExportData(wrappers, withPlayers, withTeams, withVariableValues);
      wrappers.forEach(InjectComposer.Composer::delete);
      return data;
    }

    @Nested
    @DisplayName("When targeting an exercise")
    public class WhenTargetingAnExercise {

      private ExerciseComposer.Composer getPersistedExerciseWrapper() {
        return exerciseComposer.forExercise(ExerciseFixture.createDefaultExercise()).persist();
      }

      @Test
      @DisplayName("All injects were appended to exercise")
      public void allInjectsWereAppendedToExercise() throws Exception {
        byte[] exportData = getExportDataThenDelete(getInjectFromExerciseWrappers());
        ExerciseComposer.Composer destinationExerciseWrapper = getPersistedExerciseWrapper();
        InjectImportInput input =
            createTargetInput(
                InjectImportTargetType.SIMULATION, destinationExerciseWrapper.get().getId());

        doImport(exportData, input).andExpect(status().is2xxSuccessful());
        clearEntityManager();

        for (Inject expected : injectComposer.generatedItems) {
          Exercise dest =
              exerciseRepository.findById(destinationExerciseWrapper.get().getId()).orElseThrow();
          Optional<Inject> recreated =
              dest.getInjects().stream()
                  .filter(i -> i.getTitle().equals(expected.getTitle()))
                  .findAny();

          Assertions.assertTrue(recreated.isPresent(), "Could not find expected inject");
          Assertions.assertEquals(expected.getCity(), recreated.get().getCity());
          Assertions.assertEquals(expected.getCountry(), recreated.get().getCountry());
          Assertions.assertEquals(
              expected.getDependsDuration(), recreated.get().getDependsDuration());
          Assertions.assertEquals(
              expected.getNumberOfTargetUsers(), recreated.get().getNumberOfTargetUsers());
          Assertions.assertEquals(expected.getDescription(), recreated.get().getDescription());

          // the challenge ID is necessarily different from source and imported values, therefore
          // ignore
          // this
          assertThatJson(recreated.get().getContent())
              .whenIgnoringPaths("challenges")
              .isEqualTo(expected.getContent());
          assertThatJson(recreated.get().getContent())
              .node("challenges")
              .isPresent()
              .and()
              .isArray();

          Assertions.assertNotEquals(expected.getId(), recreated.get().getId());
        }
      }

      @Test
      @DisplayName("All articles have been recreated")
      public void allArticlesHaveBeenRecreated() throws Exception {
        byte[] exportData = getExportDataThenDelete(getInjectFromExerciseWrappers());
        ExerciseComposer.Composer destinationExerciseWrapper = getPersistedExerciseWrapper();
        InjectImportInput input =
            createTargetInput(
                InjectImportTargetType.SIMULATION, destinationExerciseWrapper.get().getId());

        doImport(exportData, input).andExpect(status().is2xxSuccessful());
        clearEntityManager();

        for (Article expected : articleComposer.generatedItems) {
          Exercise dest =
              exerciseRepository.findById(destinationExerciseWrapper.get().getId()).orElseThrow();
          Optional<Article> recreated =
              dest.getArticles().stream()
                  .filter(a -> a.getName().equals(expected.getName()))
                  .findFirst();

          Assertions.assertTrue(recreated.isPresent(), "Could not find expected article");
          Assertions.assertEquals(expected.getName(), recreated.get().getName());
          Assertions.assertEquals(expected.getAuthor(), recreated.get().getAuthor());
          Assertions.assertEquals(expected.getComments(), recreated.get().getComments());
          Assertions.assertEquals(expected.getLikes(), recreated.get().getLikes());
          Assertions.assertEquals(expected.getContent(), recreated.get().getContent());
          Assertions.assertEquals(expected.getShares(), recreated.get().getShares());
          Assertions.assertEquals(
              expected.getVirtualPublication(), recreated.get().getVirtualPublication());

          Assertions.assertNotEquals(expected.getId(), recreated.get().getId());
        }
      }

      @Test
      @DisplayName("All channels have been recreated")
      public void allChannelsHaveBeenRecreated() throws Exception {
        byte[] exportData = getExportDataThenDelete(getInjectFromExerciseWrappers());
        ExerciseComposer.Composer destinationExerciseWrapper = getPersistedExerciseWrapper();
        InjectImportInput input =
            createTargetInput(
                InjectImportTargetType.SIMULATION, destinationExerciseWrapper.get().getId());

        doImport(exportData, input).andExpect(status().is2xxSuccessful());
        clearEntityManager();

        for (Channel expected : channelComposer.generatedItems) {
          Exercise dest =
              exerciseRepository.findById(destinationExerciseWrapper.get().getId()).orElseThrow();
          Optional<Channel> recreated =
              dest.getArticles().stream()
                  .map(Article::getChannel)
                  .filter(c -> c.getName().equals(expected.getName()))
                  .findAny();

          Assertions.assertTrue(recreated.isPresent(), "Could not find expected channel");
          Assertions.assertEquals(expected.getName(), recreated.get().getName());
          Assertions.assertEquals(expected.getDescription(), recreated.get().getDescription());
          Assertions.assertEquals(expected.getType(), recreated.get().getType());
          Assertions.assertEquals(expected.getMode(), recreated.get().getMode());
          Assertions.assertEquals(
              expected.getPrimaryColorDark(), recreated.get().getPrimaryColorDark());
          Assertions.assertEquals(
              expected.getSecondaryColorDark(), recreated.get().getSecondaryColorDark());
          Assertions.assertEquals(
              expected.getPrimaryColorLight(), recreated.get().getPrimaryColorLight());
          Assertions.assertEquals(
              expected.getSecondaryColorLight(), recreated.get().getSecondaryColorLight());

          Assertions.assertNotEquals(expected.getId(), recreated.get().getId());
        }
      }

      @Test
      @DisplayName("All challenges have been recreated")
      public void allChallengesHaveBeenRecreated() throws Exception {
        byte[] exportData = getExportDataThenDelete(getInjectFromExerciseWrappers());
        ExerciseComposer.Composer destinationExerciseWrapper = getPersistedExerciseWrapper();
        InjectImportInput input =
            createTargetInput(
                InjectImportTargetType.SIMULATION, destinationExerciseWrapper.get().getId());

        doImport(exportData, input).andExpect(status().is2xxSuccessful());
        clearEntityManager();

        for (Challenge expected : challengeComposer.generatedItems) {
          Exercise dest =
              exerciseRepository.findById(destinationExerciseWrapper.get().getId()).orElseThrow();
          Optional<Challenge> recreated =
              fromIterable(challengeService.getExerciseChallenges(dest.getId())).stream()
                  .filter(c -> c.getName().equals(expected.getName()))
                  .findAny();

          Assertions.assertTrue(recreated.isPresent(), "Could not find expected challenge");
          Assertions.assertEquals(expected.getName(), recreated.get().getName());
          Assertions.assertEquals(expected.getContent(), recreated.get().getContent());
          Assertions.assertEquals(expected.getCategory(), recreated.get().getCategory());
          Assertions.assertEquals(expected.getScore(), recreated.get().getScore());
          Assertions.assertEquals(expected.getMaxAttempts(), recreated.get().getMaxAttempts());
          for (ChallengeFlag flag : expected.getFlags()) {
            Assertions.assertTrue(
                recreated.get().getFlags().stream()
                    .anyMatch(
                        flg ->
                            flg.getType().equals(flag.getType())
                                && flg.getValue().equals(flag.getValue())),
                "Flag of type " + flag.getType() + " not found in challenge");

            Assertions.assertNotEquals(expected.getId(), recreated.get().getId());
          }
        }
      }

      @Test
      @DisplayName("All payloads have been recreated")
      public void allPayloadsHaveBeenRecreated() throws Exception {
        byte[] exportData = getExportDataThenDelete(getInjectFromExerciseWrappers());
        ExerciseComposer.Composer destinationExerciseWrapper = getPersistedExerciseWrapper();
        InjectImportInput input =
            createTargetInput(
                InjectImportTargetType.SIMULATION, destinationExerciseWrapper.get().getId());

        doImport(exportData, input).andExpect(status().is2xxSuccessful());
        clearEntityManager();

        for (Payload expected : payloadComposer.generatedItems) {
          Exercise dest =
              exerciseRepository.findById(destinationExerciseWrapper.get().getId()).orElseThrow();
          Optional<Payload> recreated =
              dest.getInjects().stream()
                  .map(Inject::getInjectorContract)
                  .filter(Optional::isPresent)
                  .map(injectorContract -> injectorContract.get().getPayload())
                  .filter(c -> c.getName().equals(expected.getName()))
                  .findAny();

          Assertions.assertTrue(recreated.isPresent(), "Could not find expected payload");
          Assertions.assertEquals(expected.getName(), recreated.get().getName());
          Assertions.assertEquals(expected.getDescription(), recreated.get().getDescription());
          Assertions.assertEquals(expected.getStatus(), recreated.get().getStatus());
          Assertions.assertEquals(
              expected.getCleanupCommand(), recreated.get().getCleanupCommand());
          Assertions.assertEquals(
              expected.getCleanupExecutor(), recreated.get().getCleanupExecutor());
          Assertions.assertEquals(expected.getExecutionArch(), recreated.get().getExecutionArch());
          Assertions.assertEquals(
              expected.getNumberOfActions(), recreated.get().getNumberOfActions());
          Assertions.assertEquals(expected.getType(), recreated.get().getType());
          Assertions.assertEquals(expected.getSource(), recreated.get().getSource());
          Assertions.assertEquals(expected.getExternalId(), recreated.get().getExternalId());

          Assertions.assertNotEquals(expected.getId(), recreated.get().getId());
        }
      }

      @Test
      @DisplayName("All teams have been recreated")
      public void allTeamsHaveBeenRecreated() throws Exception {
        byte[] exportData = getExportDataThenDelete(getInjectFromExerciseWrappers());
        ExerciseComposer.Composer destinationExerciseWrapper = getPersistedExerciseWrapper();
        InjectImportInput input =
            createTargetInput(
                InjectImportTargetType.SIMULATION, destinationExerciseWrapper.get().getId());

        doImport(exportData, input).andExpect(status().is2xxSuccessful());
        clearEntityManager();

        for (Team expected : teamComposer.generatedItems) {
          Exercise dest =
              exerciseRepository.findById(destinationExerciseWrapper.get().getId()).orElseThrow();
          Optional<Team> recreated =
              dest.getTeams().stream()
                  .filter(c -> c.getName().equals(expected.getName()))
                  .findAny();

          Assertions.assertTrue(recreated.isPresent(), "Could not find expected team");
          Assertions.assertEquals(expected.getName(), recreated.get().getName());
          Assertions.assertEquals(expected.getDescription(), recreated.get().getDescription());

          Assertions.assertNotEquals(expected.getId(), recreated.get().getId());
        }
      }

      @Test
      @DisplayName("All users have been recreated")
      public void allUsersHaveBeenRecreated() throws Exception {
        byte[] exportData = getExportDataThenDelete(getInjectFromExerciseWrappers());
        ExerciseComposer.Composer destinationExerciseWrapper = getPersistedExerciseWrapper();
        InjectImportInput input =
            createTargetInput(
                InjectImportTargetType.SIMULATION, destinationExerciseWrapper.get().getId());

        doImport(exportData, input).andExpect(status().is2xxSuccessful());
        clearEntityManager();

        for (User expected : userComposer.generatedItems) {
          Exercise dest =
              exerciseRepository.findById(destinationExerciseWrapper.get().getId()).orElseThrow();
          Optional<User> recreated =
              dest.getTeams().stream()
                  .flatMap(team -> team.getUsers().stream())
                  .filter(c -> c.getEmail().equals(expected.getEmail()))
                  .findAny();

          Assertions.assertTrue(recreated.isPresent(), "Could not find expected user");
          Assertions.assertEquals(expected.getName(), recreated.get().getName());
          Assertions.assertEquals(expected.getFirstname(), recreated.get().getFirstname());
          Assertions.assertEquals(expected.getLastname(), recreated.get().getLastname());
          Assertions.assertEquals(expected.getLang(), recreated.get().getLang());
          Assertions.assertEquals(expected.getEmail(), recreated.get().getEmail());
          Assertions.assertEquals(expected.getPhone(), recreated.get().getPhone());
          Assertions.assertEquals(expected.getPgpKey(), recreated.get().getPgpKey());
          Assertions.assertEquals(expected.getCountry(), recreated.get().getCountry());
          Assertions.assertEquals(expected.getCity(), recreated.get().getCity());

          Assertions.assertNotEquals(expected.getId(), recreated.get().getId());
        }
      }

      @Test
      @DisplayName("All organisations have been recreated")
      public void allOrganisationsHaveBeenRecreated() throws Exception {
        byte[] exportData = getExportDataThenDelete(getInjectFromExerciseWrappers());
        ExerciseComposer.Composer destinationExerciseWrapper = getPersistedExerciseWrapper();
        InjectImportInput input =
            createTargetInput(
                InjectImportTargetType.SIMULATION, destinationExerciseWrapper.get().getId());

        doImport(exportData, input).andExpect(status().is2xxSuccessful());
        clearEntityManager();

        for (Organization expected : organizationComposer.generatedItems) {
          Exercise dest =
              exerciseRepository.findById(destinationExerciseWrapper.get().getId()).orElseThrow();
          Optional<Organization> recreated =
              dest.getTeams().stream()
                  .flatMap(team -> team.getUsers().stream())
                  .map(User::getOrganization)
                  .filter(c -> c.getName().equals(expected.getName()))
                  .findAny();

          Assertions.assertTrue(recreated.isPresent(), "Could not find expected user");
          Assertions.assertEquals(expected.getName(), recreated.get().getName());
          Assertions.assertEquals(expected.getDescription(), recreated.get().getDescription());

          Assertions.assertNotEquals(expected.getId(), recreated.get().getId());
        }
      }

      @Test
      @DisplayName("All tags have been recreated")
      public void allTagsHaveBeenRecreated() throws Exception {
        byte[] exportData = getExportDataThenDelete(getInjectFromExerciseWrappers());
        ExerciseComposer.Composer destinationExerciseWrapper = getPersistedExerciseWrapper();
        InjectImportInput input =
            createTargetInput(
                InjectImportTargetType.SIMULATION, destinationExerciseWrapper.get().getId());

        doImport(exportData, input).andExpect(status().is2xxSuccessful());
        clearEntityManager();

        for (Tag expected : tagComposer.generatedItems) {
          Exercise dest =
              exerciseRepository.findById(destinationExerciseWrapper.get().getId()).orElseThrow();

          Optional<Tag> recreated =
              ExerciseHelper.crawlAllTags(dest, challengeService).stream()
                  .filter(c -> c.getName().equals(expected.getName()))
                  .findAny();

          Assertions.assertTrue(recreated.isPresent(), "Could not find expected user");
          Assertions.assertEquals(expected.getName(), recreated.get().getName());
          Assertions.assertEquals(expected.getColor(), recreated.get().getColor());

          Assertions.assertNotEquals(expected.getId(), recreated.get().getId());
        }
      }

      @Test
      @DisplayName("All documents have been recreated")
      public void allDocumentsHaveBeenRecreated() throws Exception {
        byte[] exportData = getExportDataThenDelete(getInjectFromExerciseWrappers());
        ExerciseComposer.Composer destinationExerciseWrapper = getPersistedExerciseWrapper();
        InjectImportInput input =
            createTargetInput(
                InjectImportTargetType.SIMULATION, destinationExerciseWrapper.get().getId());

        doImport(exportData, input).andExpect(status().is2xxSuccessful());
        clearEntityManager();

        for (Document expected : documentComposer.generatedItems) {
          Exercise dest =
              exerciseRepository.findById(destinationExerciseWrapper.get().getId()).orElseThrow();
          Optional<Document> recreated =
              crawlDocumentsFromInjects(dest.getInjects()).stream()
                  .filter(c -> c.getName().equals(expected.getName()))
                  .findAny();

          Assertions.assertTrue(recreated.isPresent(), "Could not find expected document");
          Assertions.assertEquals(expected.getName(), recreated.get().getName());
          Assertions.assertEquals(expected.getDescription(), recreated.get().getDescription());
          Assertions.assertEquals(expected.getTarget(), recreated.get().getTarget());
          Assertions.assertEquals(expected.getType(), recreated.get().getType());

          Assertions.assertNotEquals(expected.getId(), recreated.get().getId());
        }
      }
    }

    @Nested
    @DisplayName("When targeting a scenario")
    public class WhenTargetingAScenario {

      private ScenarioComposer.Composer getPersistedScenarioWrapper() {
        return scenarioComposer
            .forScenario(ScenarioFixture.createDefaultIncidentResponseScenario())
            .persist();
      }

      @Test
      @DisplayName("All injects were appended to scenario")
      public void allInjectsWereAppendedToScenario() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All articles have been recreated")
      public void allArticlesHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All channels have been recreated")
      public void allChannelsHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All challenges have been recreated")
      public void allChallengesHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All payloads have been recreated")
      public void allPayloadsHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All teams have been recreated")
      public void allTeamsHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All users have been recreated")
      public void allUsersHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All organisations have been recreated")
      public void allOrganisationsHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All tags have been recreated")
      public void allTagsHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All documents have been recreated")
      public void allDocumentsHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }
    }

    @Nested
    @DisplayName("When targeting atomic testing")
    public class WhenTargetingAtomicTesting {

      @Test
      @DisplayName("Each inject was created in its own atomic testing")
      public void eachInjectWasCreatedInAtomicTesting() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All articles have been recreated")
      public void allArticlesHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All channels have been recreated")
      public void allChannelsHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All challenges have been recreated")
      public void allChallengesHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All payloads have been recreated")
      public void allPayloadsHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All teams have been recreated")
      public void allTeamsHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All users have been recreated")
      public void allUsersHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All organisations have been recreated")
      public void allOrganisationsHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All tags have been recreated")
      public void allTagsHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("All documents have been recreated")
      public void allDocumentsHaveBeenRecreated() throws Exception {
        Assertions.fail();
      }
    }
  }

  @Nested
  @WithMockPlannerUser
  @DisplayName("When imported objects already exist on the destination")
  public class WhenImportedObjectsAlreadyExistOnDestination {

    @Nested
    @DisplayName("When targeting an exercise")
    public class WhenTargetingAnExercise {

      private ExerciseComposer.Composer getExerciseWrapper() {
        return exerciseComposer.forExercise(ExerciseFixture.createDefaultExercise()).persist();
      }

      @Test
      @DisplayName("All injects were appended to exercise")
      public void allInjectsWereAppendedToExercise() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Create new articles anyway")
      public void createNewArticlesAnyway() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("New articles are assigned to exercise")
      public void newArticlesAreAssignedToExercise() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing channels are reused")
      public void existingChannelsAreReused() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing challenges are reused")
      public void existingChallengesAreReused() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing payloads are reused")
      public void existingPayloadsAreReused() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing teams are assigned to exercise")
      public void existingTeamsAreAssignedToExercise() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing users are assigned to exercise")
      public void existingUsersAreAssignedToExercise() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing organisations are assigned to exercise")
      public void existingOrganisationsAreAssignedToExercise() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing tags are reused")
      public void existingTagsAreReused() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing documents are reused")
      public void existingDocumentsAreReused() throws Exception {
        Assertions.fail();
      }
    }

    @Nested
    @DisplayName("When targeting a scenario")
    public class WhenTargetingAScenario {

      private ScenarioComposer.Composer getScenarioWrapper() {
        return scenarioComposer
            .forScenario(ScenarioFixture.createDefaultIncidentResponseScenario())
            .persist();
      }

      @Test
      @DisplayName("All injects were appended to scenario")
      public void allInjectsWereAppendedToScenario() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Create new articles anyway")
      public void createNewArticlesAnyway() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("New articles are assigned to scenario")
      public void newArticlesAreAssignedToScenario() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing channels are reused")
      public void existingChannelsAreReused() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing challenges are reused")
      public void existingChallengesAreReused() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing payloads are reused")
      public void existingPayloadsAreReused() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing teams are assigned to scenario")
      public void existingTeamsAreAssignedToScenario() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing users are assigned to scenario")
      public void existingUsersAreAssignedToScenario() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing organisations are assigned to scenario")
      public void existingOrganisationsAreAssignedToScenario() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing tags are reused")
      public void existingTagsAreReused() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing documents are reused")
      public void existingDocumentsAreReused() throws Exception {
        Assertions.fail();
      }
    }

    @Nested
    @DisplayName("When targeting atomic testing")
    public class WhenTargetingAtomicTesting {

      @Test
      @DisplayName("Each inject is added to its own atomic testing")
      public void eachInjectWasAddedToAtomicTesting() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Create new articles anyway")
      public void createNewArticlesAnyway() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("New articles are assigned to atomic testing")
      public void newArticlesAreAssignedToAtomicTesting() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing channels are reused")
      public void existingChannelsAreReused() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing challenges are reused")
      public void existingChallengesAreReused() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing payloads are reused")
      public void existingPayloadsAreReused() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing teams are assigned to atomic testing")
      public void existingTeamsAreAssignedToAtomicTesting() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing users are assigned to atomic testing")
      public void existingUsersAreAssignedToAtomicTesting() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing organisations are assigned to atomic testing")
      public void existingOrganisationsAreAssignedToAtomicTesting() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing tags are reused")
      public void existingTagsAreReused() throws Exception {
        Assertions.fail();
      }

      @Test
      @DisplayName("Existing documents are reused")
      public void existingDocumentsAreReused() throws Exception {
        Assertions.fail();
      }
    }
  }
}
