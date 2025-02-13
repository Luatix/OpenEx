package io.openbas.authorisation;

import io.openbas.database.repository.ExerciseRepository;
import io.openbas.database.repository.InjectRepository;
import io.openbas.database.repository.ScenarioRepository;
import io.openbas.database.repository.UserRepository;
import io.openbas.rest.security.SecurityExpression;
import lombok.Getter;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

@Getter
@Validated
@Service
public class AuthorisationService {
    private final SecurityExpression securityExpression;

    private SecurityExpression createSecurityExpression(InjectRepository injectRepository, ExerciseRepository exerciseRepository, ScenarioRepository scenarioRepository, UserRepository userRepository) {
        return new SecurityExpression(SecurityContextHolder.getContext().getAuthentication(), userRepository, exerciseRepository, scenarioRepository, injectRepository);
    }

    public AuthorisationService(InjectRepository injectRepository, ExerciseRepository exerciseRepository, ScenarioRepository scenarioRepository, UserRepository userRepository) {
        this.securityExpression = createSecurityExpression(injectRepository, exerciseRepository, scenarioRepository, userRepository);
    }
}
