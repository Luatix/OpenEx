package io.openex.database.repository;

import io.openex.database.model.InjectStatus;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Optional;

@Repository
public interface InjectStatusRepository extends CrudRepository<InjectStatus, String>, JpaSpecificationExecutor<InjectStatus> {

    @NotNull
    Optional<InjectStatus> findById(@NotNull String id);

    @Query(value = "select c from InjectStatus c where c.name = 'PENDING' and c.inject.type = :injectType and c.asyncIds is not null")
    List<InjectStatus> pendingForInjectType(@Param("injectType") String injectType);
}
