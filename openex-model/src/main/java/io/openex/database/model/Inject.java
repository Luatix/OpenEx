package io.openex.database.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.openex.database.audit.ModelBaseListener;
import io.openex.database.converter.ContentConverter;
import io.openex.helper.MonoModelDeserializer;
import io.openex.helper.MultiModelDeserializer;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.time.Instant;
import java.util.*;

import static java.time.Duration.between;
import static java.time.Instant.now;
import static java.util.Optional.ofNullable;

@Entity
@Table(name = "injects")
@EntityListeners(ModelBaseListener.class)
public class Inject implements Base, Injection {

    private static final int SPEED_STANDARD = 1; // Standard speed define by the user.

    public static Comparator<Inject> executionComparator = (o1, o2) -> {
        if (o1.getDate().isPresent() && o2.getDate().isPresent()) {
            return o1.getDate().get().compareTo(o2.getDate().get());
        }
        return o1.getId().compareTo(o2.getId());
    };

    @Id
    @Column(name = "inject_id")
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @JsonProperty("inject_id")
    private String id;

    @Column(name = "inject_title")
    @JsonProperty("inject_title")
    private String title;

    @Column(name = "inject_description")
    @JsonProperty("inject_description")
    private String description;

    @Column(name = "inject_contract")
    @JsonProperty("inject_contract")
    private String contract;

    @Column(name = "inject_country")
    @JsonProperty("inject_country")
    private String country;

    @Column(name = "inject_city")
    @JsonProperty("inject_city")
    private String city;

    @Column(name = "inject_enabled")
    @JsonProperty("inject_enabled")
    private boolean enabled = true;

    @Column(name = "inject_type", updatable = false)
    @JsonProperty("inject_type")
    private String type;

    @Column(name = "inject_content")
    @Convert(converter = ContentConverter.class)
    @JsonProperty("inject_content")
    private ObjectNode content;

    @Column(name = "inject_created_at")
    @JsonProperty("inject_created_at")
    private Instant createdAt = now();

    @Column(name = "inject_updated_at")
    @JsonProperty("inject_updated_at")
    private Instant updatedAt = now();

    @Column(name = "inject_all_audiences")
    @JsonProperty("inject_all_audiences")
    private boolean allAudiences;

    @ManyToOne
    @JoinColumn(name = "inject_exercise")
    @JsonSerialize(using = MonoModelDeserializer.class)
    @JsonProperty("inject_exercise")
    private Exercise exercise;

    @ManyToOne
    @JoinColumn(name = "inject_depends_from_another")
    @JsonSerialize(using = MonoModelDeserializer.class)
    @JsonProperty("inject_depends_on")
    private Inject dependsOn;

    @Column(name = "inject_depends_duration")
    @JsonProperty("inject_depends_duration")
    private Long dependsDuration;

    @ManyToOne(fetch = FetchType.EAGER)
    @JsonSerialize(using = MonoModelDeserializer.class)
    @JoinColumn(name = "inject_user")
    @JsonProperty("inject_user")
    private User user;

