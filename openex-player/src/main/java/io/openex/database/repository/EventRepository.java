package io.openex.database.repository;

import io.openex.database.model.Event;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EventRepository extends CrudRepository<Event, String>, JpaSpecificationExecutor<Event> {

    @NotNull
    Optional<Event> findById(@NotNull String id);
}
