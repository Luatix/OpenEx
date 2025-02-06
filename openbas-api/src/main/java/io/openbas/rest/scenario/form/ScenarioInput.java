package io.openbas.rest.scenario.form;

import static io.openbas.config.AppConfig.MANDATORY_MESSAGE;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.openbas.database.model.Scenario.SEVERITY;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class ScenarioInput {

  @NotBlank(message = MANDATORY_MESSAGE)
  @JsonProperty("scenario_name")
  @Schema(description = "Name of the scenario")
  private String name;

  @JsonProperty("scenario_description")
  @Schema(description = "Description of the scenario")
  private String description;

  @JsonProperty("scenario_subtitle")
  @Schema(description = "Subtitle of the scenario")
  private String subtitle;

  @Nullable
  @JsonProperty("scenario_category")
  @Schema(description = "Category of the scenario")
  private String category;

  @Nullable
  @JsonProperty("scenario_main_focus")
  @Schema(description = "Main focus of the scenario")
  private String mainFocus;

  @Nullable
  @JsonProperty("scenario_severity")
  @Schema(description = "Severity of the scenario")
  private SEVERITY severity;

  @Nullable
  @JsonProperty("scenario_external_reference")
  @Schema(description = "External reference of the scenario")
  private String externalReference;

  @Nullable
  @JsonProperty("scenario_external_url")
  @Schema(description = "External url of the scenario")
  private String externalUrl;

  @JsonProperty("scenario_tags")
  @Schema(description = "Tag IDs of the scenario")
  private List<String> tagIds = new ArrayList<>();

  @JsonProperty("scenario_mail_from")
  @Email
  @Schema(description = "Sender of the mails of the scenario")
  private String from;

  @JsonProperty("scenario_mails_reply_to")
  @Schema(description = "Reply to of the mails of the scenario")
  private List<String> replyTos = new ArrayList<>();

  @JsonProperty("scenario_message_header")
  @Schema(description = "Header of the communications of the scenario")
  private String header;

  @JsonProperty("scenario_message_footer")
  @Schema(description = "Footer of the communications of the scenario")
  private String footer;
}
