package io.openex.rest.exercise.form;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import static io.openex.config.AppConfig.*;

@Setter
@Getter
public class ExerciseUpdateInput {

    @NotBlank(message = MANDATORY_MESSAGE)
    @JsonProperty("exercise_name")
    private String name;

    @JsonProperty("exercise_subtitle")
    private String subtitle;

    @JsonProperty("exercise_description")
    private String description;

    @Email(message = EMAIL_FORMAT)
    @JsonProperty("exercise_mail_from")
    private String replyTo;

    @JsonProperty("exercise_message_header")
    private String header;

    @JsonProperty("exercise_message_footer")
    private String footer;

}
