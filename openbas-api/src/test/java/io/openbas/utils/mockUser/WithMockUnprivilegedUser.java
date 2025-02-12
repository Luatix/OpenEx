package io.openbas.utils.mockUser;

import static io.openbas.utils.mockUser.WithMockUnprivilegedUserSecurityContextFactory.MOCK_USER_UNPRIVILEGED_EMAIL;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import org.springframework.security.test.context.support.WithSecurityContext;

@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockUnprivilegedUserSecurityContextFactory.class)
public @interface WithMockUnprivilegedUser {
  String email() default MOCK_USER_UNPRIVILEGED_EMAIL;
}
