package io.openex.database.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.openex.database.audit.ModelBaseListener;
import io.openex.helper.MonoIdDeserializer;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

import static java.time.Instant.now;

@Setter
@Getter
@Entity
@Table(name = "evaluations")
@EntityListeners(ModelBaseListener.class)
public class Evaluation implements Base {
    @Id
    @Column(name = "evaluation_id")
    @GeneratedValue(generator = "UUID")
    @UuidGenerator
    @JsonProperty("evaluation_id")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_objective")
    @JsonSerialize(using = MonoIdDeserializer.class)
    @JsonProperty("evaluation_objective")
    private Objective objective;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_user")
    @JsonSerialize(using = MonoIdDeserializer.class)
    @JsonProperty("evaluation_user")
    private User user;

    @Column(name = "evaluation_score")
    @JsonProperty("evaluation_score")
    private Long score;

    @Column(name = "evaluation_created_at")
    @JsonProperty("evaluation_created_at")
    private Instant created = now();

    @Column(name = "evaluation_updated_at")
    @JsonProperty("evaluation_updated_at")
    private Instant updated = now();

    @Override
    public boolean isUserHasAccess(User user) {
        return getObjective().isUserHasAccess(user);
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
