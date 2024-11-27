package io.openbas.importer;

import static io.openbas.helper.StreamHelper.iterableToSet;
import static io.openbas.injectors.challenge.ChallengeContract.CHALLENGE_PUBLISH;
import static io.openbas.injectors.channel.ChannelContract.CHANNEL_PUBLISH;
import static io.openbas.rest.exercise.exports.ExerciseFileExport.EXERCISE_VARIABLES;
import static io.openbas.rest.scenario.export.ScenarioFileExport.SCENARIO_VARIABLES;
import static java.util.Optional.ofNullable;
import static org.springframework.util.StringUtils.hasText;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import io.openbas.database.model.*;
import io.openbas.database.model.Scenario.SEVERITY;
import io.openbas.database.repository.*;
import io.openbas.injectors.challenge.model.ChallengeContent;
import io.openbas.injectors.channel.model.ChannelContent;
import io.openbas.rest.exercise.exports.VariableWithValueMixin;
import io.openbas.rest.inject.form.InjectDependencyInput;
import io.openbas.service.FileService;
import io.openbas.service.ImportEntry;
import io.openbas.service.ScenarioService;
import jakarta.activation.MimetypesFileTypeMap;
import jakarta.annotation.Resource;
import java.time.Instant;
import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Log
@RequiredArgsConstructor
public class V1_DataImporter implements Importer {

  // region variables
  @Resource protected ObjectMapper mapper;
  private final FileService documentService;
  private final DocumentRepository documentRepository;
  private final TagRepository tagRepository;
  private final ExerciseRepository exerciseRepository;
  private final ScenarioService scenarioService;
  private final TeamRepository teamRepository;
  private final ObjectiveRepository objectiveRepository;
  private final InjectRepository injectRepository;
  private final OrganizationRepository organizationRepository;
  private final UserRepository userRepository;
  private final InjectDocumentRepository injectDocumentRepository;
  private final ChallengeRepository challengeRepository;
  private final ChannelRepository channelRepository;
  private final ArticleRepository articleRepository;
  private final LessonsCategoryRepository lessonsCategoryRepository;
  private final LessonsQuestionRepository lessonsQuestionRepository;
  private final VariableRepository variableRepository;
  private final InjectDependenciesRepository injectDependenciesRepository;

  // endregion

  private String handleInjectContent(
      Map<String, Base> baseIds, String contract, JsonNode injectNode) {
    if (contract == null) {
      return null;
    }
    String content = injectNode.get("inject_content").toString();
    switch (contract) {
      // Challenges exists in exercise only through inject content definition
      // So we need to rewrite content for challenges to remap the challenge ids
      case CHALLENGE_PUBLISH -> {
        try {
          JsonNode jsonNode = mapper.readTree(content);
          ChallengeContent challengeContent = mapper.treeToValue(jsonNode, ChallengeContent.class);
          List<String> remappedIds =
              challengeContent.getChallenges().stream()
                  .map(baseIds::get)
                  .filter(Objects::nonNull)
                  .map(Base::getId)
                  .toList();
          challengeContent.setChallenges(remappedIds);
          content = mapper.writeValueAsString(challengeContent);
        } catch (Exception e) {
          // Error rewriting content, inject cant be created
          return null;
        }
      }
      // Channel articles exists in exercise only through inject content definition
      // So we need to rewrite content for channels to remap the channel ids
      case CHANNEL_PUBLISH -> {
        try {
          JsonNode jsonNode = mapper.readTree(content);
          ChannelContent channelContent = mapper.treeToValue(jsonNode, ChannelContent.class);
          List<String> remappedIds =
              channelContent.getArticles().stream()
                  .map(baseIds::get)
                  .filter(Objects::nonNull)
                  .map(Base::getId)
                  .toList();
          channelContent.setArticles(remappedIds);
          content = mapper.writeValueAsString(channelContent);
        } catch (Exception e) {
          // Error rewriting content, inject cant be created
          return null;
        }
      }
    }
    return content;
  }

  private Set<Tag> computeTagsCompletion(
      Set<Tag> existingTags, List<String> lookingIds, Map<String, Base> baseIds) {
    Set<Tag> tags = new HashSet<>(existingTags);
    Set<Tag> tagsForOrganization =
        lookingIds.stream().map(baseIds::get).map(Tag.class::cast).collect(Collectors.toSet());
    tags.addAll(tagsForOrganization);
    return tags;
  }

