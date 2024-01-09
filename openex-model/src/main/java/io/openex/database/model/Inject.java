package io.openex.database.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.openex.database.audit.ModelBaseListener;
import io.openex.database.converter.ContentConverter;
import io.openex.helper.MonoIdDeserializer;
import io.openex.helper.MultiIdDeserializer;
import io.openex.helper.MultiModelDeserializer;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.*;

import static java.time.Duration.between;
import static java.time.Instant.now;
import static java.util.Optional.ofNullable;

@Entity
@Table(name = "injects")
@EntityListeners(ModelBaseListener.class)
public class Inject implements Base, Injection {

    public static final int SPEED_STANDARD = 1; // Standard speed define by the user.

  public static final Comparator<Inject> executionComparator = (o1, o2) -> {
        if (o1.getDate().isPresent() && o2.getDate().isPresent()) {
            return o1.getDate().get().compareTo(o2.getDate().get());
        }
        return o1.getId().compareTo(o2.getId());
    };

    @Getter
    @Setter
    @Id
    @Column(name = "inject_id")
    @GeneratedValue(generator = "UUID")
  @UuidGenerator
    @JsonProperty("inject_id")
    private String id;

    @Getter
    @Setter
    @Column(name = "inject_title")
    @JsonProperty("inject_title")
    private String title;

    @Getter
    @Setter
    @Column(name = "inject_description")
    @JsonProperty("inject_description")
    private String description;

    @Getter
    @Setter
    @Column(name = "inject_contract")
    @JsonProperty("inject_contract")
    private String contract;

    @Getter
    @Setter
    @Column(name = "inject_country")
    @JsonProperty("inject_country")
    private String country;

    @Getter
    @Setter
    @Column(name = "inject_city")
    @JsonProperty("inject_city")
    private String city;

    @Getter
    @Setter
    @Column(name = "inject_enabled")
    @JsonProperty("inject_enabled")
    private boolean enabled = true;

    @Getter
    @Setter
    @Column(name = "inject_type", updatable = false)
    @JsonProperty("inject_type")
    private String type;

    @Getter
    @Setter
    @Column(name = "inject_content")
    @Convert(converter = ContentConverter.class)
    @JsonProperty("inject_content")
    private ObjectNode content;

    @Getter
    @Setter
    @Column(name = "inject_created_at")
    @JsonProperty("inject_created_at")
    private Instant createdAt = now();

    @Getter
    @Setter
    @Column(name = "inject_updated_at")
    @JsonProperty("inject_updated_at")
    private Instant updatedAt = now();

    @Getter
    @Setter
    @Column(name = "inject_all_teams")
    @JsonProperty("inject_all_teams")
    private boolean allTeams;

    @Getter
    @Setter
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inject_exercise")
    @JsonSerialize(using = MonoIdDeserializer.class)
    @JsonProperty("inject_exercise")
    private Exercise exercise;

    @Getter
    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inject_depends_from_another")
    @JsonSerialize(using = MonoIdDeserializer.class)
    @JsonProperty("inject_depends_on")
    private Inject dependsOn;

    @Getter
    @Setter
    @Column(name = "inject_depends_duration")
    @JsonProperty("inject_depends_duration")
    @NotNull
    @Min(value = 0L, message = "The value must be positive")
    private Long dependsDuration;

    @Getter
    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonSerialize(using = MonoIdDeserializer.class)
    @JoinColumn(name = "inject_user")
    @JsonProperty("inject_user")
    private User user;

