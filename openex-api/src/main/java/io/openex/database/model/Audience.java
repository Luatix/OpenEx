package io.openex.database.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.openex.database.audit.ModelBaseListener;
import io.openex.helper.MonoModelDeserializer;
import io.openex.helper.MultiModelDeserializer;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.function.Predicate;

import static java.time.Instant.now;

@Entity
@Table(name = "audiences")
@EntityListeners(ModelBaseListener.class)
public class Audience implements Base {
    @Id
    @Column(name = "audience_id")
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @JsonProperty("audience_id")
    private String id;

    @Column(name = "audience_name")
    @JsonProperty("audience_name")
    private String name;

    @Column(name = "audience_description")
    @JsonProperty("audience_description")
    private String description;

    @Column(name = "audience_enabled")
    @JsonProperty("audience_enabled")
    private boolean enabled = true;

    @ManyToOne
    @JoinColumn(name = "audience_exercise")
    @JsonSerialize(using = MonoModelDeserializer.class)
    @JsonProperty("audience_exercise")
    private Exercise exercise;

    @Column(name = "audience_created_at")
    @JsonProperty("audience_created_at")
    private Instant createdAt = now();

    @Column(name = "audience_updated_at")
    @JsonProperty("audience_updated_at")
    private Instant updatedAt = now();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "audiences_tags",
            joinColumns = @JoinColumn(name = "audience_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @JsonSerialize(using = MultiModelDeserializer.class)
    @JsonProperty("audience_tags")
    @Fetch(FetchMode.SUBSELECT)
    private List<Tag> tags = new ArrayList<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "users_audiences",
            joinColumns = @JoinColumn(name = "audience_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    @JsonSerialize(using = MultiModelDeserializer.class)
    @JsonProperty("audience_users")
    @Fetch(FetchMode.SUBSELECT)
    private List<User> users = new ArrayList<>();

    @JsonProperty("audience_users_number")
    public long getUsersNumber() {
        return getUsers().size();
    }

    // region transient
    @JsonProperty("audience_injects")
    @JsonSerialize(using = MultiModelDeserializer.class)
    public List<Inject> getInjects() {
        Predicate<Inject> selectedInject = inject -> inject.isAllAudiences() || inject.getAudiences().contains(this);
        return getExercise().getInjects().stream().filter(selectedInject).distinct().toList();
    }

    @JsonProperty("audience_injects_number")
    public long getInjectsNumber() {
        return getInjects().size();
    }

    @JsonIgnore
    @Override
    public boolean isUserHasAccess(User user) {
        return getExercise().isUserHasAccess(user);
    }
    // endregion

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public List<Tag> getTags() {
        return tags;
    }

    public void setTags(List<Tag> tags) {
        this.tags = tags;
    }

    public List<User> getUsers() {
        return users;
    }

    public void setUsers(List<User> users) {
        this.users = users;
    }

    public Exercise getExercise() {
        return exercise;
    }

    public void setExercise(Exercise exercise) {
        this.exercise = exercise;
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