  @Override
  @Transactional
  public void importData(JsonNode importNode, Map<String, ImportEntry> docReferences) {
    Map<String, Base> baseIds = new HashMap<>();
    final String prefix = importNode.has("exercise_information") ? "exercise_" : "scenario_";

    importTags(importNode, prefix, baseIds);
    Exercise savedExercise = importExercise(importNode, baseIds);
    Scenario savedScenario = importScenario(importNode, baseIds);
    importDocuments(importNode, prefix, docReferences, savedExercise, savedScenario, baseIds);
    importOrganizations(importNode, prefix, baseIds);
    importUsers(importNode, prefix, baseIds);
    importTeams(importNode, prefix, savedExercise, savedScenario, baseIds);
    importChallenges(importNode, prefix, baseIds);
    importChannels(importNode, prefix, baseIds);
    importArticles(importNode, prefix, savedExercise, savedScenario, baseIds);
    importObjectives(importNode, prefix, savedExercise, savedScenario, baseIds);
    importLessons(importNode, prefix, savedExercise, savedScenario, baseIds);
    importInjects(importNode, prefix, savedExercise, savedScenario, baseIds);
    importVariables(importNode, savedExercise, savedScenario, baseIds);
  }

  // -- TAGS --

  private void importTags(JsonNode importNode, String prefix, Map<String, Base> baseIds) {
    resolveJsonElements(importNode, prefix + "tags")
        .forEach(
            nodeTag -> {
              String id = nodeTag.get("tag_id").textValue();
              if (baseIds.get(id) != null) {
                // Already import
                return;
              }
              String name = nodeTag.get("tag_name").textValue();

              List<Tag> existingTags = this.tagRepository.findByNameIgnoreCase(name);
              if (!existingTags.isEmpty()) {
                baseIds.put(id, existingTags.getFirst());
              } else {
                baseIds.put(id, this.tagRepository.save(createTag(nodeTag)));
              }
            });
  }

  private Tag createTag(JsonNode jsonNode) {
    Tag tag = new Tag();
    tag.setId(jsonNode.get("tag_id").textValue());
    tag.setName(jsonNode.get("tag_name").textValue());
    tag.setColor(jsonNode.get("tag_color").textValue());
    return tag;
  }

  // -- EXERCISE --

  private Exercise importExercise(JsonNode importNode, Map<String, Base> baseIds) {
    JsonNode exerciseNode = importNode.get("exercise_information");
    if (exerciseNode == null) {
      return null;
    }

    Exercise exercise = new Exercise();
    exercise.setName(exerciseNode.get("exercise_name").textValue() + " (Import)");
    exercise.setDescription(exerciseNode.get("exercise_description").textValue());
    exercise.setSubtitle(exerciseNode.get("exercise_subtitle").textValue());
    exercise.setHeader(exerciseNode.get("exercise_message_header").textValue());
    exercise.setFooter(exerciseNode.get("exercise_message_footer").textValue());
    exercise.setFrom(exerciseNode.get("exercise_mail_from").textValue());
    exercise.setTags(
        resolveJsonIds(exerciseNode, "exercise_tags").stream()
            .map(baseIds::get)
            .map(Tag.class::cast)
            .collect(Collectors.toSet()));

    return exerciseRepository.save(exercise);
  }

  // -- SCENARIO --

  private Scenario importScenario(JsonNode importNode, Map<String, Base> baseIds) {
    JsonNode scenarioNode = importNode.get("scenario_information");
    if (scenarioNode == null) {
      return null;
    }

    Scenario scenario = new Scenario();
    scenario.setName(scenarioNode.get("scenario_name").textValue() + " (Import)");
    scenario.setDescription(scenarioNode.get("scenario_description").textValue());
    scenario.setSubtitle(scenarioNode.get("scenario_subtitle").textValue());
    scenario.setCategory(scenarioNode.get("scenario_category").textValue());
    scenario.setMainFocus(scenarioNode.get("scenario_main_focus").textValue());
    Optional.ofNullable(scenarioNode.get("scenario_severity"))
        .map(JsonNode::textValue)
        .ifPresent(severity -> scenario.setSeverity(SEVERITY.valueOf(severity)));
    Optional.ofNullable(scenarioNode.get("scenario_recurrence"))
        .map(JsonNode::textValue)
        .ifPresent(scenario::setRecurrence);
    Optional.ofNullable(scenarioNode.get("scenario_recurrence_start"))
        .map(JsonNode::textValue)
        .ifPresent(recurrenceStart -> scenario.setRecurrenceStart(Instant.parse(recurrenceStart)));
    Optional.ofNullable(scenarioNode.get("scenario_recurrence_end"))
        .map(JsonNode::textValue)
        .ifPresent(recurrenceEnd -> scenario.setRecurrenceEnd(Instant.parse(recurrenceEnd)));
    scenario.setHeader(scenarioNode.get("scenario_message_header").textValue());
    scenario.setFooter(scenarioNode.get("scenario_message_footer").textValue());
    scenario.setFrom(scenarioNode.get("scenario_mail_from").textValue());
    scenario.setTags(
        resolveJsonIds(scenarioNode, "scenario_tags").stream()
            .map(baseIds::get)
            .map(Tag.class::cast)
            .collect(Collectors.toSet()));

    return scenarioService.createScenario(scenario);
  }

