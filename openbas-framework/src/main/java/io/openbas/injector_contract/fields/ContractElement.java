package io.openbas.injector_contract.fields;

import io.openbas.injector_contract.ContractType;
import io.openbas.model.LinkedFieldModel;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public abstract class ContractElement {

  private String key;

  private String label;

  private boolean mandatory = true;

  private boolean readOnly = false;

  private List<String> mandatoryGroups;

  private String mandatoryConditionField;

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
