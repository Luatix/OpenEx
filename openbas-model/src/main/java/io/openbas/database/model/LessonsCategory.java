package io.openbas.database.model;

import static java.time.Instant.now;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.openbas.database.audit.ModelBaseListener;
import io.openbas.helper.MonoIdDeserializer;
import io.openbas.helper.MultiIdListDeserializer;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Getter
@Setter
@Entity
@Table(name = "lessons_categories")
@EntityListeners(ModelBaseListener.class)
public class LessonsCategory implements Base {

  @Id
  @Column(name = "lessons_category_id")
  @GeneratedValue(generator = "UUID")
  @UuidGenerator
  @JsonProperty("lessonscategory_id")
  @NotBlank
  @Schema(description = "ID of the lesson category")
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "lessons_category_exercise")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @JsonProperty("lessons_category_exercise")
  @Schema(description = "Simulation ID of the lesson category")
  private Exercise exercise;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "lessons_category_scenario")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @JsonProperty("lessons_category_scenario")
  @Schema(description = "Scenario ID of the lesson category")
  private Scenario scenario;

  @Column(name = "lessons_category_created_at")
  @JsonProperty("lessons_category_created_at")
  @NotNull
  @Schema(description = "Creation date of the lesson category")
  private Instant created = now();

  @Column(name = "lessons_category_updated_at")
  @JsonProperty("lessons_category_updated_at")
  @NotNull
  @Schema(description = "Update date of the lesson category")
  private Instant updated = now();

  @Column(name = "lessons_category_name")
  @JsonProperty("lessons_category_name")
  @NotBlank
  @Schema(description = "Name of the lesson category")
  private String name;

  @Column(name = "lessons_category_description")
  @JsonProperty("lessons_category_description")
  @Schema(description = "Description of the lesson category")
  private String description;

  @Column(name = "lessons_category_order")
  @JsonProperty("lessons_category_order")
  @Schema(description = "Order of the lesson category")
  private int order;

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "lessons_categories_teams",
      joinColumns = @JoinColumn(name = "lessons_category_id"),
      inverseJoinColumns = @JoinColumn(name = "team_id"))
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("lessons_category_teams")
  @ArraySchema(schema = @Schema(type = "string", description = "Team IDs of the lesson category"))
  private List<Team> teams = new ArrayList<>();

  @OneToMany(mappedBy = "category", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
  @JsonProperty("lessons_category_questions")
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @ArraySchema(
      schema = @Schema(type = "string", description = "Question IDs of the lesson category"))
  private List<LessonsQuestion> questions = new ArrayList<>();

  // region transient
  @JsonProperty("lessons_category_users")
  @Schema(description = "User IDs of the lesson category")
  public List<String> getUsers() {
    return getTeams().stream().flatMap(team -> team.getUsers().stream().map(User::getId)).toList();
  }

  // endregion

  @Override
  public boolean isUserHasAccess(User user) {
    return getExercise().isUserHasAccess(user);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || !Base.class.isAssignableFrom(o.getClass())) return false;
    Base base = (Base) o;
    return id.equals(base.getId());
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