  private void importDocuments(
      JsonNode importNode,
      String prefix,
      Map<String, ImportEntry> docReferences,
      Exercise savedExercise,
      Scenario savedScenario,
      Map<String, Base> baseIds) {
    Stream<JsonNode> documentsStream = resolveJsonElements(importNode, prefix + "documents");
    documentsStream.forEach(
        nodeDoc -> {
          String target = nodeDoc.get("document_target").textValue();
          ImportEntry entry = docReferences.get(target);

          if (entry != null) {
            handleDocumentWithEntry(nodeDoc, entry, target, savedExercise, savedScenario, baseIds);
          }
        });
  }

  private void handleDocumentWithEntry(
      JsonNode nodeDoc,
      ImportEntry entry,
      String target,
      Exercise savedExercise,
      Scenario savedScenario,
      Map<String, Base> baseIds) {
    String contentType = new MimetypesFileTypeMap().getContentType(entry.getEntry().getName());
    Optional<Document> targetDocument = this.documentRepository.findByTarget(target);

    if (targetDocument.isPresent()) {
      updateExistingDocument(nodeDoc, targetDocument.get(), savedExercise, savedScenario, baseIds);
    } else {
      uploadNewDocument(nodeDoc, entry, target, savedExercise, savedScenario, contentType, baseIds);
    }
  }

  private void updateExistingDocument(
      JsonNode nodeDoc,
      Document document,
      Exercise savedExercise,
      Scenario savedScenario,
      Map<String, Base> baseIds) {
    if (savedExercise != null) {
      document.getExercises().add(savedExercise);
    } else if (savedScenario != null) {
      document.getScenarios().add(savedScenario);
    }
    document.setTags(
        computeTagsCompletion(
            document.getTags(), resolveJsonIds(nodeDoc, "document_tags"), baseIds));
    Document savedDocument = this.documentRepository.save(document);
    baseIds.put(nodeDoc.get("document_id").textValue(), savedDocument);
  }

  private void uploadNewDocument(
      JsonNode nodeDoc,
      ImportEntry entry,
      String target,
      Exercise savedExercise,
      Scenario savedScenario,
      String contentType,
      Map<String, Base> baseIds) {
    try {
      this.documentService.uploadFile(
          target, entry.getData(), entry.getEntry().getSize(), contentType);
    } catch (Exception e) {
      throw new ImportException(e);
    }

    Document document = new Document();
    document.setTarget(target);
    document.setName(nodeDoc.get("document_name").textValue());
    document.setDescription(nodeDoc.get("document_description").textValue());
    if (savedExercise != null) {
      document.setExercises(Set.of(savedExercise));
    } else if (savedScenario != null) {
      document.setScenarios(Set.of(savedScenario));
    }
    document.setTags(
        iterableToSet(tagRepository.findAllById(resolveJsonIds(nodeDoc, "document_tags"))));
    document.setType(contentType);
    Document savedDocument = this.documentRepository.save(document);
    baseIds.put(nodeDoc.get("document_id").textValue(), savedDocument);
  }

  // -- ORGANIZATION --

  private void importOrganizations(JsonNode importNode, String prefix, Map<String, Base> baseIds) {
    resolveJsonElements(importNode, prefix + "organizations")
        .forEach(
            nodeOrganization -> {
              String id = nodeOrganization.get("organization_id").textValue();
              if (baseIds.get(id) != null) {
                // Already import
                return;
              }
              String name = nodeOrganization.get("organization_name").textValue();

              List<Organization> existingOrganizations =
                  this.organizationRepository.findByNameIgnoreCase(name);

              if (!existingOrganizations.isEmpty()) {
                baseIds.put(id, existingOrganizations.getFirst());
              } else {
                baseIds.put(
                    id,
                    this.organizationRepository.save(
                        createOrganization(nodeOrganization, baseIds)));
              }
            });
  }