    // CascadeType.ALL is required here because inject status are embedded
    @Setter
    @OneToOne(mappedBy = "inject", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonProperty("inject_status")
    private InjectStatus status;

    @Getter
    @Setter
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "injects_tags",
            joinColumns = @JoinColumn(name = "inject_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @JsonSerialize(using = MultiIdDeserializer.class)
    @JsonProperty("inject_tags")
    private List<Tag> tags = new ArrayList<>();

    @Getter
    @Setter
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "injects_teams",
            joinColumns = @JoinColumn(name = "inject_id"),
            inverseJoinColumns = @JoinColumn(name = "team_id"))
    @JsonSerialize(using = MultiIdDeserializer.class)
    @JsonProperty("inject_teams")
    private List<Team> teams = new ArrayList<>();

    // CascadeType.ALL is required here because of complex relationships
    @Getter
    @Setter
    @OneToMany(mappedBy = "inject", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonProperty("inject_documents")
    @JsonSerialize(using = MultiModelDeserializer.class)
    private List<InjectDocument> documents = new ArrayList<>();

    // CascadeType.ALL is required here because communications are embedded
    @Getter
    @Setter
    @OneToMany(mappedBy = "inject", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonProperty("inject_communications")
    @JsonSerialize(using = MultiModelDeserializer.class)
    private List<Communication> communications = new ArrayList<>();

    // CascadeType.ALL is required here because expectations are embedded
    @Getter
    @Setter
    @OneToMany(mappedBy = "inject", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonProperty("inject_expectations")
    @JsonSerialize(using = MultiModelDeserializer.class)
    private List<InjectExpectation> expectations = new ArrayList<>();

    // region transient
    @Transient
    public String getHeader() {
        return ofNullable(this.getExercise()).map(Exercise::getHeader).orElse("");
    }

    @Transient
    public String getFooter() {
        return ofNullable(this.getExercise()).map(Exercise::getFooter).orElse("");
    }

    @JsonIgnore
    @Override
    public boolean isUserHasAccess(User user) {
        return this.getExercise().isUserHasAccess(user);
    }

    @JsonIgnore
    public void clean() {
        this.status = null;
        this.communications.clear();
        this.expectations.clear();
    }

    @JsonProperty("inject_users_number")
    public long getNumberOfTargetUsers() {
        if (this.allTeams) {
            return getExercise().usersNumber();
        }
        return getTeams().stream()
                .map(team -> team.getUsersNumberInExercise(getExercise()))
                .reduce(Long::sum).orElse(0L);
    }

    @JsonIgnore
    public Instant computeInjectDate(Instant source, int speed) {
        // Compute origin execution date
        Optional<Inject> dependsOnInject = ofNullable(getDependsOn());
        long duration = ofNullable(getDependsDuration()).orElse(0L) / speed;
        Instant dependingStart = dependsOnInject
                .map(inject -> inject.computeInjectDate(source, speed))
                .orElse(source);
        Instant standardExecutionDate = dependingStart.plusSeconds(duration);
        // Compute execution dates with previous terminated pauses
        long previousPauseDelay = exercise.getPauses().stream()
                .filter(pause -> pause.getDate().isBefore(standardExecutionDate))
                .mapToLong(pause -> pause.getDuration().orElse(0L)).sum();
        Instant afterPausesExecutionDate = standardExecutionDate.plusSeconds(previousPauseDelay);
        // Add current pause duration in date computation if needed
        long currentPauseDelay = exercise.getCurrentPause()
                .map(last -> last.isBefore(afterPausesExecutionDate) ? between(last, now()).getSeconds() : 0L)
                .orElse(0L);
        long globalPauseDelay = previousPauseDelay + currentPauseDelay;
        long minuteAlignModulo = globalPauseDelay % 60;
        long alignedPauseDelay = minuteAlignModulo > 0 ? globalPauseDelay + (60 - minuteAlignModulo) : globalPauseDelay;
        return standardExecutionDate.plusSeconds(alignedPauseDelay);
    }

    @JsonProperty("inject_date")
    public Optional<Instant> getDate() {
        if (this.getExercise().getStatus().equals(Exercise.STATUS.CANCELED)) {
            return Optional.empty();
        }
        return this.getExercise().getStart()
                .map(source -> computeInjectDate(source, SPEED_STANDARD));
    }

    @JsonIgnore
    public boolean isNotExecuted() {
        return this.getStatus().isEmpty();
    }

    @JsonIgnore
    public boolean isPastInject() {
        return this.getDate().map(date -> date.isBefore(now())).orElse(false);
    }

    @JsonIgnore
    public boolean isFutureInject() {
        return this.getDate().map(date -> date.isAfter(now())).orElse(false);
    }
    // endregion

    public Optional<InjectStatus> getStatus() {
        return ofNullable(this.status);
    }

    public List<InjectExpectation> getUserExpectationsForArticle(User user, Article article) {
        return this.expectations.stream()
                .filter(execution -> execution.getType().equals(InjectExpectation.EXPECTATION_TYPE.ARTICLE))
                .filter(execution -> execution.getArticle().equals(article))
                .filter(execution -> execution.getTeam().getUsers().contains(user))
                .toList();
    }

    @JsonIgnore
    public DryInject toDryInject(Dryrun run) {
        DryInject dryInject = new DryInject();
        dryInject.setRun(run);
        dryInject.setInject(this);
        dryInject.setDate(computeInjectDate(run.getDate(), run.getSpeed()));
        return dryInject;
    }

    @JsonProperty("inject_communications_number")
    public long getCommunicationsNumber() {
        return this.getCommunications().size();
    }

    @JsonProperty("inject_communications_not_ack_number")
    public long getCommunicationsNotAckNumber() {
        return this.getCommunications().stream().filter(communication -> !communication.getAck()).count();
    }

    @JsonProperty("inject_sent_at")
    public Instant getSentAt() {
        if (this.getStatus().isPresent()) {
            return this.getStatus().orElseThrow().getDate();
        }
        return null;
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
