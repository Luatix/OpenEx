package io.openbas.database.model;

import static io.openbas.database.model.Grant.GRANT_TYPE.OBSERVER;
import static io.openbas.database.model.Grant.GRANT_TYPE.PLANNER;
import static io.openbas.helper.UserHelper.getUsersByType;
import static java.time.Instant.now;
import static lombok.AccessLevel.NONE;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.openbas.annotation.Queryable;
import io.openbas.database.audit.ModelBaseListener;
import io.openbas.database.model.Endpoint.PLATFORM_TYPE;
import io.openbas.helper.InjectStatisticsHelper;
import io.openbas.helper.MultiIdListDeserializer;
import io.openbas.helper.MultiIdSetDeserializer;
import io.openbas.helper.MultiModelDeserializer;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.*;
import lombok.Data;
import lombok.Getter;
import org.hibernate.annotations.UuidGenerator;

@Data
@Entity
@Table(name = "scenarios")
@EntityListeners(ModelBaseListener.class)
@NamedEntityGraphs({
  @NamedEntityGraph(
      name = "Scenario.tags-injects",
      attributeNodes = {@NamedAttributeNode("tags"), @NamedAttributeNode("injects")})
})
public class Scenario implements Base {

  public enum SEVERITY {
    @JsonProperty("low")
    low,
    @JsonProperty("medium")
    medium,
    @JsonProperty("high")
    high,
    @JsonProperty("critical")
    critical,
  }

  @Id
  @UuidGenerator
  @Column(name = "scenario_id")
  @JsonProperty("scenario_id")
  @NotBlank
  @Schema(description = "Id of the scenario")
  private String id;

  @Column(name = "scenario_name")
  @JsonProperty("scenario_name")
  @Queryable(filterable = true, searchable = true, sortable = true)
  @NotBlank
  @Schema(description = "Name of the scenario")
  private String name;

  @Column(name = "scenario_description")
  @JsonProperty("scenario_description")
  @Schema(description = "Description of the scenario")
  private String description;

  @Column(name = "scenario_subtitle")
  @JsonProperty("scenario_subtitle")
  @Schema(description = "Subtitle of the scenario")
  private String subtitle;

  @Column(name = "scenario_category")
  @JsonProperty("scenario_category")
  @Queryable(filterable = true, sortable = true, dynamicValues = true)
  @Schema(description = "Category of the scenario")
  private String category;

  @Column(name = "scenario_main_focus")
  @JsonProperty("scenario_main_focus")
  @Schema(description = "Main focus of the scenario")
  private String mainFocus;

  @Column(name = "scenario_severity")
  @Enumerated(EnumType.STRING)
  @JsonProperty("scenario_severity")
  @Queryable(filterable = true, sortable = true)
  @Schema(description = "Severity of the scenario")
  private SEVERITY severity;

  @Column(name = "scenario_external_reference")
  @JsonProperty("scenario_external_reference")
  @Schema(description = "External reference of the scenario")
  private String externalReference;

  @Column(name = "scenario_external_url")
  @JsonProperty("scenario_external_url")
  @Schema(description = "External url of the scenario")
  private String externalUrl;

  // -- RECURRENCE --

  @Column(name = "scenario_recurrence")
  @JsonProperty("scenario_recurrence")
  @Queryable(filterable = true)
  @Schema(description = "Recurrence cron-style of the scenario")
  private String recurrence;

  @Column(name = "scenario_recurrence_start")
  @JsonProperty("scenario_recurrence_start")
  @Schema(description = "Start of the recurrence of the scenario")
  private Instant recurrenceStart;

  @Column(name = "scenario_recurrence_end")
  @JsonProperty("scenario_recurrence_end")
  @Schema(description = "End of the recurrence of the scenario")
  private Instant recurrenceEnd;

  // -- MESSAGE --

  @Column(name = "scenario_message_header")
  @JsonProperty("scenario_message_header")
  @Schema(description = "Header of the scenario for mails and communications")
  private String header = "SIMULATION HEADER";