  private Organization createOrganization(JsonNode importNode, Map<String, Base> baseIds) {
    Organization organization = new Organization();
    organization.setName(importNode.get("organization_name").textValue());
    organization.setDescription(getNodeValue(importNode.get("organization_description")));
    organization.setTags(
        resolveJsonIds(importNode, "organization_tags").stream()
            .map(baseIds::get)
            .map(Tag.class::cast)
            .collect(Collectors.toSet()));
    return organization;
  }

  // -- USERS --

  private void importUsers(JsonNode importNode, String prefix, Map<String, Base> baseIds) {
    resolveJsonElements(importNode, prefix + "users")
        .forEach(
            nodeUser -> {
              String id = nodeUser.get("user_id").textValue();
              if (baseIds.get(id) != null) {
                // Already import
                return;
              }
              String email = nodeUser.get("user_email").textValue();

              User existingUser = this.userRepository.findByEmailIgnoreCase(email).orElse(null);

              baseIds.put(
                  id,
                  Objects.requireNonNullElseGet(
                      existingUser, () -> this.userRepository.save(createUser(nodeUser, baseIds))));
            });
  }

  private User createUser(JsonNode jsonNode, Map<String, Base> baseIds) {
    User user = new User();
    user.setEmail(jsonNode.get("user_email").textValue());
    user.setFirstname(jsonNode.get("user_firstname").textValue());
    user.setLastname(jsonNode.get("user_lastname").textValue());
    user.setLang(getNodeValue(jsonNode.get("user_lang")));
    user.setPhone(getNodeValue(jsonNode.get("user_phone")));
    user.setPgpKey(getNodeValue(jsonNode.get("user_pgp_key")));
    user.setCountry(getNodeValue(jsonNode.get("user_country")));
    user.setCity(getNodeValue(jsonNode.get("user_city")));
    Base userOrganization = baseIds.get(jsonNode.get("user_organization").textValue());
    if (userOrganization != null) {
      user.setOrganization((Organization) userOrganization);
    }
    user.setTags(
        resolveJsonIds(jsonNode, "user_tags").stream()
            .map(baseIds::get)
            .map(Tag.class::cast)
            .collect(Collectors.toSet()));
    return user;
  }

  // -- TEAMS --

  private void importTeams(
      JsonNode importNode,
      String prefix,
      Exercise savedExercise,
      Scenario savedScenario,
      Map<String, Base> baseIds) {
    Map<String, Team> baseTeams = handlingTeams(importNode, prefix, baseIds);
    baseTeams
        .values()
        .forEach(
            (team) -> {
              if (savedExercise != null) {
                team.getExercises().add(savedExercise);
              } else if (savedScenario != null) {
                team.getScenarios().add(savedScenario);
              }
            });
    baseIds.putAll(baseTeams);
  }

  private Map<String, Team> handlingTeams(
      JsonNode importNode, String prefix, Map<String, Base> baseIds) {
    Map<String, Team> baseTeams = new HashMap<>();

    resolveJsonElements(importNode, prefix + "teams")
        .forEach(
            nodeTeam -> {
              String id = nodeTeam.get("team_id").textValue();
              if (baseIds.get(id) != null) {
                // Already import
                return;
              }
              String name = nodeTeam.get("team_name").textValue();

              // Prevent duplication of team, based on the team name and not contextual
              List<Team> existingTeams =
                  this.teamRepository.findByNameIgnoreCaseAndNotContextual(name);

              if (!existingTeams.isEmpty()) {
                baseTeams.put(id, existingTeams.getFirst());
              } else {
                Team team = createTeam(nodeTeam, baseIds);
                // Tags
                List<String> teamTagIds = resolveJsonIds(nodeTeam, "team_tags");
                Set<Tag> tagsForTeam =
                    teamTagIds.stream()
                        .map(baseIds::get)
                        .filter(Objects::nonNull)
                        .map(Tag.class::cast)
                        .collect(Collectors.toSet());
                team.setTags(tagsForTeam);
                // Users
                List<String> teamUserIds = resolveJsonIds(nodeTeam, "team_users");
                List<User> usersForTeam =
                    teamUserIds.stream()
                        .map(baseIds::get)
                        .filter(Objects::nonNull)
                        .map(User.class::cast)
                        .toList();
                team.setUsers(usersForTeam);
                Team savedTeam = this.teamRepository.save(team);
                baseTeams.put(id, savedTeam);
              }
            });
    return baseTeams;
  }

  private Team createTeam(JsonNode jsonNode, Map<String, Base> baseIds) {
    Team team = new Team();
    team.setName(jsonNode.get("team_name").textValue());
    team.setDescription(jsonNode.get("team_description").textValue());
    if (jsonNode.get("team_organization") != null) {
      Base teamOrganization = baseIds.get(jsonNode.get("team_organization").textValue());
      if (teamOrganization != null) {
        team.setOrganization((Organization) teamOrganization);
      }
    }
    return team;
  }

