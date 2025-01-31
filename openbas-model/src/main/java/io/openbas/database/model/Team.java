package io.openbas.database.model;

import static java.time.Instant.now;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.openbas.annotation.Queryable;
import io.openbas.database.audit.ModelBaseListener;
import io.openbas.helper.MonoIdDeserializer;
import io.openbas.helper.MultiIdListDeserializer;
import io.openbas.helper.MultiIdSetDeserializer;
import io.openbas.helper.MultiModelDeserializer;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Setter
@Getter
@Entity
@Table(name = "teams")
@EntityListeners(ModelBaseListener.class)
@NamedEntityGraphs({
    @NamedEntityGraph(name = "Team.tags", attributeNodes = @NamedAttributeNode("tags"))
})
public class Team implements Base {

  @Id
  @Column(name = "team_id")
  @GeneratedValue(generator = "UUID")
  @UuidGenerator
  @JsonProperty("team_id")
  @NotBlank
  private String id;

  @Column(name = "team_name")
  @JsonProperty("team_name")
  @Queryable(searchable = true, sortable = true)
  @NotBlank
  private String name;

  @Queryable(searchable = true, sortable = true)
  @Column(name = "team_description")
  @JsonProperty("team_description")
  private String description;

  @Column(name = "team_created_at")
  @JsonProperty("team_created_at")
  @NotNull
  private Instant createdAt = now();

  @Queryable(sortable = true)
  @Column(name = "team_updated_at")
  @JsonProperty("team_updated_at")
  @NotNull
  private Instant updatedAt = now();

  @ArraySchema(schema = @Schema(type = "string"))
  @Queryable(filterable = true, dynamicValues = true, path = "tags.id")
  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "teams_tags",
      joinColumns = @JoinColumn(name = "team_id"),
      inverseJoinColumns = @JoinColumn(name = "tag_id"))
  @JsonSerialize(using = MultiIdSetDeserializer.class)
  @JsonProperty("team_tags")
  private Set<Tag> tags = new HashSet<>();

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "team_organization")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @JsonProperty("team_organization")
  @Schema(type = "string")
  private Organization organization;

  @ArraySchema(schema = @Schema(type = "string"))
  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "users_teams",
      joinColumns = @JoinColumn(name = "team_id"),
      inverseJoinColumns = @JoinColumn(name = "user_id"))
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("team_users")
  private List<User> users = new ArrayList<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "exercises_teams",
      joinColumns = @JoinColumn(name = "team_id"),
      inverseJoinColumns = @JoinColumn(name = "exercise_id"))
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("team_exercises")
  private List<Exercise> exercises = new ArrayList<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "scenarios_teams",
      joinColumns = @JoinColumn(name = "team_id"),
      inverseJoinColumns = @JoinColumn(name = "scenario_id"))
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("team_scenarios")
  private List<Scenario> scenarios = new ArrayList<>();

  @Column(name = "team_contextual")
  @JsonProperty("team_contextual")
  private Boolean contextual = false;

  @ArraySchema(schema = @Schema(type = "string"))
  @OneToMany(
      mappedBy = "team",
      fetch = FetchType.LAZY,
      cascade = CascadeType.ALL,
      orphanRemoval = true)
  @JsonProperty("team_exercises_users")
  @JsonSerialize(using = MultiModelDeserializer.class)
  private List<ExerciseTeamUser> exerciseTeamUsers = new ArrayList<>();

  // -- SNAPSHOT --

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("injectSnapshotId")
  @JoinColumn(name = "inject_snapshot_id")
  @JsonProperty("inject_snapshot_id")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @Schema(type = "string")
  private InjectSnapshot snapshot;

  @JsonProperty("team_users_number")
  public long getUsersNumber() {
    return getUsers().size();
  }

  // region transient
  @ArraySchema(schema = @Schema(type = "string"))
  @JsonProperty("team_exercise_injects")
  @JsonSerialize(using = MultiIdListDeserializer.class)
  public List<Inject> getExercisesInjects() {
    Predicate<Inject> selectedInject =
        inject -> inject.isAllTeams() || inject.getTeams().contains(this);
    return getExercises().stream()
        .map(exercise -> exercise.getInjects().stream().filter(selectedInject).distinct().toList())
        .flatMap(List::stream)
        .toList();
  }

  @JsonProperty("team_exercise_injects_number")
  public long getExercisesInjectsNumber() {
    return getExercisesInjects().size();
  }

  @ArraySchema(schema = @Schema(type = "string"))
  @JsonProperty("team_scenario_injects")
  @JsonSerialize(using = MultiIdListDeserializer.class)
  public List<Inject> getScenariosInjects() {
    Predicate<Inject> selectedInject =
        inject -> inject.isAllTeams() || inject.getTeams().contains(this);
    return getScenarios().stream()
        .map(scenario -> scenario.getInjects().stream().filter(selectedInject).distinct().toList())
        .flatMap(List::stream)
        .toList();
  }

  @JsonProperty("team_scenario_injects_number")
  public long getScenariosInjectsNumber() {
    return getScenariosInjects().size();
  }

  @ArraySchema(schema = @Schema(type = "string"))
  @OneToMany(mappedBy = "team", fetch = FetchType.LAZY)
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("team_inject_expectations")
  private List<InjectExpectation> injectExpectations = new ArrayList<>();

  @JsonProperty("team_injects_expectations_number")
  public long getInjectExceptationsNumber() {
    return getInjectExpectations().size();
  }

  @JsonProperty("team_injects_expectations_total_score")
  @NotNull
  public double getInjectExceptationsTotalScore() {
    return getInjectExpectations().stream()
        .filter((inject) -> inject.getScore() != null)
        .mapToDouble(InjectExpectation::getScore)
        .sum();
  }

  @JsonProperty("team_injects_expectations_total_score_by_exercise")
  @NotNull
  public Map<String, Double> getInjectExceptationsTotalScoreByExercise() {
    return getInjectExpectations().stream()
        .filter(
            expectation ->
                Objects.nonNull(expectation.getExercise())
                    && Objects.nonNull(expectation.getScore()))
        .collect(
            Collectors.groupingBy(
                expectation -> expectation.getExercise().getId(),
                Collectors.summingDouble(InjectExpectation::getScore)));
  }

  @JsonProperty("team_injects_expectations_total_expected_score")
  @NotNull
  public double getInjectExceptationsTotalExpectedScore() {
    return getInjectExpectations().stream().mapToDouble(InjectExpectation::getExpectedScore).sum();
  }

  @JsonProperty("team_injects_expectations_total_expected_score_by_exercise")
  @NotNull
  public Map<String, Double> getInjectExpectationsTotalExpectedScoreByExercise() {
    return getInjectExpectations().stream()
        .filter(expectation -> Objects.nonNull(expectation.getExercise()))
        .collect(
            Collectors.groupingBy(
                expectation -> expectation.getExercise().getId(),
                Collectors.summingDouble(InjectExpectation::getExpectedScore)));
  }

  // endregion

  @JsonProperty("team_communications")
  public List<Communication> getCommunications() {
    return getExercisesInjects().stream()
        .flatMap(inject -> inject.getCommunications().stream())
        .distinct()
        .toList();
  }

  public long getUsersNumberInExercise(String exerciseId) {
    return exerciseId == null
        ? 0
        : getExerciseTeamUsers().stream()
            .filter(exerciseTeamUser -> exerciseTeamUser.getExercise().getId().equals(exerciseId))
            .toList()
            .size();
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || !Base.class.isAssignableFrom(o.getClass())) {
      return false;
    }
    Base base = (Base) o;
    return id.equals(base.getId());
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
