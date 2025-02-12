package io.openbas.rest.settings;

import static io.openbas.database.model.User.ROLE_ADMIN;

import io.openbas.aop.UserRoleDescription;
import io.openbas.rest.helper.RestBehavior;
import io.openbas.rest.settings.form.PolicyInput;
import io.openbas.rest.settings.form.SettingsEnterpriseEditionUpdateInput;
import io.openbas.rest.settings.form.SettingsPlatformWhitemarkUpdateInput;
import io.openbas.rest.settings.form.SettingsUpdateInput;
import io.openbas.rest.settings.form.ThemeInput;
import io.openbas.rest.settings.response.PlatformSettings;
import io.openbas.service.PlatformSettingsService;
import io.swagger.v3.oas.annotations.ExternalDocumentation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/api/settings")
@RestController
@UserRoleDescription
@Tag(
    name = "Settings management",
    description = "Endpoints to manage settings",
    externalDocs =
        @ExternalDocumentation(
            description = "Documentation about settings",
            url = "https://docs.openbas.io/latest/administration/parameters/"))
public class PlatformSettingsApi extends RestBehavior {

  private PlatformSettingsService platformSettingsService;

  @Autowired
  public void setPlatformSettingsService(PlatformSettingsService platformSettingsService) {
    this.platformSettingsService = platformSettingsService;
  }

  @GetMapping()
  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "The list of settings")})
  @Operation(summary = "List settings", description = "Return the settings")
  public PlatformSettings settings() {
    return platformSettingsService.findSettings();
  }

  @Secured(ROLE_ADMIN)
  @PutMapping()
  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "The updated settings")})
  @Operation(summary = "Update settings", description = "Update the settings")
  public PlatformSettings updateBasicConfigurationSettings(
      @Valid @RequestBody SettingsUpdateInput input) {
    return platformSettingsService.updateBasicConfigurationSettings(input);
  }

  @Secured(ROLE_ADMIN)
  @PutMapping("/enterprise_edition")
  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "The updated settings")})
  @Operation(summary = "Update EE settings", description = "Update the enterprise edition settings")
  public PlatformSettings updateSettingsEnterpriseEdition(
      @Valid @RequestBody SettingsEnterpriseEditionUpdateInput input) {
    return platformSettingsService.updateSettingsEnterpriseEdition(input);
  }

  @Secured(ROLE_ADMIN)
  @PutMapping("/platform_whitemark")
  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "The updated settings")})
  @Operation(summary = "Update Whitemark settings", description = "Update the whitemark settings")
  public PlatformSettings updateSettingsPlatformWhitemark(
      @Valid @RequestBody SettingsPlatformWhitemarkUpdateInput input) {
    return platformSettingsService.updateSettingsPlatformWhitemark(input);
  }

  @Secured(ROLE_ADMIN)
  @PutMapping("/theme/light")
  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "The updated settings")})
  @Operation(
      summary = "Update light theme settings",
      description = "Update the light theme settings")
  public PlatformSettings updateThemeLight(@Valid @RequestBody ThemeInput input) {
    return platformSettingsService.updateThemeLight(input);
  }

  @Secured(ROLE_ADMIN)
  @PutMapping("/theme/dark")
  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "The updated settings")})
  @Operation(summary = "Update dark theme settings", description = "Update the dark theme settings")
  public PlatformSettings updateThemeDark(@Valid @RequestBody ThemeInput input) {
    return platformSettingsService.updateThemeDark(input);
  }

  @Secured(ROLE_ADMIN)
  @PutMapping("/policies")
  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "The updated settings")})
  @Operation(summary = "Update policies settings", description = "Update the policies settings")
  public PlatformSettings updateSettingsPolicies(@Valid @RequestBody PolicyInput input) {
    return platformSettingsService.updateSettingsPolicies(input);
  }
}
