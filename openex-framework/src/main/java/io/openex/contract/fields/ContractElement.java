package io.openex.contract.fields;

import io.openex.contract.ContractType;
import io.openex.model.LinkedFieldModel;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public abstract class ContractElement {

    private String key;

    private String label;

    private boolean mandatory = true;

    private boolean expectation = false;

    private List<LinkedFieldModel> linkedFields = new ArrayList<>();

    private List<String> linkedValues = new ArrayList<>();

    public ContractElement(String key, String label) {
        this.key = key;
        this.label = label;
    }

    public void setLinkedFields(List<ContractElement> linkedFields) {
        this.linkedFields = linkedFields.stream().map(LinkedFieldModel::fromField).toList();
    }

    public abstract ContractType getType();
}
