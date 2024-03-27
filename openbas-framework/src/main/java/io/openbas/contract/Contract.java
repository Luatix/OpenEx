package io.openbas.contract;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.openbas.annotation.Queryable;
import io.openbas.contract.fields.ContractElement;
import io.openbas.contract.variables.VariableHelper;
import io.openbas.helper.SupportedLanguage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
public class Contract {

    @NotNull
    @Queryable(searchable = true, sortable = true, filterable = true, property = "type")
    private final ContractConfig config;

    @NotBlank
    @Setter
    @JsonProperty("contract_id")
    private String id;

    @NotEmpty
    @Setter
    @Queryable(searchable = true, filterable = true, sortable = true)
    private Map<SupportedLanguage, String> label;

    @NotNull
    private final boolean manual;

    @NotEmpty
    @Setter
    private List<ContractElement> fields;

    @NotEmpty
    private final List<ContractVariable> variables = new ArrayList<>();

    @NotNull
    private final Map<String, String> context = new HashMap<>();

    @NotEmpty
    @Setter
    @JsonProperty("contract_attack_patterns")
    private List<String> attackPatterns = new ArrayList<>();

    private Contract(
        @NotNull final ContractConfig config,
        @NotBlank final String id,
        @NotEmpty final Map<SupportedLanguage, String> label,
        final boolean manual,
        @NotEmpty final List<ContractElement> fields) {
        this.config = config;
        this.id = id;
        this.label = label;
        this.manual = manual;
        this.fields = fields;

        // Default variables linked to ExecutionContext
        // User variables
        this.variables.add(VariableHelper.userVariable);
        // Exercise variables
        this.variables.add(VariableHelper.exerciceVariable);
        // Teams
        this.variables.add(VariableHelper.teamVariable);
        // Direct uris
        this.variables.addAll(VariableHelper.uriVariables);
    }

    public static Contract manualContract(
        @NotNull final ContractConfig config,
        @NotBlank final String id,
        @NotEmpty final Map<SupportedLanguage, String> label,
        @NotEmpty final List<ContractElement> fields) {
        return new Contract(config, id, label, true, fields);
    }

    public static Contract executableContract(
        @NotNull final ContractConfig config,
        @NotBlank final String id,
        @NotEmpty final Map<SupportedLanguage, String> label,
        @NotEmpty final List<ContractElement> fields) {
        return new Contract(config, id, label, false, fields);
    }

    public void addContext(String key, String value) {
        this.context.put(key, value);
    }

    public void addVariable(ContractVariable variable) {
        variables.add(0, variable);
    }

    public void addAttackPattern(String id) {
        attackPatterns.add(id);
    }
}
