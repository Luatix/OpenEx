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

  /**
   * Returns the agents having the asset ids passed in parameter
   *
   * @param assetIds the asset ids
   * @return the list of agents
   */
  @Query(value = "SELECT a.* FROM agents a WHERE a.agent_asset IN :assetIds ;", nativeQuery = true)
  List<Agent> findByAssetIds(@Param("assetIds") List<String> assetIds);

  /**
   * Returns the agents having the asset group ids passed in parameter
   *
   * @param assetGroupIds the asset group ids
   * @return the list of agents
   */
  @Query(
      value =
          "SELECT a.* FROM agents a left join asset_groups_assets aga ON a.agent_asset = aga.asset_id "
              + "where aga.asset_group_id in :assetGroupIds ;",
      nativeQuery = true)
  List<Agent> findByAssetGroupIds(@Param("assetGroupIds") List<String> assetGroupIds);
}
