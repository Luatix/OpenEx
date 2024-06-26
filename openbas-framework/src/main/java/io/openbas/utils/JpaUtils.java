package io.openbas.utils;

import io.openbas.utils.schema.PropertySchema;
import jakarta.persistence.criteria.*;
import jakarta.validation.constraints.NotNull;

import java.util.Optional;

import static org.springframework.util.StringUtils.hasText;

public class JpaUtils {

  private JpaUtils() {

  }

  public static <T> Expression<String> toPath(
      @NotNull final PropertySchema propertySchema,
      @NotNull final Root<T> root,
      @NotNull final CriteriaBuilder cb) {
    // Join
    if (propertySchema.getJoinTable() != null) {
      PropertySchema.JoinTable joinTable = propertySchema.getJoinTable();
      return root.join(joinTable.getJoinOn(), JoinType.LEFT)
          .get(Optional.ofNullable(propertySchema.getPropertyRepresentative()).orElse("id"));
    }
    // Search on child
    else if (propertySchema.isFilterable() && hasText(propertySchema.getPropertyRepresentative())) {
      return root.get(propertySchema.getName()).get(propertySchema.getPropertyRepresentative());
      // Direct property
    } else {
      return root.get(propertySchema.getName());
    }
  }

  // -- FUNCTION --

  public static <T, U> Expression<String[]> arrayAggOnId(
      @NotNull final CriteriaBuilder cb,
      @NotNull final Join<T, U> join) {
    return cb.function(
        "array_remove",
        String[].class,
        cb.function("array_agg", String[].class, join.get("id")),
        cb.nullLiteral(String.class)
    );
  }

  // -- JOIN --

  public static <X, Y> Join<X, Y> createLeftJoin(Root<X> root, String attributeName) {
    return root.join(attributeName, JoinType.LEFT);
  }

  public static <X, Y> Expression<String[]> createJoinArrayAggOnId(CriteriaBuilder cb, Root<X> root, String attributeName) {
    Join<X, Y> join = createLeftJoin(root, attributeName);
    return arrayAggOnId(cb, join);
  }

}