  // -- CHALLENGES --

  private void importChallenges(JsonNode importNode, String prefix, Map<String, Base> baseIds) {
    resolveJsonElements(importNode, prefix + "challenges")
        .forEach(
            nodeChallenge -> {
              String id = nodeChallenge.get("challenge_id").textValue();
              if (baseIds.get(id) != null) {
                // Already import
                return;
              }
              String name = nodeChallenge.get("challenge_name").textValue();

              List<Challenge> existingChallenges =
                  this.challengeRepository.findByNameIgnoreCase(name);
              if (!existingChallenges.isEmpty()) {
                baseIds.put(id, existingChallenges.getFirst());
              } else {
                baseIds.put(
                    id, this.challengeRepository.save(createChallenge(nodeChallenge, baseIds)));
              }
            });
  }

  private Challenge createChallenge(JsonNode nodeChallenge, Map<String, Base> baseIds) {
    Challenge challenge = new Challenge();
    challenge.setName(nodeChallenge.get("challenge_name").textValue());
    challenge.setCategory(nodeChallenge.get("challenge_category").textValue());
    challenge.setContent(nodeChallenge.get("challenge_content").textValue());
    challenge.setScore(nodeChallenge.get("challenge_score").asDouble(0.0));
    challenge.setMaxAttempts(nodeChallenge.get("challenge_max_attempts").asInt(0));
    challenge.setDocuments(
        resolveJsonIds(nodeChallenge, "challenge_documents").stream()
            .map(docId -> (Document) baseIds.get(docId))
            .filter(Objects::nonNull)
            .toList());
    challenge.setFlags(
        resolveJsonElements(nodeChallenge, "challenge_flags")
            .map(node -> this.createChallengeFlag(node, challenge))
            .toList());
    challenge.setTags(
        resolveJsonIds(nodeChallenge, "challenge_tags").stream()
            .map(baseIds::get)
            .map(Tag.class::cast)
            .collect(Collectors.toSet()));

    return challenge;
  }

  private ChallengeFlag createChallengeFlag(JsonNode flagNode, Challenge challenge) {
    ChallengeFlag flag = new ChallengeFlag();
    flag.setValue(flagNode.get("flag_value").textValue());
    flag.setType(ChallengeFlag.FLAG_TYPE.valueOf(flagNode.get("flag_type").textValue()));
    flag.setChallenge(challenge);
    return flag;
  }

  // -- CHANNELS --

  private void importChannels(JsonNode importNode, String prefix, Map<String, Base> baseIds) {
    resolveJsonElements(importNode, prefix + "channels")
        .forEach(
            nodeChannel -> {
              String id = nodeChannel.get("channel_id").textValue();
              if (baseIds.get(id) != null) {
                // Already import
                return;
              }
              String channelName = nodeChannel.get("channel_name").textValue();

              List<Channel> existingChannels =
                  this.channelRepository.findByNameIgnoreCase(channelName);
              if (!existingChannels.isEmpty()) {
                baseIds.put(id, existingChannels.getFirst());
              } else {
                baseIds.put(id, this.channelRepository.save(createChannel(nodeChannel, baseIds)));
              }
            });
  }

  private Channel createChannel(JsonNode nodeChannel, Map<String, Base> baseIds) {
    Channel channel = new Channel();
    channel.setName(nodeChannel.get("channel_name").textValue());
    channel.setType(nodeChannel.get("channel_type").textValue());
    channel.setDescription(nodeChannel.get("channel_description").textValue());
    channel.setMode(nodeChannel.get("channel_mode").textValue());
    channel.setPrimaryColorDark(nodeChannel.get("channel_primary_color_dark").textValue());
    channel.setPrimaryColorLight(nodeChannel.get("channel_primary_color_light").textValue());
    channel.setSecondaryColorDark(nodeChannel.get("channel_secondary_color_dark").textValue());
    channel.setSecondaryColorLight(nodeChannel.get("channel_secondary_color_light").textValue());

    String channelLogoDark = nodeChannel.get("channel_logo_dark").textValue();
    if (channelLogoDark != null) {
      channel.setLogoDark((Document) baseIds.get(channelLogoDark));
    }
    String channelLogoLight = nodeChannel.get("channel_logo_light").textValue();
    if (channelLogoLight != null) {
      channel.setLogoLight((Document) baseIds.get(channelLogoLight));
    }

    return channel;
  }

