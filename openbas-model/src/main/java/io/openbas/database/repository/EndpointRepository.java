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

  @Query(
      value =
          "select e.* from assets e where e.endpoint_hostname = :hostname and e.endpoint_platform = :platform and e.endpoint_arch = :arch",
      nativeQuery = true)
  Optional<Endpoint> findByHostnameArchAndPlatform(
      @NotBlank final @Param("hostname") String hostname,
      @NotBlank final @Param("platform") String platform,
      @NotBlank final @Param("arch") String arch);

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

  @Query(
      value =
          "select asset.* from assets asset "
              + "left join agents agent on asset.asset_id = agent.agent_asset "
              + "where asset.asset_id = :endpointId",
      nativeQuery = true)
  Optional<Endpoint> findByEndpointId(@NotBlank String endpointId);
}
