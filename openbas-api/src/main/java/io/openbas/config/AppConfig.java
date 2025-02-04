package io.openbas.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.openbas.helper.ObjectMapperHelper;
import io.openbas.telemetry.PyroscopePropertiesConfig;
import io.pyroscope.http.Format;
import io.pyroscope.javaagent.EventType;
import io.pyroscope.javaagent.PyroscopeAgent;
import io.pyroscope.javaagent.config.Config;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import jakarta.annotation.PostConstruct;
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
  public static final String EMPTY_MESSAGE = "This list cannot be empty.";
  public static final String MANDATORY_MESSAGE = "This value should not be blank.";
  public static final String NOW_FUTURE_MESSAGE = "This date must be now or in the future.";
  public static final String EMAIL_FORMAT = "This field must be a valid email.";
  public static final String PHONE_FORMAT =
      "This field must start with '+' character and country identifier.";

  @Resource private OpenBASConfig openBASConfig;
  @Resource private PyroscopePropertiesConfig pyroscopePropertiesConfig;

  @Bean
  ObjectMapper openBASJsonMapper() {
    return ObjectMapperHelper.openBASJsonMapper();
  }

  @Bean
  public OpenAPI openBASOpenAPI() {
    return new OpenAPI()
        .info(
            new Info()
                .title("OpenBAS API")
                .description(
                    "Software under open source licence designed to plan and conduct exercises")
                .version(this.openBASConfig.getVersion())
                .license(new License().name("Apache 2.0").url("https://filigran.io//")))
        .externalDocs(
            new ExternalDocumentation()
                .description("OpenBAS documentation")
                .url("https://docs.openbas.io/"));
  }

  @PostConstruct
  public void init() {
    if (pyroscopePropertiesConfig != null && pyroscopePropertiesConfig.isPyroscopeEnabled()) {
      PyroscopeAgent.start(
          new Config.Builder()
              .setApplicationName(pyroscopePropertiesConfig.getPyroscopeInstanceName())
              .setFormat(Format.JFR)
              .setServerAddress(pyroscopePropertiesConfig.getProfilerServerAddress())
              .setProfilingEvent(
                  EventType.valueOf(pyroscopePropertiesConfig.getProfilerEventType().toUpperCase()))
              .setProfilingAlloc(pyroscopePropertiesConfig.getProfilerAllocSize())
              .setProfilingLock(pyroscopePropertiesConfig.getProfilerLockSize())
              .build());
    }
  }
}
