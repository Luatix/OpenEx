package io.openbas.database.repository;

import io.openbas.database.model.Agent;
import java.util.List;
import java.util.Optional;
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
  @Query(
      value =
          "SELECT a.* FROM agents a WHERE a.agent_asset IN :assetIds and a.agent_parent is null and a.agent_inject is null;",
      nativeQuery = true)
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
              + "where aga.asset_group_id in :assetGroupIds and a.agent_parent is null and a.agent_inject is null;",
      nativeQuery = true)
  List<Agent> findByAssetGroupIds(@Param("assetGroupIds") List<String> assetGroupIds);

  @Query(
      value =
          "SELECT a.* FROM agents a left join executors ex on a.agent_executor = ex.executor_id "
              + "where a.agent_asset = :assetId and a.agent_executed_by_user = :user and a.agent_deployment_mode = :deployment "
              + "and a.agent_privilege = :privilege and a.agent_parent is null and a.agent_inject is null and ex.executor_type = :executor",
      nativeQuery = true)
  Optional<Agent> findByAssetExecutorUserDeploymentAndPrivilege(
      @Param("assetId") String assetId,
      @Param("user") String user,
      @Param("deployment") String deployment,
      @Param("privilege") String privilege,
      @Param("executor") String executor);
}
