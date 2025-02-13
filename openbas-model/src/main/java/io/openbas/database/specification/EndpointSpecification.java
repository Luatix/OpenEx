package io.openbas.database.specification;

import io.openbas.database.model.Endpoint;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.jpa.domain.Specification;

public class EndpointSpecification {

  private EndpointSpecification() {}

  public static Specification<Endpoint> findEndpointsForInjection() {
    return (root, query, criteriaBuilder) -> {
      query.groupBy(root.get("id"));
      return criteriaBuilder.and(
          criteriaBuilder.isNull(root.get("agents").get("parent")),
          criteriaBuilder.isNull(root.get("agents").get("inject")));
    };
  }

  public static Specification<Endpoint> findEndpointsForExecution() {
    return (root, query, criteriaBuilder) -> {
      query.groupBy(root.get("id"));
      return criteriaBuilder.or(
          criteriaBuilder.isNotNull(root.get("agents").get("parent")),
          criteriaBuilder.isNotNull(root.get("agents").get("inject")));
    };
  }

  public static Specification<Endpoint> findEndpointsForInjectionByHostname(
      @NotBlank final String hostname) {
    Specification<Endpoint> hostnameSpec =
        (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("hostname"), hostname);
    return findEndpointsForInjection().and(hostnameSpec);
  }

  public static Specification<Endpoint> fromIds(@NotNull final List<String> ids) {
    return (root, query, builder) -> root.get("id").in(ids);
  }

  public static Specification<Endpoint> byName(@Nullable final String searchText) {
    return UtilsSpecification.byName(searchText, "name");
  }
}
