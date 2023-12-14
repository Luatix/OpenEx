package io.openex.rest.user.form.me;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;

import static io.openex.config.AppConfig.MANDATORY_MESSAGE;

public class UpdateMePasswordInput {

    @NotBlank(message = MANDATORY_MESSAGE)
    @JsonProperty("user_current_password")
    private String currentPassword;

    @NotBlank(message = MANDATORY_MESSAGE)
    @JsonProperty("user_plain_password")
    private String password;

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
