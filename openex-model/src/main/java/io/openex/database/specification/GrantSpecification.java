package io.openex.database.specification;

import io.openex.database.model.Grant;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.domain.Specification;

public class GrantSpecification {

  public static Specification<Grant> fromName(@NotBlank final Grant.GRANT_TYPE name) {
    return (root, query, cb) -> cb.equal(root.get("name"), name);
  }

}