  private void importArticles(
      JsonNode importNode,
      String prefix,
      Exercise savedExercise,
      Scenario savedScenario,
      Map<String, Base> baseIds) {
    resolveJsonElements(importNode, prefix + "articles")
        .forEach(
            nodeArticle -> {
              String id = nodeArticle.get("article_id").textValue();
              Article article = createArticle(nodeArticle, savedExercise, savedScenario, baseIds);
              baseIds.put(id, this.articleRepository.save(article));
            });
  }

  private Article createArticle(
      JsonNode nodeArticle,
      Exercise savedExercise,
      Scenario savedScenario,
      Map<String, Base> baseIds) {
    Article article = new Article();
    article.setName(nodeArticle.get("article_name").textValue());
    article.setContent(nodeArticle.get("article_content").textValue());
    article.setAuthor(nodeArticle.get("article_author").textValue());
    article.setShares(nodeArticle.get("article_shares").intValue());
    article.setLikes(nodeArticle.get("article_likes").intValue());
    article.setComments(nodeArticle.get("article_comments").intValue());
    if (savedExercise != null) {
      article.setExercise(savedExercise);
    } else if (savedScenario != null) {
      article.setScenario(savedScenario);
    }
    article.setDocuments(
        resolveJsonIds(nodeArticle, "article_documents").stream()
            .map(docId -> (Document) baseIds.get(docId))
            .filter(Objects::nonNull)
            .toList());
    article.setChannel((Channel) baseIds.get(nodeArticle.get("article_channel").textValue()));

    return article;
  }

  private void importObjectives(
      JsonNode importNode,
      String prefix,
      Exercise savedExercise,
      Scenario savedScenario,
      Map<String, Base> baseIds) {
    resolveJsonElements(importNode, prefix + "objectives")
        .forEach(
            nodeObjective -> {
              String id = nodeObjective.get("objective_id").textValue();
              Objective objective = createObjective(nodeObjective, savedExercise, savedScenario);
              baseIds.put(id, this.objectiveRepository.save(objective));
            });
  }

  private Objective createObjective(
      JsonNode nodeObjective, Exercise savedExercise, Scenario savedScenario) {
    Objective objective = new Objective();
    objective.setTitle(nodeObjective.get("objective_title").textValue());
    objective.setDescription(nodeObjective.get("objective_description").textValue());
    objective.setPriority((short) nodeObjective.get("objective_priority").asInt(0));
    if (savedExercise != null) {
      objective.setExercise(savedExercise);
    } else if (savedScenario != null) {
      objective.setScenario(savedScenario);
    }

    return objective;
  }

  private void importLessons(
      JsonNode importNode,
      String prefix,
      Exercise savedExercise,
      Scenario savedScenario,
      Map<String, Base> baseIds) {
    resolveJsonElements(importNode, prefix + "lessons_categories")
        .forEach(
            nodeLessonCategory -> {
              String id = nodeLessonCategory.get("lessonscategory_id").textValue();
              LessonsCategory lessonsCategory =
                  createLessonsCategory(nodeLessonCategory, savedExercise, savedScenario, baseIds);
              baseIds.put(id, this.lessonsCategoryRepository.save(lessonsCategory));
            });
    resolveJsonElements(importNode, prefix + "lessons_questions")
        .forEach(
            nodeLessonQuestion -> {
              String id = nodeLessonQuestion.get("lessonsquestion_id").textValue();
              LessonsQuestion lessonsQuestion = createLessonsQuestion(nodeLessonQuestion, baseIds);
              baseIds.put(id, this.lessonsQuestionRepository.save(lessonsQuestion));
            });
  }

  private LessonsCategory createLessonsCategory(
      JsonNode nodeLessonCategory,
      Exercise savedExercise,
      Scenario savedScenario,
      Map<String, Base> baseIds) {
    LessonsCategory lessonsCategory = new LessonsCategory();
    lessonsCategory.setName(nodeLessonCategory.get("lessons_category_name").textValue());
    lessonsCategory.setDescription(
        nodeLessonCategory.get("lessons_category_description").textValue());
    lessonsCategory.setOrder(nodeLessonCategory.get("lessons_category_order").intValue());
    if (savedExercise != null) {
      lessonsCategory.setExercise(savedExercise);
    } else if (savedScenario != null) {
      lessonsCategory.setScenario(savedScenario);
    }
    lessonsCategory.setTeams(
        resolveJsonIds(nodeLessonCategory, "lessons_category_teams").stream()
            .map(teamId -> (Team) baseIds.get(teamId))
            .filter(Objects::nonNull)
            .toList());

    return lessonsCategory;
  }

