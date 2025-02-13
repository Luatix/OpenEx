package io.openbas.database.repository;

import io.openbas.database.model.Endpoint;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
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

  @Query(
      value = "select e.* from assets e where e.endpoint_hostname = :hostname",
      nativeQuery = true)
  List<Endpoint> findByHostname(@NotBlank final @Param("hostname") String hostname);

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

  @Query(
      "SELECT a FROM Inject i"
          + " JOIN i.assets a"
          + " WHERE ("
          + "   :simulationOrScenarioId is NULL AND i.exercise.id is NULL AND i.scenario.id IS NULL"
          + "   OR (i.exercise.id = :simulationOrScenarioId"
          + "   OR i.scenario.id = :simulationOrScenarioId)"
          + " ) AND (:name IS NULL OR a.name iLIKE %:name%)")
  List<Endpoint> findAllBySimulationOrScenarioIdAndName(String simulationOrScenarioId, String name);
}
