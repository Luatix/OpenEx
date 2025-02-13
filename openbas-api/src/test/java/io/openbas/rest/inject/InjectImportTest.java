package io.openbas.rest.inject;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.openbas.IntegrationTest;
import io.openbas.database.model.Exercise;
import io.openbas.database.model.Inject;
import io.openbas.database.model.Scenario;
import io.openbas.rest.exercise.exports.ExportOptions;
import io.openbas.rest.inject.form.InjectImportInput;
import io.openbas.rest.inject.form.InjectImportTargetDefinition;
import io.openbas.rest.inject.form.InjectImportTargetType;
import io.openbas.rest.inject.service.InjectExportService;
import io.openbas.utils.fixtures.*;
import io.openbas.utils.fixtures.composers.*;
import io.openbas.utils.mockUser.WithMockPlannerUser;
import io.openbas.utils.mockUser.WithMockUnprivilegedUser;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import static io.openbas.rest.inject.InjectApi.INJECT_URI;
import static org.junit.jupiter.api.TestInstance.Lifecycle.PER_CLASS;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
    @Autowired private InjectorFixture injectorFixture;
    @Autowired private EntityManager entityManager;

    public final String INJECT_IMPORT_URI = INJECT_URI + "/import";

    private List<InjectComposer.Composer> getInjectFromExerciseWrappers() {
        // Inject in exercise with an article attached
        ArticleComposer.Composer articleWrapper = articleComposer
                .forArticle(ArticleFixture.getDefaultArticle())
                .withChannel(channelComposer.forChannel(ChannelFixture.getDefaultChannel()));
        InjectComposer.Composer injectWithArticleInExercise = injectComposer.forInject(InjectFixture.getDefaultInject())
                .withInjectorContract(
                        injectorContractComposer
                                .forInjectorContract(InjectorContractFixture.createDefaultInjectorContract())
                                .withArticle(articleWrapper));
        // Inject with challenge in exercise
        InjectComposer.Composer injectWithChallengeInExercise = injectComposer.forInject(InjectFixture.getDefaultInject())
                .withInjectorContract(
                        injectorContractComposer
                                .forInjectorContract(InjectorContractFixture.createDefaultInjectorContract())
                                .withChallenge(challengeComposer.forChallenge(ChallengeFixture.createDefaultChallenge())));
        // wrap it into an exercise
        exerciseComposer.forExercise(ExerciseFixture.createDefaultExercise())
                .withArticle(articleWrapper)
                .withInject(injectWithArticleInExercise)
                .withInject(injectWithChallengeInExercise)
                .persist();

        return List.of(injectWithArticleInExercise, injectWithChallengeInExercise);
    }

    private void clearEntityManager() {
        entityManager.flush();
        entityManager.clear();
    }

    private byte[] getExportData(List<InjectComposer.Composer> wrappers, boolean withPlayers, boolean withTeams, boolean withVariableValues) throws IOException {
        List<Inject> injects = wrappers.stream().map(InjectComposer.Composer::get).toList();
        byte[] data = exportService.exportInjectsToZip(injects, ExportOptions.mask(withPlayers, withTeams, withVariableValues));
        clearEntityManager();
        return data;
    }

    private ResultActions doImport(byte[] importZipData, InjectImportInput input) throws Exception {
        return doImportStringInput(importZipData, objectMapper.writeValueAsString(input));
    }

    private ResultActions doImportStringInput(byte[] importZipData, String input) throws Exception {
        ResultActions ra = mvc.perform(multipart(INJECT_IMPORT_URI)
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
    public class WhenPassingInvalidTargetType{
        @Test
        @DisplayName("Return BAD REQUEST")
        public void returnBADREQUEST() throws Exception {
            byte[] exportData = getExportData(getInjectFromExerciseWrappers(), false, false, false);

            InjectImportInput input = createTargetInput(InjectImportTargetType.SCENARIO, null);
            ObjectNode inputAsNode = objectMapper.valueToTree(input);
            ((ObjectNode)inputAsNode.get("target")).set("type", objectMapper.valueToTree("something_bad"));

            doImportStringInput(exportData, objectMapper.writeValueAsString(inputAsNode)).andExpect(status().isBadRequest());
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

            Exercise targetExercise = exerciseComposer.forExercise(ExerciseFixture.createDefaultExercise()).persist().get();

            InjectImportInput input = createTargetInput(InjectImportTargetType.SIMULATION, targetExercise.getId());

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

            InjectImportInput input = createTargetInput(InjectImportTargetType.SIMULATION, UUID.randomUUID().toString());

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

            Scenario targetScenario = scenarioComposer.forScenario(ScenarioFixture.createDefaultIncidentResponseScenario()).persist().get();

            InjectImportInput input = createTargetInput(InjectImportTargetType.SCENARIO, targetScenario.getId());

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

            InjectImportInput input = createTargetInput(InjectImportTargetType.SCENARIO, UUID.randomUUID().toString());

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

            InjectImportInput input = createTargetInput(InjectImportTargetType.ATOMIC_TESTING, UUID.randomUUID().toString());

            doImport(exportData, input).andExpect(status().isNotFound());
        }
    }

    @Nested
    @WithMockPlannerUser
    @DisplayName("When imported objects don't already exist on the destination")
    public class WhenImportedObjectsDontAlreadyExistOnDestination {

        private byte[] getExportDataThenDelete(List<InjectComposer.Composer> wrappers, boolean withPlayers, boolean withTeams, boolean withVariableValues) throws IOException {
            byte[] data = getExportData(wrappers, withPlayers, withTeams, withVariableValues);
            wrappers.forEach(InjectComposer.Composer::delete);
            return data;
        }

        @Nested
        @DisplayName("When targeting an exercise")
        public class WhenTargetingAnExercise {

            private ExerciseComposer.Composer getExerciseWrapper() {
                return exerciseComposer.forExercise(ExerciseFixture.createDefaultExercise()).persist();
            }

            @Test
            @DisplayName("All injects were appended to exercise")
            public void allInjectsWereAppendedToExercise() throws IOException {
                byte[] exportData = getExportDataThenDelete(getInjectFromExerciseWrappers(), false, false, false);
                ExerciseComposer.Composer destinationExerciseWrapper = getExerciseWrapper();
            }

            @Test
            @DisplayName("All articles have been recreated")
            public void allArticlesHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All channels have been recreated")
            public void allChannelsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All challenges have been recreated")
            public void allChallengesHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All payloads have been recreated")
            public void allPayloadsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All teams have been recreated")
            public void allTeamsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All users have been recreated")
            public void allUsersHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All organisations have been recreated")
            public void allOrganisationsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All tags have been recreated")
            public void allTagsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All documents have been recreated")
            public void allDocumentsHaveBeenRecreated() {
                Assertions.fail();
            }
        }

        @Nested
        @DisplayName("When targeting a scenario")
        public class WhenTargetingAScenario {

            private ScenarioComposer.Composer getScenarioWrapper() {
                return scenarioComposer.forScenario(ScenarioFixture.createDefaultIncidentResponseScenario()).persist();
            }

            @Test
            @DisplayName("All injects were appended to scenario")
            public void allInjectsWereAppendedToScenario() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All articles have been recreated")
            public void allArticlesHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All channels have been recreated")
            public void allChannelsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All challenges have been recreated")
            public void allChallengesHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All payloads have been recreated")
            public void allPayloadsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All teams have been recreated")
            public void allTeamsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All users have been recreated")
            public void allUsersHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All organisations have been recreated")
            public void allOrganisationsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All tags have been recreated")
            public void allTagsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All documents have been recreated")
            public void allDocumentsHaveBeenRecreated() {
                Assertions.fail();
            }
        }

        @Nested
        @DisplayName("When targeting atomic testing")
        public class WhenTargetingAtomicTesting {

            @Test
            @DisplayName("Each inject was created in its own atomic testing")
            public void eachInjectWasCreatedInAtomicTesting() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All articles have been recreated")
            public void allArticlesHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All channels have been recreated")
            public void allChannelsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All challenges have been recreated")
            public void allChallengesHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All payloads have been recreated")
            public void allPayloadsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All teams have been recreated")
            public void allTeamsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All users have been recreated")
            public void allUsersHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All organisations have been recreated")
            public void allOrganisationsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All tags have been recreated")
            public void allTagsHaveBeenRecreated() {
                Assertions.fail();
            }

            @Test
            @DisplayName("All documents have been recreated")
            public void allDocumentsHaveBeenRecreated() {
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
            public void allInjectsWereAppendedToExercise() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Create new articles anyway")
            public void createNewArticlesAnyway() {
                Assertions.fail();
            }

            @Test
            @DisplayName("New articles are assigned to exercise")
            public void newArticlesAreAssignedToExercise() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing channels are reused")
            public void existingChannelsAreReused() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing challenges are reused")
            public void existingChallengesAreReused() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing payloads are reused")
            public void existingPayloadsAreReused() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing teams are assigned to exercise")
            public void existingTeamsAreAssignedToExercise() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing users are assigned to exercise")
            public void existingUsersAreAssignedToExercise() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing organisations are assigned to exercise")
            public void existingOrganisationsAreAssignedToExercise() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing tags are reused")
            public void existingTagsAreReused() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing documents are reused")
            public void existingDocumentsAreReused() {
                Assertions.fail();
            }
        }

        @Nested
        @DisplayName("When targeting a scenario")
        public class WhenTargetingAScenario {

            private ScenarioComposer.Composer getScenarioWrapper() {
                return scenarioComposer.forScenario(ScenarioFixture.createDefaultIncidentResponseScenario()).persist();
            }

            @Test
            @DisplayName("All injects were appended to scenario")
            public void allInjectsWereAppendedToScenario() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Create new articles anyway")
            public void createNewArticlesAnyway() {
                Assertions.fail();
            }

            @Test
            @DisplayName("New articles are assigned to scenario")
            public void newArticlesAreAssignedToScenario() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing channels are reused")
            public void existingChannelsAreReused() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing challenges are reused")
            public void existingChallengesAreReused() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing payloads are reused")
            public void existingPayloadsAreReused() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing teams are assigned to scenario")
            public void existingTeamsAreAssignedToScenario() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing users are assigned to scenario")
            public void existingUsersAreAssignedToScenario() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing organisations are assigned to scenario")
            public void existingOrganisationsAreAssignedToScenario() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing tags are reused")
            public void existingTagsAreReused() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing documents are reused")
            public void existingDocumentsAreReused() {
                Assertions.fail();
            }
        }

        @Nested
        @DisplayName("When targeting atomic testing")
        public class WhenTargetingAtomicTesting {

            @Test
            @DisplayName("Each inject is added to its own atomic testing")
            public void eachInjectWasAddedToAtomicTesting() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Create new articles anyway")
            public void createNewArticlesAnyway() {
                Assertions.fail();
            }

            @Test
            @DisplayName("New articles are assigned to atomic testing")
            public void newArticlesAreAssignedToAtomicTesting() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing channels are reused")
            public void existingChannelsAreReused() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing challenges are reused")
            public void existingChallengesAreReused() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing payloads are reused")
            public void existingPayloadsAreReused() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing teams are assigned to atomic testing")
            public void existingTeamsAreAssignedToAtomicTesting() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing users are assigned to atomic testing")
            public void existingUsersAreAssignedToAtomicTesting() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing organisations are assigned to atomic testing")
            public void existingOrganisationsAreAssignedToAtomicTesting() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing tags are reused")
            public void existingTagsAreReused() {
                Assertions.fail();
            }

            @Test
            @DisplayName("Existing documents are reused")
            public void existingDocumentsAreReused() {
                Assertions.fail();
            }
        }
    }
}
