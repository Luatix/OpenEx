package io.openex.database.repository;

import io.openex.database.model.SubObjective;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubObjectiveRepository extends CrudRepository<SubObjective, String>, JpaSpecificationExecutor<SubObjective> {

    List<SubObjective> findByTitle(String title);

    @NotNull
    Optional<SubObjective> findById(@NotNull String id);
}
