package io.openex.rest.file.form;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class DocumentTagUpdateInput {

    @JsonProperty("tags")
    private List<String> tagIds;

    public List<String> getTagIds() {
        return tagIds;
    }

    public void setTagIds(List<String> tagIds) {
        this.tagIds = tagIds;
    }
}
