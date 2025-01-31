package io.openbas.database.repository;

import io.openbas.database.model.Agent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AgentRepository
    extends JpaRepository<Agent, String>, JpaSpecificationExecutor<Agent> {

  @Query("SELECT a FROM Agent a WHERE a.asset.id IN :assetIds")
  List<Agent> findAgentsByAssetIds(@Param("assetIds") List<String> assetIds);
}