    @OneToOne(mappedBy = "inject", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonProperty("inject_status")
    private InjectStatus status;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "injects_tags",
            joinColumns = @JoinColumn(name = "inject_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @JsonSerialize(using = MultiModelDeserializer.class)
    @JsonProperty("inject_tags")
    @Fetch(FetchMode.SUBSELECT)
    private List<Tag> tags = new ArrayList<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "injects_audiences",
            joinColumns = @JoinColumn(name = "inject_id"),
            inverseJoinColumns = @JoinColumn(name = "audience_id"))
    @JsonSerialize(using = MultiModelDeserializer.class)
    @JsonProperty("inject_audiences")
    @Fetch(FetchMode.SUBSELECT)
    private List<Audience> audiences = new ArrayList<>();

    @OneToMany(mappedBy = "inject", fetch = FetchType.EAGER)
    @JsonProperty("inject_documents")
    @Fetch(FetchMode.SUBSELECT)
    private List<InjectDocument> documents = new ArrayList<>();

    @OneToMany(mappedBy = "inject", fetch = FetchType.EAGER)
    @JsonProperty("inject_communications")
    @Fetch(FetchMode.SUBSELECT)
    private List<Communication> communications = new ArrayList<>();

    @OneToMany(mappedBy = "inject", fetch = FetchType.EAGER)
    @JsonProperty("inject_expectations")
    @Fetch(FetchMode.SUBSELECT)
    private List<InjectExpectation> expectations = new ArrayList<>();

    // region transient
    @Transient
    public String getHeader() {
        return ofNullable(getExercise()).map(Exercise::getHeader).orElse("");
    }

    @Transient
    public String getFooter() {
        return ofNullable(getExercise()).map(Exercise::getFooter).orElse("");
    }

    @JsonIgnore
    @Override
    public boolean isUserHasAccess(User user) {
        return getExercise().isUserHasAccess(user);
    }

    @JsonIgnore
    public void clean() {
        setStatus(null);
    }

    @JsonProperty("inject_users_number")
    public long getNumberOfTargetUsers() {
        if (allAudiences) {
            return getExercise().usersNumber();
        }
        return getAudiences().stream()
                .map(Audience::getUsersNumber)
                .reduce(Long::sum).orElse(0L);
    }

    @JsonIgnore
    private Instant computeInjectDate(Instant source, int speed) {
        // Compute origin execution date
        Optional<Inject> dependsOnInject = ofNullable(getDependsOn());
        long duration = ofNullable(getDependsDuration()).orElse(0L) / speed;
        Instant dependingStart = dependsOnInject
                .map(inject -> inject.computeInjectDate(source, speed))
                .orElse(source);
        Instant standardExecutionDate = dependingStart.plusSeconds(duration);
        // Compute execution dates with previous terminated pauses
        long previousPauseDelay = getExercise().getPauses().stream()
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
        return getExercise().getStart()
                .map(source -> computeInjectDate(source, SPEED_STANDARD));
    }

    @JsonIgnore
    public boolean isNotExecuted() {
        return getStatus().isEmpty();
    }

    @JsonIgnore
    public boolean isPastInject() {
        return getDate().map(date -> date.isBefore(now())).orElse(false);
    }

    @JsonIgnore
    public boolean isFutureInject() {
        return getDate().map(date -> date.isAfter(now())).orElse(false);
    }
    // endregion

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public ObjectNode getContent() {
        return content;
    }

    public void setContent(ObjectNode content) {
        this.content = content;
    }

    public String getContract() {
        return contract;
    }

    public void setContract(String contract) {
        this.contract = contract;
    }

    @Override
    public Exercise getExercise() {
        return exercise;
    }

    public void setExercise(Exercise exercise) {
        this.exercise = exercise;
    }

    public Optional<InjectStatus> getStatus() {
        return ofNullable(status);
    }

    public void setStatus(InjectStatus status) {
        this.status = status;
    }

    public boolean isAllAudiences() {
        return allAudiences;
    }

    public void setAllAudiences(boolean allAudiences) {
        this.allAudiences = allAudiences;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Audience> getAudiences() {
        return audiences;
    }

    public void setAudiences(List<Audience> audiences) {
        this.audiences = audiences;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Inject getDependsOn() {
        return dependsOn;
    }

    public void setDependsOn(Inject dependsOn) {
        this.dependsOn = dependsOn;
    }

    public Long getDependsDuration() {
        return dependsDuration;
    }

    public void setDependsDuration(Long dependsDuration) {
        this.dependsDuration = dependsDuration;
    }

    public List<Tag> getTags() {
        return tags;
    }

    public void setTags(List<Tag> tags) {
        this.tags = tags;
    }

    public List<InjectDocument> getDocuments() {
        return documents;
    }

    public void setDocuments(List<InjectDocument> documents) {
        this.documents = documents;
    }

    public List<Communication> getCommunications() {
        return communications;
    }

    public void setCommunications(List<Communication> communications) {
        this.communications = communications;
    }

    public List<InjectExpectation> getExpectations() {
        return expectations;
    }

    public List<InjectExpectationExecution> getUserExpectationsForArticle(User user, MediaArticle article) {
        return expectations.stream()
                .flatMap(expectation -> expectation.getExecutions().stream())
                .filter(execution -> execution.getExpectation().getArticle().equals(article))
                .filter(execution -> execution.getUser().equals(user))
                .toList();
    }

    public void setExpectations(List<InjectExpectation> expectations) {
        this.expectations = expectations;
    }

    @JsonIgnore
    public DryInject toDryInject(Dryrun run) {
        DryInject dryInject = new DryInject();
        dryInject.setRun(run);
        dryInject.setInject(this);
        dryInject.setDate(computeInjectDate(run.getDate(), run.getSpeed()));
        return dryInject;
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

    @JsonProperty("inject_communications_number")
    public long getCommunicationsNumber() {
        return getCommunications().size();
    }

    @JsonProperty("inject_communications_not_ack_number")
    public long getCommunicationsNotAckNumber() {
        return getCommunications().stream().filter(communication -> !communication.getAck()).count();
    }

    @JsonProperty("inject_sent_at")
    public Instant getSentAt() {
        if (getStatus().isPresent()) {
            return getStatus().orElseThrow().getDate();
        }
        return null;
    }
}
