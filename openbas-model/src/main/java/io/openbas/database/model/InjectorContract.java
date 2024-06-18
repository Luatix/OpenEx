package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.hypersistence.utils.hibernate.type.array.StringArrayType;
import io.hypersistence.utils.hibernate.type.basic.PostgreSQLHStoreType;
import io.openbas.annotation.Queryable;
import io.openbas.database.audit.ModelBaseListener;
import io.openbas.database.converter.ContentConverter;
import io.openbas.helper.MonoIdDeserializer;
import io.openbas.helper.MultiIdListDeserializer;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.*;

import static java.time.Instant.now;

@Getter
@Setter
@Entity
@Table(name = "injectors_contracts")
@EntityListeners(ModelBaseListener.class)
public class InjectorContract implements Base {

    @Id
    @Column(name = "injector_contract_id")
    @JsonProperty("injector_contract_id")
    @NotBlank
    private String id;

    @Column(name = "injector_contract_labels")
    @JsonProperty("injector_contract_labels")
    @Type(PostgreSQLHStoreType.class)
    @Queryable(searchable = true, filterable = true, sortable = true)
    private Map<String, String> labels = new HashMap<>();

    @Column(name = "injector_contract_manual")
    @JsonProperty("injector_contract_manual")
    private Boolean manual;

    @Column(name = "injector_contract_content")
    @JsonProperty("injector_contract_content")
    @NotBlank
    private String content;

    @Column(name = "injector_contract_content", insertable=false, updatable=false)
    @Convert(converter = ContentConverter.class)
    private ObjectNode convertedContent;

    @Column(name = "injector_contract_custom")
    @JsonProperty("injector_contract_custom")
    private Boolean custom = false;

    @Column(name = "injector_contract_needs_executor")
    @JsonProperty("injector_contract_needs_executor")
    private Boolean needsExecutor = false;

    @Type(StringArrayType.class)
    @Column(name = "injector_contract_platforms", columnDefinition = "text[]")
    @JsonProperty("injector_contract_platforms")
    private String[] platforms = new String[0];

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "injector_contract_payload")
    @JsonProperty("injector_contract_payload")
    private Payload payload;

    @Column(name = "injector_contract_created_at")
    @JsonProperty("injector_contract_created_at")
    private Instant createdAt = now();

    @Column(name = "injector_contract_updated_at")
    @JsonProperty("injector_contract_updated_at")
    private Instant updatedAt = now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "injector_id")
    @JsonSerialize(using = MonoIdDeserializer.class)
    @JsonProperty("injector_contract_injector")
    @Queryable(filterable = true, property = "id")
    private Injector injector;

    @Setter
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "injectors_contracts_attack_patterns",
            joinColumns = @JoinColumn(name = "injector_contract_id"),
            inverseJoinColumns = @JoinColumn(name = "attack_pattern_id"))
    @JsonSerialize(using = MultiIdListDeserializer.class)
    @JsonProperty("injector_contract_attack_patterns")
    @Queryable(searchable = true, filterable = true, property = "externalId")
    private List<AttackPattern> attackPatterns = new ArrayList<>();

    @Column(name = "injector_contract_atomic_testing")
    @JsonProperty("injector_contract_atomic_testing")
    @Queryable(filterable = true)
    private boolean isAtomicTesting;

    @Column(name = "injector_contract_import_available")
    @JsonProperty("injector_contract_import_available")
    @Queryable(filterable = true)
    private boolean isImportAvailable;

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
