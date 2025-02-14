package io.openbas.authorisation;

import io.openbas.database.repository.ExerciseRepository;
import io.openbas.database.repository.InjectRepository;
import io.openbas.database.repository.ScenarioRepository;
import io.openbas.database.repository.UserRepository;
import io.openbas.rest.security.SecurityExpression;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

@Getter
@Validated
@RequiredArgsConstructor
@Service
public class AuthorisationService {
  private final ExerciseRepository exerciseRepository;
  private final UserRepository userRepository;
  private final ScenarioRepository scenarioRepository;
  private final InjectRepository injectRepository;

  public SecurityExpression getSecurityExpression() {
    return new SecurityExpression(
        SecurityContextHolder.getContext().getAuthentication(),
        userRepository,
        exerciseRepository,
        scenarioRepository,
        injectRepository);
  }
}
