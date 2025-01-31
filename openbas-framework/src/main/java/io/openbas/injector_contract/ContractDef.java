package io.openbas.injector_contract;

import io.openbas.injector_contract.fields.ContractElement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ContractDef {

  private final List<ContractElement> fields = new ArrayList<>();

  private ContractDef() {
    // private constructor
  }

  public static ContractDef contractBuilder() {
    return new ContractDef();
  }

  public ContractDef addFields(List<ContractElement> fields) {
    this.fields.addAll(fields);
    return this;
  }

  public ContractDef mandatory(ContractElement element) {
    this.fields.add(element);
    return this;
  }

  public ContractDef mandatoryGroup(ContractElement... elements) {
    List<String> keys = Arrays.stream(elements).map(ContractElement::getKey).toList();
    for (ContractElement element : elements) {
      element.setMandatory(false);
      element.setMandatoryGroups(keys);
      this.fields.add(element);
    }
    return this;
  }

  public ContractDef optional(ContractElement element) {
    element.setMandatory(false);
    this.fields.add(element);
    return this;
  }

  /**
   * Add a field that will be mandatory if another field is set
   * @param element element to be mandatory
   * @param conditionalElement if this field is set the element will be mandatory
   * @return
   */
  public ContractDef mandatoryConditional(ContractElement element, ContractElement conditionalElement) {
    element.setMandatoryConditionField(conditionalElement.getKey());
    element.setMandatory(false);
    this.fields.add(element);
    return this;
  }

  public List<ContractElement> build() {
    return this.fields;
  }
}
