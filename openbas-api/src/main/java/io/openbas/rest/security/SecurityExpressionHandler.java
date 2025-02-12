package io.openbas.rest.security;

import io.openbas.database.repository.ExerciseRepository;
import io.openbas.database.repository.InjectRepository;
import io.openbas.database.repository.ScenarioRepository;
import io.openbas.database.repository.UserRepository;
import java.util.function.Supplier;
import org.aopalliance.intercept.MethodInvocation;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.authentication.AuthenticationTrustResolver;
import org.springframework.security.authentication.AuthenticationTrustResolverImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityExpressionHandler extends DefaultMethodSecurityExpressionHandler {

  private final AuthenticationTrustResolver trustResolver = new AuthenticationTrustResolverImpl();
  private final UserRepository userRepository;
  private final ExerciseRepository exerciseRepository;
  private final ScenarioRepository scenarioRepository;
  private final InjectRepository injectRepository;

  private SecurityExpression securityExpression;

  // FIXME: note that if the security expression is not set at this point
  // FIXME: a new one is created with the ambient identity
  public SecurityExpression getSecurityExpression() {
    if (securityExpression == null) {
      securityExpression =
          createSecurityExpression(
              SecurityContextHolder.getContext().getAuthentication(),
              userRepository,
              exerciseRepository,
              scenarioRepository,
              injectRepository,
              getPermissionEvaluator(),
              this.trustResolver,
              getRoleHierarchy());
    }
    return securityExpression;
  }

  public SecurityExpressionHandler(
      final UserRepository userRepository,
      final ExerciseRepository exerciseRepository,
      final ScenarioRepository scenarioRepository,
      final InjectRepository injectRepository) {
    this.userRepository = userRepository;
    this.exerciseRepository = exerciseRepository;
    this.scenarioRepository = scenarioRepository;
    this.injectRepository = injectRepository;
  }

  private SecurityExpression createSecurityExpression(
      Authentication authentication,
      UserRepository userRepository,
      ExerciseRepository exerciseRepository,
      ScenarioRepository scenarioRepository,
      InjectRepository injectRepository,
      PermissionEvaluator permissionEvaluator,
      AuthenticationTrustResolver trustResolver,
      RoleHierarchy roleHierarchy) {
    SecurityExpression se =
        new SecurityExpression(
            authentication,
            userRepository,
            exerciseRepository,
            scenarioRepository,
            injectRepository);
    se.setPermissionEvaluator(permissionEvaluator);
    se.setTrustResolver(trustResolver);
    se.setRoleHierarchy(roleHierarchy);
    return se;
  }

  @Override
  public EvaluationContext createEvaluationContext(
      Supplier<Authentication> authentication, MethodInvocation invocation) {
    StandardEvaluationContext context =
        (StandardEvaluationContext) super.createEvaluationContext(authentication, invocation);
    MethodSecurityExpressionOperations delegate =
        (MethodSecurityExpressionOperations) context.getRootObject().getValue();
    assert delegate != null;
    this.securityExpression =
        createSecurityExpression(
            delegate.getAuthentication(),
            userRepository,
            exerciseRepository,
            scenarioRepository,
            injectRepository,
            getPermissionEvaluator(),
            this.trustResolver,
            getRoleHierarchy());
    context.setRootObject(this.securityExpression);
    return context;
  }
}
