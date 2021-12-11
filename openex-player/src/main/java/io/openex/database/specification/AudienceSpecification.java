package io.openex.database.specification;

import io.openex.database.model.Audience;
import org.springframework.data.jpa.domain.Specification;

public class AudienceSpecification {

    public static Specification<Audience> fromExercise(String exerciseId) {
        return (root, query, cb) -> cb.equal(root.get("exercise").get("id"), exerciseId);
    }
}
