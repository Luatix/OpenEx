package io.openbas.database.repository;

import io.openbas.database.model.Agent;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface AgentRepository
    extends CrudRepository<Agent, String>, JpaSpecificationExecutor<Agent> {

  /**
   * Returns the agents having the injectId passed in parameter
   *
   * @param injectId
   * @return the list of agents
   */
  @Query(
      value =
          "SELECT DISTINCT agent.*"
              + " FROM agents agent"
              + " JOIN assets asset ON agent.agent_asset = asset.asset_id"
              + " LEFT JOIN asset_groups_assets asset_groups_assets ON asset_groups_assets.asset_id = asset.asset_id"
              + " LEFT JOIN injects_assets injects_assets ON injects_assets.asset_id = asset.asset_id"
              + " LEFT JOIN injects_asset_groups injects_asset_groups ON injects_asset_groups.asset_group_id = asset_groups_assets.asset_group_id"
              + " LEFT JOIN injects inject ON inject.inject_id = injects_assets.inject_id OR inject.inject_id = injects_asset_groups.inject_id"
              + " WHERE inject.inject_id = :injectId"
              + " AND agent.agent_parent IS NULL"
              + " AND agent.agent_inject IS NULL;",
      nativeQuery = true)
  List<Agent> findByInjectId(@Param("injectId") String injectId);

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

  Optional<Agent> findByExternalReference(String externalReference);

  /**
   * Returns the agents for Caldera execution
   *
   * @return the list of agents
   */
  @Query(
      value =
          "SELECT a.* FROM agents a WHERE a.agent_parent is not null and a.agent_inject is not null;",
      nativeQuery = true)
  List<Agent> findForExecution();

  // TODO : understand why the generic deleteById from Hibernate doesn't work
  @Modifying
  @Query(value = "DELETE FROM agents agent where agent.agent_id = :agentId;", nativeQuery = true)
  @Transactional
  void deleteByAgentId(String agentId);
}
