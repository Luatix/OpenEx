package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.hypersistence.utils.hibernate.type.basic.PostgreSQLHStoreType;
import io.openbas.annotation.Queryable;
import io.openbas.database.audit.ModelBaseListener;
import io.openbas.helper.MonoIdDeserializer;
import io.openbas.helper.MultiIdDeserializer;
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
@Table(name = "injectors_contracts")
@EntityListeners(ModelBaseListener.class)
public class InjectorContract implements Base {

    @Getter
    @Id
    @Column(name = "injector_contract_id")
    @JsonProperty("injector_contract_id")
    @NotBlank
    private String id;

    @Getter
    @Column(name = "injector_contract_labels")
    @JsonProperty("injector_contract_labels")
    @Type(PostgreSQLHStoreType.class)
    @Queryable(searchable = true, filterable = true, sortable = true)
    private Map<String, String> labels = new HashMap<>();

    @Getter
    @Column(name = "injector_contract_manual")
    @JsonProperty("injector_contract_manual")
    private Boolean manual;

    @Getter
    @Column(name = "injector_contract_content")
    @JsonProperty("injector_contract_content")
    @NotBlank
    private String content;

    @Getter
    @Column(name = "injector_contract_created_at")
    @JsonProperty("injector_contract_created_at")
    private Instant createdAt = now();

    @Getter
    @Column(name = "injector_contract_updated_at")
    @JsonProperty("injector_contract_updated_at")
    private Instant updatedAt = now();

    @Getter
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "injector_id")
    @JsonSerialize(using = MonoIdDeserializer.class)
    @JsonProperty("injector_contract_injector")
    private Injector injector;

    @Getter
    @Setter
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "injectors_contracts_attack_patterns",
            joinColumns = @JoinColumn(name = "injector_contract_id"),
            inverseJoinColumns = @JoinColumn(name = "attack_pattern_id"))
    @JsonSerialize(using = MultiIdDeserializer.class)
    @JsonProperty("injectors_contracts_attack_patterns")
    @Queryable(filterable = true)
    private List<AttackPattern> attackPatterns = new ArrayList<>();

    @Getter
    @Column(name = "injector_contract_is_used_for_atomic_testing")
    @JsonProperty("injector_contract_is_used_for_atomic_testing")
    private boolean isUsedForAtomicTesting;

    @JsonIgnore
    @Override
    public boolean isUserHasAccess(User user) {
        return user.isAdmin();
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
