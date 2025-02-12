package io.openbas.rest.security;

import io.openbas.database.repository.ExerciseRepository;
import io.openbas.database.repository.InjectRepository;
import io.openbas.database.repository.ScenarioRepository;
import io.openbas.database.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@Configuration
@EnableMethodSecurity(securedEnabled = true)
@RequiredArgsConstructor
public class MethodSecurityConfig {

  private final UserRepository userRepository;
  private final ExerciseRepository exerciseRepository;
  private final ScenarioRepository scenarioRepository;
  private final InjectRepository injectRepository;

  @Bean
  MethodSecurityExpressionHandler methodSecurityExpressionHandler() {
    return new SecurityExpressionHandler(
        this.userRepository,
        this.exerciseRepository,
        this.scenarioRepository,
        this.injectRepository);
  }
}
