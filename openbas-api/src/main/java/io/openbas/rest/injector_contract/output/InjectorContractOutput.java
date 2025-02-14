package io.openbas.rest.injector_contract.output;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.openbas.database.model.Endpoint.PLATFORM_TYPE;
import io.openbas.database.model.Payload;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.*;

import lombok.Data;

@Data
public class InjectorContractOutput {

  @Schema(description = "Injector contract Id")
  @JsonProperty("injector_contract_id")
  @NotBlank
  private String id;

  @Schema(description = "Labels")
  @JsonProperty("injector_contract_labels")
  private Map<String, String> labels;

  @Schema(description = "Content")
  @JsonProperty("injector_contract_content")
  @NotBlank
  private String content;

  @Schema(description = "Platforms")
  @JsonProperty("injector_contract_platforms")
  private PLATFORM_TYPE[] platforms;

  @Schema(description = "Payload type")
  @JsonProperty("injector_contract_payload_type")
  private String payloadType;

  @Schema(description = "Injector type")
  @JsonProperty("injector_contract_injector_type")
  private String injectorType;

  @Schema(description = "Injector name")
  @JsonProperty("injector_contract_injector_name")
  private String injectorName;

  @Schema(description = "Attack pattern Ids")
  @JsonProperty("injector_contract_attack_patterns")
  private List<String> attackPatterns;

  @Schema(description = "Timestamp when the injector contract was last updated")
  @JsonProperty("injector_contract_updated_at")
  @NotNull
  private Instant updatedAt;

  @JsonProperty("injector_contract_arch")
  private Payload.PAYLOAD_EXECUTION_ARCH arch;

  public InjectorContractOutput(
      String id,
      Map<String, String> labels,
      String content,
      PLATFORM_TYPE[] platforms,
      String payloadType,
      String injectorName,
      String collectorType,
      String injectorType,
      String[] attackPatterns,
      Instant updatedAt,
      Payload.PAYLOAD_EXECUTION_ARCH arch) {
    this.id = id;
    this.labels = labels;
    this.content = content;
    this.platforms = platforms;
    this.payloadType = Optional.ofNullable(collectorType).orElse(payloadType);
    this.injectorName = injectorName;
    this.injectorType = injectorType;
    this.attackPatterns =
        attackPatterns != null ? new ArrayList<>(Arrays.asList(attackPatterns)) : new ArrayList<>();
    this.updatedAt = updatedAt;
    this.arch = arch;
  }
}
