package io.openex.database.repository;

import io.openex.database.model.LessonsTemplate;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import javax.validation.constraints.NotNull;
import java.util.Optional;

@Repository
public interface LessonsTemplateRepository extends CrudRepository<LessonsTemplate, String>, JpaSpecificationExecutor<LessonsTemplate> {

    @NotNull
    Optional<LessonsTemplate> findById(@NotNull String id);
}
