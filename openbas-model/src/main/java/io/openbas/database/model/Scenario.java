package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.openbas.annotation.Queryable;
import io.openbas.database.audit.ModelBaseListener;
import io.openbas.helper.InjectStatisticsHelper;
import io.openbas.helper.MultiIdDeserializer;
import io.openbas.helper.MultiModelDeserializer;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static io.openbas.database.model.Grant.GRANT_TYPE.OBSERVER;
import static io.openbas.database.model.Grant.GRANT_TYPE.PLANNER;
import static io.openbas.helper.UserHelper.getUsersByType;
import static java.time.Instant.now;

@Data
@Entity
@Table(name = "scenarios")
@EntityListeners(ModelBaseListener.class)
public class Scenario implements Base {

  @Id
  @UuidGenerator
  @Column(name = "scenario_id")
  @JsonProperty("scenario_id")
  @NotBlank
  private String id;

  @Column(name = "scenario_name")
  @JsonProperty("scenario_name")
  @NotBlank
  @Queryable(searchable = true)
  private String name;

  @Column(name = "scenario_description")
  @JsonProperty("scenario_description")
  private String description;

  @Column(name = "scenario_subtitle")
  @JsonProperty("scenario_subtitle")
  private String subtitle;

  // -- RECURRENCE --

  @Column(name = "scenario_recurrence")
  @JsonProperty("scenario_recurrence")
  private String recurrence;

  @Column(name = "scenario_recurrence_start")
  @JsonProperty("scenario_recurrence_start")
  private Instant recurrenceStart;

  // -- MESSAGE --

  @Column(name = "scenario_message_header")
  @JsonProperty("scenario_message_header")
  private String header = "scenario - scenario - scenario";

  @Column(name = "scenario_message_footer")
  @JsonProperty("scenario_message_footer")
  private String footer = "scenario - scenario - scenario";

  @Column(name = "scenario_mail_from")
  @JsonProperty("scenario_mail_from")
  @Email
  @NotBlank
  private String from;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "scenario_mails_reply_to", joinColumns = @JoinColumn(name = "scenario_id"))
  @Column(name = "scenario_reply_to", nullable=false)
  @JsonProperty("scenario_mails_reply_to")
  private List<String> replyTos = new ArrayList<>();

  // -- AUDIT --

  @Column(name = "scenario_created_at")
  @JsonProperty("scenario_created_at")
  private Instant createdAt = now();

  @Column(name = "scenario_updated_at")
  @JsonProperty("scenario_updated_at")
  private Instant updatedAt = now();

  // -- RELATION --

  @OneToMany(mappedBy = "scenario", fetch = FetchType.EAGER)
  @JsonIgnore
  private List<Grant> grants = new ArrayList<>();

  @OneToMany(mappedBy = "scenario", fetch = FetchType.LAZY)
  @JsonProperty("scenario_injects")
  @JsonSerialize(using = MultiIdDeserializer.class)
  private List<Inject> injects = new ArrayList<>();

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(name = "scenarios_teams",
      joinColumns = @JoinColumn(name = "scenario_id"),
      inverseJoinColumns = @JoinColumn(name = "team_id"))
  @JsonSerialize(using = MultiIdDeserializer.class)
  @JsonProperty("scenario_teams")
  private List<Team> teams = new ArrayList<>();

  @OneToMany(mappedBy = "scenario", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonProperty("scenario_teams_users")
  @JsonSerialize(using = MultiModelDeserializer.class)
  private List<ScenarioTeamUser> teamUsers = new ArrayList<>();

  @OneToMany(mappedBy = "scenario", fetch = FetchType.LAZY)
  @JsonIgnore
  private List<Objective> objectives = new ArrayList<>();

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(name = "scenarios_tags",
      joinColumns = @JoinColumn(name = "scenario_id"),
      inverseJoinColumns = @JoinColumn(name = "tag_id"))
  @JsonSerialize(using = MultiIdDeserializer.class)
  @JsonProperty("scenario_tags")
  private List<Tag> tags = new ArrayList<>();

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(name = "scenarios_documents",
      joinColumns = @JoinColumn(name = "scenario_id"),
      inverseJoinColumns = @JoinColumn(name = "document_id"))
  @JsonSerialize(using = MultiIdDeserializer.class)
  @JsonProperty("scenario_documents")
  private List<Document> documents = new ArrayList<>();

  @OneToMany(mappedBy = "scenario", fetch = FetchType.LAZY)
  @JsonSerialize(using = MultiIdDeserializer.class)
  @JsonProperty("scenario_articles")
  private List<Article> articles = new ArrayList<>();

  @OneToMany(mappedBy = "scenario", fetch = FetchType.LAZY)
  @JsonSerialize(using = MultiIdDeserializer.class)
  @JsonProperty("scenario_lessons_categories")
  private List<LessonsCategory> lessonsCategories = new ArrayList<>();

  // -- SECURITY --

  @JsonProperty("scenario_planners")
  @JsonSerialize(using = MultiIdDeserializer.class)
  public List<User> getPlanners() {
    return getUsersByType(this.getGrants(), PLANNER);
  }

  @JsonProperty("scenario_observers")
  @JsonSerialize(using = MultiIdDeserializer.class)
  public List<User> getObservers() {
    return getUsersByType(this.getGrants(), PLANNER, OBSERVER);
  }

  // -- STATISTICS --

  @JsonProperty("scenario_injects_statistics")
  public Map<String, Long> getInjectStatistics() {
    return InjectStatisticsHelper.getInjectStatistics(this.getInjects());
  }

  @JsonProperty("scenario_all_users_number")
  public long usersAllNumber() {
    return getTeams().stream().mapToLong(Team::getUsersNumber).sum();
  }

  @JsonProperty("scenario_users_number")
  public long usersNumber() {
    return getTeamUsers().stream().map(ScenarioTeamUser::getUser).distinct().count();
  }

  @JsonProperty("scenario_users")
  @JsonSerialize(using = MultiIdDeserializer.class)
  public List<User> getUsers() {
    return getTeamUsers().stream()
        .map(ScenarioTeamUser::getUser)
        .distinct()
        .toList();
  }

  // -- CHANNELS --

  public List<Article> getArticlesForChannel(Channel channel) {
    return this.articles.stream()
        .filter(article -> article.getChannel().equals(channel))
        .toList();
  }

}
