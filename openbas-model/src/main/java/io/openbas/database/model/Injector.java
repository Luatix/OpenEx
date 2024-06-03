package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.hypersistence.utils.hibernate.type.array.StringArrayType;
import io.hypersistence.utils.hibernate.type.basic.PostgreSQLHStoreType;
import io.openbas.annotation.Queryable;
import io.openbas.database.audit.ModelBaseListener;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.*;

import static java.time.Instant.now;

@Setter
@Entity
@Table(name = "injectors")
@EntityListeners(ModelBaseListener.class)
public class Injector implements Base {

    @Getter
    @Id
    @Column(name = "injector_id")
    @JsonProperty("injector_id")
    @NotBlank
    private String id;

    @Getter
    @Column(name = "injector_name")
    @JsonProperty("injector_name")
    @NotBlank
    private String name;

    @Getter
    @Column(name = "injector_type")
    @JsonProperty("injector_type")
    @NotBlank
    private String type;

    @Getter
    @Column(name = "injector_category")
    @JsonProperty("injector_category")
    private String category;

    @Getter
    @Column(name = "injector_external")
    @JsonProperty("injector_external")
    private boolean external = false;

    @Getter
    @Column(name = "injector_custom_contracts")
    @JsonProperty("injector_custom_contracts")
    private boolean customContracts = false;

    @Getter
    @Column(name = "injector_executor_commands")
    @JsonProperty("injector_executor_commands")
    @Type(PostgreSQLHStoreType.class)
    private Map<String, String> executorCommands = new HashMap<>();

    @Getter
    @Column(name = "injector_executor_clear_commands")
    @JsonProperty("injector_executor_clear_commands")
    @Type(PostgreSQLHStoreType.class)
    private Map<String, String> executorClearCommands = new HashMap<>();

    @Getter
    @Column(name = "injector_payloads")
    @JsonProperty("injector_payloads")
    private boolean payloads = false;

    @Getter
    @Column(name = "injector_created_at")
    @JsonProperty("injector_created_at")
    private Instant createdAt = now();

    @Getter
    @Column(name = "injector_updated_at")
    @JsonProperty("injector_updated_at")
    private Instant updatedAt = now();

    @Getter
    @OneToMany(mappedBy = "injector", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<InjectorContract> contracts = new ArrayList<>();

    @JsonIgnore
    @Override
    public boolean isUserHasAccess(User user) {
        return user.isAdmin();
    }

    @Override
    public String toString() {
        return name;
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
