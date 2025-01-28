package io.openbas.database.repository;

import io.openbas.database.model.Endpoint;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EndpointRepository
    extends CrudRepository<Endpoint, String>,
        StatisticRepository,
        JpaSpecificationExecutor<Endpoint> {

  // TODO DGO rework with Stephanya
  @Query(
          value = "select e.* from assets e left join agents a on e.asset_id = a.agent_asset left join executors ex on a.agent_executor = ex.executor_id " +
                  "where e.endpoint_hostname = :hostname and e.endpoint_platform = :platform and e.endpoint_arch = :arch and ex.executor_type = :executor",
          nativeQuery = true)
  Optional<Endpoint> findByHostnameArchAndPlatformWithAgentsByExecutor(@NotBlank final @Param("hostname") String hostname, @NotBlank final @Param("platform") String platform,
                                                   @NotBlank final @Param("arch") String arch, @NotBlank final @Param("executor") String executor);

  @Query(
      value =
          "select e.* from assets e left join agents a on e.asset_id = a.agent_asset where a.agent_external_reference = :externalReference",
      nativeQuery = true)
  Optional<Endpoint> findByExternalReference(@Param("externalReference") String externalReference);

  @Override
  @Query(
      "select COUNT(DISTINCT a) from Inject i "
          + "join i.assets as a "
          + "join i.exercise as e "
          + "join e.grants as grant "
          + "join grant.group.users as user "
          + "where user.id = :userId and i.createdAt > :creationDate")
  long userCount(@Param("userId") String userId, @Param("creationDate") Instant creationDate);

  @Override
  @Query("select count(distinct e) from Endpoint e where e.createdAt > :creationDate")
  long globalCount(@Param("creationDate") Instant creationDate);

  /* For some agents (e.g. Caldera), we have the behavior that secondary agents are created to run the implants, so with this query we only get the first level of the agent and not the secondary ones*/ @Query(
      value =
          "select asset.* from assets asset "
              + "left join agents agent on asset.asset_id = agent.agent_asset "
              + "where agent.agent_parent is null "
              + "AND agent.agent_inject is null "
              + "AND asset.asset_id = :endpointId",
      nativeQuery = true)
  Optional<Endpoint> findByEndpointIdWithFirstLevelOfAgents(@NotBlank String endpointId);
}
