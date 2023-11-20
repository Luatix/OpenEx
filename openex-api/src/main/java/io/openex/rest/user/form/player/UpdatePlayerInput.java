package io.openex.rest.user.form.player;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

import static io.openex.config.AppConfig.EMAIL_FORMAT;

@Getter
@Setter
public class UpdatePlayerInput {

  @Email(message = EMAIL_FORMAT)
  @NotBlank
  @JsonProperty("user_email")
  private String email;

  @JsonProperty("user_firstname")
  private String firstname;

  @JsonProperty("user_lastname")
  private String lastname;

  @JsonProperty("user_organization")
  private String organizationId;

  @JsonProperty("user_country")
  private String country;

  @JsonProperty("user_phone")
  private String phone;

  @JsonProperty("user_phone2")
  private String phone2;

  @JsonProperty("user_pgp_key")
  private String pgpKey;

  @JsonProperty("user_tags")
  private List<String> tagIds = new ArrayList<>();

}
