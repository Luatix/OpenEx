package io.openex.database.repository;

import io.openex.database.model.KillChainPhase;
import io.openex.database.model.Team;
import io.openex.database.model.User;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Optional;

@Repository
public interface KillChainPhaseRepository extends CrudRepository<KillChainPhase, String>, JpaSpecificationExecutor<KillChainPhase> {

    @NotNull
    Optional<KillChainPhase> findById(@NotNull String id);

    @Query("select killChainPhase from KillChainPhase killChainPhase where killChainPhase.killChainName = :killChainName and killChainPhase.name = :phaseName")
    KillChainPhase findKillChainPhaseByKillChainNameAndPhaseName( @Param("killChainName") String killChainName,  @Param("phaseName") String phaseName);
}