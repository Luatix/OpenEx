package io.openex.database.repository;

import io.openex.database.model.Tag;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TagRepository extends CrudRepository<Tag, String>, JpaSpecificationExecutor<Tag> {

    @NotNull
    Optional<Tag> findById(@NotNull String id);
}
