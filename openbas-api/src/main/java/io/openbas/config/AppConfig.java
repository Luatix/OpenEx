package io.openbas.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.openbas.helper.ObjectMapperHelper;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import jakarta.annotation.Resource;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Component
@EnableAsync
@EnableScheduling
@EnableTransactionManagement
public class AppConfig {

  // Validations
  public final static String EMPTY_MESSAGE = "This list cannot be empty.";
  public final static String MANDATORY_MESSAGE = "This value should not be blank.";
  public final static String NOW_FUTURE_MESSAGE = "This date must be now or in the future.";
  public final static String EMAIL_FORMAT = "This field must be a valid email.";
  public final static String PHONE_FORMAT = "This field must start with '+' character and country identifier.";

  @Resource
  private OpenBASConfig openBASConfig;

  @Bean
  ObjectMapper openBASJsonMapper() {
    return ObjectMapperHelper.openBASJsonMapper();
  }

  @Bean
  public OpenAPI openBASOpenAPI() {
    return new OpenAPI()
        .info(new Info().title("OpenBAS API")
            .description("Software under open source licence designed to plan and conduct exercises")
            .version(this.openBASConfig.getVersion())
            .license(new License().name("Apache 2.0").url("https://filigran.io//")))
        .externalDocs(new ExternalDocumentation()
            .description("OpenBAS documentation")
            .url("https://docs.openbas.io/"));
  }
}