  private LessonsQuestion createLessonsQuestion(
      JsonNode nodeLessonQuestion, Map<String, Base> baseIds) {
    LessonsQuestion lessonsQuestion = new LessonsQuestion();
    lessonsQuestion.setContent(nodeLessonQuestion.get("lessons_question_content").textValue());
    lessonsQuestion.setExplanation(
        nodeLessonQuestion.get("lessons_question_explanation").textValue());
    lessonsQuestion.setOrder(nodeLessonQuestion.get("lessons_question_order").intValue());
    lessonsQuestion.setCategory(
        (LessonsCategory)
            baseIds.get(nodeLessonQuestion.get("lessons_question_category").textValue()));
    String categoryId = nodeLessonQuestion.get("lessons_question_category").asText();
    LessonsCategory lessonsCategory = (LessonsCategory) baseIds.get(categoryId);
    lessonsQuestion.setCategory(lessonsCategory);

    return lessonsQuestion;
  }

  private void importInjects(
      JsonNode importNode,
      String prefix,
      Exercise savedExercise,
      Scenario savedScenario,
      Map<String, Base> baseIds) {
    Supplier<Stream<JsonNode>> injectsStream =
        () -> resolveJsonElements(importNode, prefix + "injects");

    // Getting a list of all the children of the dependency
    List<String> children =
        injectsStream
            .get()
            .flatMap(
                jsonNode -> {
                  // List of dependencies of the inject
                  List<JsonNode> dependsOn =
                      StreamSupport.stream(jsonNode.get("inject_depends_on").spliterator(), false)
                          .toList();

                  // We return a stream containing all the children of the dependencies of the
                  // inject
                  return dependsOn.stream()
                      .map(
                          dependency ->
                              dependency
                                  .get("dependency_relationship")
                                  .get("inject_children_id")
                                  .asText());
                })
            .toList();

    // Getting a list of all the injects that have no parents
    Stream<JsonNode> injectsNoParent =
        injectsStream
            .get()
            .filter(jsonNode -> !children.contains(jsonNode.get("inject_id").asText()));

    if (savedExercise != null) {
      importInjects(
          baseIds,
          savedExercise.getId(),
          null,
          injectsNoParent.toList(),
          injectsStream.get().toList());
    } else if (savedScenario != null) {
      importInjects(
          baseIds,
          null,
          savedScenario.getId(),
          injectsNoParent.toList(),
          injectsStream.get().toList());
    }
  }

