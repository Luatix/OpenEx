package io.openex.database.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.openex.helper.MonoModelDeserializer;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "documents")
public class Document implements Base {
    @Id
    @Column(name = "document_id")
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @JsonProperty("document_id")
    private String id;

    @Column(name = "document_name")
    @JsonProperty("document_name")
    private String name;

    @Column(name = "document_description")
    @JsonProperty("document_description")
    private String description;

    @Column(name = "document_path")
    @JsonProperty("document_path")
    private String path;

    @Column(name = "document_type")
    @JsonProperty("document_type")
    private String type;

    @OneToOne
    @JoinTable(name = "documents_exercises",
            joinColumns = @JoinColumn(name = "document_id"),
            inverseJoinColumns = @JoinColumn(name = "exercise_id"))
    @JsonSerialize(using = MonoModelDeserializer.class)
    @JsonProperty("document_exercise")
    private Exercise exercise;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "documents_tags",
            joinColumns = @JoinColumn(name = "document_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @JsonProperty("document_liste_tags")
    @Fetch(value = FetchMode.SUBSELECT)
    private List<Tag> tags = new ArrayList<>();

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

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Exercise getExercise() {
        return exercise;
    }

    public void setExercise(Exercise exercise) {
        this.exercise = exercise;
    }

    public List<Tag> getTags() {
        return tags;
    }

    public void setTags(List<Tag> tags) {
        this.tags = tags;
    }
}