  @Column(name = "scenario_message_footer")
  @JsonProperty("scenario_message_footer")
  @Schema(description = "Footer of the scenario for mails and communications")
  private String footer = "SIMULATION FOOTER";

  @Column(name = "scenario_mail_from")
  @JsonProperty("scenario_mail_from")
  @Email
  @NotBlank
  @Schema(description = "Sender of mails and communications for the scenario")
  private String from;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(
      name = "scenario_mails_reply_to",
      joinColumns = @JoinColumn(name = "scenario_id"))
  @Column(name = "scenario_reply_to", nullable = false)
  @JsonProperty("scenario_mails_reply_to")
  @Schema(description = "'Reply to' of mails and communications for the scenario")
  private List<String> replyTos = new ArrayList<>();

  // -- AUDIT --

  @Column(name = "scenario_created_at")
  @JsonProperty("scenario_created_at")
  @Schema(description = "Creation date of the scenario")
  @NotNull
  private Instant createdAt = now();

  @Column(name = "scenario_updated_at")
  @JsonProperty("scenario_updated_at")
  @NotNull
  @Queryable(filterable = true, sortable = true)
  @Schema(description = "Update date of the scenario")
  private Instant updatedAt = now();

  // -- RELATION --

  @OneToMany(mappedBy = "scenario", fetch = FetchType.EAGER)
  @JsonIgnore
  @Schema(description = "List of grants of the scenario")
  private List<Grant> grants = new ArrayList<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @OneToMany(mappedBy = "scenario", fetch = FetchType.LAZY)
  @JsonProperty("scenario_injects")
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @Getter(NONE)
  private Set<Inject> injects = new HashSet<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "scenarios_teams",
      joinColumns = @JoinColumn(name = "scenario_id"),
      inverseJoinColumns = @JoinColumn(name = "team_id"))
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("scenario_teams")
  @Schema(description = "List of team IDs of the scenario")
  private List<Team> teams = new ArrayList<>();

  @OneToMany(
      mappedBy = "scenario",
      fetch = FetchType.LAZY,
      cascade = CascadeType.ALL,
      orphanRemoval = true)
  @JsonProperty("scenario_teams_users")
  @JsonSerialize(using = MultiModelDeserializer.class)
  @Schema(description = "List of 3-tuple linking team IDs and user IDs to this scenario ID")
  private List<ScenarioTeamUser> teamUsers = new ArrayList<>();

  @OneToMany(mappedBy = "scenario", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
  @JsonIgnore
  @Schema(description = "List of objective of the scenario")
  private List<Objective> objectives = new ArrayList<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "scenarios_tags",
      joinColumns = @JoinColumn(name = "scenario_id"),
      inverseJoinColumns = @JoinColumn(name = "tag_id"))
  @JsonSerialize(using = MultiIdSetDeserializer.class)
  @JsonProperty("scenario_tags")
  @Queryable(filterable = true, dynamicValues = true, path = "tags.id")
  @Schema(description = "List of tag IDs of the scenario")
  private Set<Tag> tags = new HashSet<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "scenarios_documents",
      joinColumns = @JoinColumn(name = "scenario_id"),
      inverseJoinColumns = @JoinColumn(name = "document_id"))
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("scenario_documents")
  @Schema(description = "List of document IDs of the scenario")
  private List<Document> documents = new ArrayList<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @OneToMany(mappedBy = "scenario", fetch = FetchType.LAZY)
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("scenario_articles")
  @Schema(description = "List of article IDs of the scenario")
  private List<Article> articles = new ArrayList<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @OneToMany(mappedBy = "scenario", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("scenario_lessons_categories")
  @Schema(description = "List of article IDs of the scenario")
  private List<LessonsCategory> lessonsCategories = new ArrayList<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @OneToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "scenarios_exercises",
      joinColumns = @JoinColumn(name = "scenario_id"),
      inverseJoinColumns = @JoinColumn(name = "exercise_id"))
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("scenario_exercises")
  @Schema(description = "List of simulation IDs of the scenario")
  private List<Exercise> exercises;

  @Getter
  @Column(name = "scenario_lessons_anonymized")
  @JsonProperty("scenario_lessons_anonymized")
  @Schema(description = "True if the lessons of the scenario are anonymized")
  private boolean lessonsAnonymized = false;

  // -- LESSONS --

  @Schema(description = "List of inject IDs of the scenario")
  public List<Inject> getInjects() {
    return new ArrayList<>(this.injects);
  }

  // -- SECURITY --

  @ArraySchema(schema = @Schema(type = "string"))
  @JsonProperty("scenario_planners")
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @Schema(description = "List of planner IDs of the scenario")
  public List<User> getPlanners() {
    return getUsersByType(this.getGrants(), PLANNER);
  }

  @ArraySchema(schema = @Schema(type = "string"))
  @JsonProperty("scenario_observers")
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @Schema(description = "List of observer IDs of the scenario")
  public List<User> getObservers() {
    return getUsersByType(this.getGrants(), PLANNER, OBSERVER);
  }

  // -- STATISTICS --

  @JsonProperty("scenario_injects_statistics")
  @Schema(description = "Map of statistics by inject IDs of the scenario")
  public Map<String, Long> getInjectStatistics() {
    return InjectStatisticsHelper.getInjectStatistics(this.getInjects());
  }

  @JsonProperty("scenario_all_users_number")
  @Schema(description = "Number of users of the scenario")
  public long usersAllNumber() {
    return getTeams().stream().mapToLong(Team::getUsersNumber).sum();
  }

  @JsonProperty("scenario_users_number")
  @Schema(description = "Number of teams users of the scenario")
  public long usersNumber() {
    return getTeamUsers().stream().map(ScenarioTeamUser::getUser).distinct().count();
  }

  @ArraySchema(schema = @Schema(type = "string"))
  @JsonProperty("scenario_users")
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @Schema(description = "Users of the scenario")
  public List<User> getUsers() {
    return getTeamUsers().stream().map(ScenarioTeamUser::getUser).distinct().toList();
  }

  @JsonProperty("scenario_communications_number")
  @Schema(description = "Number of communications of the scenario")
  public long getCommunicationsNumber() {
    return getInjects().stream().mapToLong(Inject::getCommunicationsNumber).sum();
  }

  // -- CHANNELS --

  public List<Article> getArticlesForChannel(Channel channel) {
    return this.articles.stream().filter(article -> article.getChannel().equals(channel)).toList();
  }

  // -- PLATFORMS --
  @JsonProperty("scenario_platforms")
  @Queryable(filterable = true, path = "injects.injectorContract.platforms", clazz = String[].class)
  @Schema(description = "List of platforms of the scenario")
  public List<PLATFORM_TYPE> getPlatforms() {
    return getInjects().stream()
        .flatMap(
            inject -> inject.getInjectorContract().map(InjectorContract::getPlatforms).stream())
        .flatMap(Arrays::stream)
        .filter(Objects::nonNull)
        .distinct()
        .toList();
  }

  // -- KILL CHAIN PHASES --
  @JsonProperty("scenario_kill_chain_phases")
  @Queryable(
      filterable = true,
      dynamicValues = true,
      path = "injects.injectorContract.attackPatterns.killChainPhases.id")
  @Schema(description = "List of kill chain phase of the scenario")
  public List<KillChainPhase> getKillChainPhases() {
    return getInjects().stream()
        .flatMap(
            inject ->
                inject.getInjectorContract().map(InjectorContract::getAttackPatterns).stream()
                    .flatMap(Collection::stream)
                    .flatMap(attackPattern -> attackPattern.getKillChainPhases().stream()))
        .distinct()
        .toList();
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