  private void importInjects(
      Map<String, Base> baseIds,
      String exerciseId,
      String scenarioId,
      List<JsonNode> injectsToAdd,
      List<JsonNode> allInjects) {
    List<String> originalIds = new ArrayList<>();
    injectsToAdd.forEach(
        injectNode -> {
          String injectId = UUID.randomUUID().toString();
          String id = injectNode.get("inject_id").textValue();
          String title = injectNode.get("inject_title").textValue();
          String description = injectNode.get("inject_description").textValue();
          String country = injectNode.get("inject_country").textValue();
          String city = injectNode.get("inject_city").textValue();
          String injectorContractId = null;
          JsonNode injectContractNode = injectNode.get("inject_injector_contract");
          if (injectContractNode != null) {
            injectorContractId = injectContractNode.get("injector_contract_id").textValue();
          }
          // If contract is not know, inject can't be imported
          String content = handleInjectContent(baseIds, injectorContractId, injectNode);
          Long dependsDuration = injectNode.get("inject_depends_duration").asLong();
          boolean allTeams = injectNode.get("inject_all_teams").booleanValue();
          if (hasText(exerciseId)) {
            injectRepository.importSaveForExercise(
                injectId,
                title,
                description,
                country,
                city,
                injectorContractId,
                allTeams,
                true,
                exerciseId,
                dependsDuration,
                content);
          } else if (hasText(scenarioId)) {
            injectRepository.importSaveForScenario(
                injectId,
                title,
                description,
                country,
                city,
                injectorContractId,
                allTeams,
                true,
                scenarioId,
                dependsDuration,
                content);
          }
          baseIds.put(id, new BaseHolder(injectId));
          originalIds.add(id);

          // Once the inject has been saved, we deal with the dependencies
          ArrayNode injectDependsOn = (ArrayNode) injectNode.get("inject_depends_on");
          for (JsonNode dependsOnNode : injectDependsOn) {
            // If there are dependencies where the added inject is the children, we add it to the
            // database
            if (id.equals(
                dependsOnNode.get("dependency_relationship").get("inject_children_id").asText())) {
              InjectDependencyInput dependency =
                  mapper.convertValue(dependsOnNode, InjectDependencyInput.class);

              Optional<Inject> injectParent =
                  injectRepository.findById(
                      baseIds.get(dependency.getRelationship().getInjectParentId()).getId());
              Optional<Inject> injectChildren =
                  injectRepository.findById(
                      baseIds.get(dependency.getRelationship().getInjectChildrenId()).getId());

              if (injectParent.isPresent() && injectChildren.isPresent()) {
                InjectDependency injectDependency = new InjectDependency();
                injectDependency.getCompositeId().setInjectParent(injectParent.get());
                injectDependency.getCompositeId().setInjectChildren(injectChildren.get());
                injectDependency.setInjectDependencyCondition(dependency.getConditions());
                injectDependenciesRepository.save(injectDependency);
              }
            }
          }
          // Tags
          List<String> injectTagIds = resolveJsonIds(injectNode, "inject_tags");
          injectTagIds.forEach(
              tagId -> {
                Base base = baseIds.get(tagId);
                if (base == null || base.getId() == null) {
                  return;
                }
                injectRepository.addTag(injectId, base.getId());
              });
          // Teams
          List<String> injectTeamIds = resolveJsonIds(injectNode, "inject_teams");
          injectTeamIds.forEach(
              teamId -> {
                Base base = baseIds.get(teamId);
                if (base == null || base.getId() == null) {
                  return;
                }
                injectRepository.addTeam(injectId, base.getId());
              });
          // Documents
          List<JsonNode> injectDocuments =
              resolveJsonElements(injectNode, "inject_documents").toList();
          injectDocuments.forEach(
              jsonNode -> {
                String docId = jsonNode.get("document_id").textValue();
                if (!hasText(docId)) {
                  String documentId = baseIds.get(docId).getId();
                  boolean docAttached = jsonNode.get("document_attached").booleanValue();
                  injectDocumentRepository.addInjectDoc(injectId, documentId, docAttached);
                } else {
                  log.warning("Missing document in the exercise_documents property");
                }
              });
        });
    // Looking for children of created injects
    List<JsonNode> childInjects =
        allInjects.stream()
            .filter(
                jsonNode -> {
                  ArrayNode injectDependsOn = (ArrayNode) jsonNode.get("inject_depends_on");

                  // We're getting the parents of this inject
                  List<String> parents =
                      StreamSupport.stream(injectDependsOn.spliterator(), false)
                          .map(
                              dependency ->
                                  dependency
                                      .get("dependency_relationship")
                                      .get("inject_parent_id")
                                      .asText())
                          .toList();

                  // If the parents have been created in this pass, we need to take care of the
                  // children now
                  return originalIds.stream().anyMatch(parents::contains);
                })
            .toList();
    if (!childInjects.isEmpty()) {
      importInjects(baseIds, exerciseId, scenarioId, childInjects, allInjects);
    }
  }

  private void importVariables(
      JsonNode importNode,
      Exercise savedExercise,
      Scenario savedScenario,
      Map<String, Base> baseIds) {
    Optional<Iterator<JsonNode>> variableNodesOpt = Optional.empty();
    if (ofNullable(importNode.get(EXERCISE_VARIABLES)).isPresent()) {
      variableNodesOpt = ofNullable(importNode.get(EXERCISE_VARIABLES)).map(JsonNode::elements);
    } else if (ofNullable(importNode.get(SCENARIO_VARIABLES)).isPresent()) {
      variableNodesOpt = ofNullable(importNode.get(SCENARIO_VARIABLES)).map(JsonNode::elements);
    }
    variableNodesOpt.ifPresent(
        variableNodes ->
            variableNodes.forEachRemaining(
                variableNode -> {
                  String id = VariableWithValueMixin.getId(variableNode);
                  Variable variable = VariableWithValueMixin.build(variableNode);
                  if (savedExercise != null) {
                    variable.setExercise(savedExercise);
                  } else if (savedScenario != null) {
                    variable.setScenario(savedScenario);
                  }
                  Variable variableSaved = this.variableRepository.save(variable);
                  baseIds.put(id, variableSaved);
                }));
  }

  private String getNodeValue(JsonNode importNode) {
    return Optional.ofNullable(importNode).map(JsonNode::textValue).orElse(null);
  }

  private static class BaseHolder implements Base {

    private String id;

    public BaseHolder(String id) {
      this.id = id;
    }

    @Override
    public String getId() {
      return id;
    }

    @Override
    public void setId(String id) {
      this.id = id;
    }
  }
}
