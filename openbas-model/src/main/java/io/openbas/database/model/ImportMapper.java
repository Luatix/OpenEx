package io.openbas.database.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.openbas.database.audit.ModelBaseListener;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "import_mappers")
@EntityListeners(ModelBaseListener.class)
public class ImportMapper implements Base {

    @Id
    @Column(name = "mapper_id")
    @JsonProperty("import_mapper_id")
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "mapper_name")
    @JsonProperty("import_mapper_name")
    @NotBlank
    private String name;

    @Column(name = "mapper_inject_type_column")
    @JsonProperty("import_mapper_inject_type_column")
    private String injectTypeColumn;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name="importer_mapper_id", nullable = false)
    @JsonProperty("inject_importers")
    private List<InjectImporter> injectImporters = new ArrayList<>();

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

    @Override
    public String getId() {
        return this.id.toString();
    }

    @Override
    public void setId(String id) {
        this.id = UUID.fromString(id);
    }
}
