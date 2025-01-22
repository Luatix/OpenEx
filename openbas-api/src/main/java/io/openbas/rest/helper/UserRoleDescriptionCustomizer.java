package io.openbas.rest.helper;

import io.openbas.aop.UserRoleDescription;
import io.openbas.database.model.User;
import io.swagger.v3.oas.models.Operation;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.security.access.annotation.Secured;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;

@Component
public class UserRoleDescriptionCustomizer implements OperationCustomizer {
  @Override
  public Operation customize(Operation operation, HandlerMethod handlerMethod) {
    UserRoleDescription annotation;
    // We check if we have the annotation on the method as it will take priority on the class
    if (handlerMethod.getMethodAnnotation(UserRoleDescription.class) != null) {
      annotation = handlerMethod.getMethodAnnotation(UserRoleDescription.class);
    } else {
      // If not, we check if we have the annotation on the class
      annotation = handlerMethod.getBeanType().getAnnotation(UserRoleDescription.class);
    }
    // If we found any annotation UserRoleDescription
    if (annotation != null) {
      // We get the Secured annotation
      var securedAnnotation = handlerMethod.getMethodAnnotation(Secured.class);
      String description =
          operation.getDescription() == null ? "" : (operation.getDescription() + "<br>");
      // If we found a secured annotation
      if (securedAnnotation != null) {
        // We add the required role in the description
        operation.setDescription(
            description
                + "Required role: **"
                + String.join("** or **", securedAnnotation.value())
                + "**");
      } else if (annotation.needAuthenticated()) {
        // If there are no secured annotation and we need to be authenticated
        // Then we add all the existing role in the description
        operation.setDescription(
            description + "Required role: **" + String.join("** or **", User.ALL_ROLES) + "**");
      } else {
        // If no secured annotation and we don't need authentication, then we show that no roles are
        // required
        operation.setDescription(description + "Required role: none");
      }
    }
    return operation;
  }
}
