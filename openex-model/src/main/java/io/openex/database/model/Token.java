package io.openex.database.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.openex.helper.MonoIdDeserializer;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Getter
@Entity
@Table(name = "tokens")
public class Token implements Base {

    public static final String ADMIN_TOKEN_UUID = "0d17ce9a-f3a8-4c6d-9721-c98dc3dc023f";

    @Setter
    @Id
    @Column(name = "token_id")
    @GeneratedValue(generator = "UUID")
    @UuidGenerator
    @JsonProperty("token_id")
    private String id;

    @Setter
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "token_user")
    @JsonSerialize(using = MonoIdDeserializer.class)
    @JsonProperty("token_user")
    private User user;

    @Setter
    @Column(name = "token_value")
    @JsonProperty("token_value")
    private String value;

    @Setter
    @Column(name = "token_created_at")
    @JsonProperty("token_created_at")
    private Instant created;

    @Override
    public boolean isUserHasAccess(User user) {
        return this.user.equals(user);
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
