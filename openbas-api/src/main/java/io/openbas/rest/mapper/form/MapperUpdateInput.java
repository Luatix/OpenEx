package io.openbas.rest.mapper.form;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static io.openbas.config.AppConfig.MANDATORY_MESSAGE;

@Getter
@Setter
public class MapperUpdateInput {
    @Getter
    @JsonProperty("contract_manual")
    private boolean manual = false;

    @Getter
    @JsonProperty("contract_labels")
    private Map<String, String> labels;

    @Getter
    @JsonProperty("contract_attack_patterns_ids")
    private List<String> attackPatternsIds = new ArrayList<>();

    @Getter
    @NotBlank(message = MANDATORY_MESSAGE)
    @JsonProperty("contract_content")
    private String content;

    @JsonProperty("is_atomic_testing")
    private boolean isAtomicTesting = true;

    @Getter
    @JsonProperty("contract_platforms")
    private String[] platforms = new String[0];

    public void setManual(boolean manual) {
        this.manual = manual;
    }

    public void setLabels(Map<String, String> labels) {
        this.labels = labels;
    }

    public void setAttackPatternsIds(List<String> attackPatternsIds) {
        this.attackPatternsIds = attackPatternsIds;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public boolean isAtomicTesting() {
        return isAtomicTesting;
    }

    public void setAtomicTesting(boolean atomicTesting) {
        isAtomicTesting = atomicTesting;
    }

    public String[] getPlatforms() {
        return platforms;
    }

    public void setPlatforms(String[] platforms) {
        this.platforms = platforms;
    }
}
