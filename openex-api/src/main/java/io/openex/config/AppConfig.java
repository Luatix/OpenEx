package io.openex.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.util.StdDateFormat;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.annotation.Resource;

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
  private OpenExConfig openExConfig;

  @Bean
  ObjectMapper openexJsonMapper() {
    ObjectMapper mapper = new ObjectMapper();
    mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    mapper.setDateFormat(new StdDateFormat().withColonInTimeZone(true));
    mapper.registerModule(new Hibernate6Module());
    mapper.registerModule(new Jdk8Module());
    mapper.registerModule(new JavaTimeModule());
    return mapper;
  }

  @Bean
  public OpenAPI openExOpenAPI() {
    return new OpenAPI()
        .info(new Info().title("OpenEX API")
            .description("Software under open source licence designed to plan and conduct exercises")
            .version(this.openExConfig.getVersion())
            .license(new License().name("Apache 2.0").url("https://www.openex.io/")))
        .externalDocs(new ExternalDocumentation()
            .description("OpenEx documentation")
            .url("https://docs.openex.io/"));
  }
}
