package io.openbas.database.repository;

import io.openbas.database.model.Inject;
import io.openbas.database.raw.RawInject;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface InjectRepository extends CrudRepository<Inject, String>, JpaSpecificationExecutor<Inject>,
    StatisticRepository {

  @NotNull
  Optional<Inject> findById(@NotNull String id);

  @NotNull
  Optional<Inject> findWithStatusById(@NotNull String id);

  @Query(value = "select i.* from injects i where i.inject_injector_contract = '49229430-b5b5-431f-ba5b-f36f599b0233'" +
      " and i.inject_content like :challengeId", nativeQuery = true)
  List<Inject> findAllForChallengeId(@Param("challengeId") String challengeId);

  @Query(value = "select i from Inject i " +
      "join i.documents as doc_rel " +
      "join doc_rel.document as doc " +
      "where doc.id = :documentId and i.exercise.id = :exerciseId")
  List<Inject> findAllForExerciseAndDoc(@Param("exerciseId") String exerciseId, @Param("documentId") String documentId);

  @Query(value = "select i from Inject i " +
      "join i.documents as doc_rel " +
      "join doc_rel.document as doc " +
      "where doc.id = :documentId and i.scenario.id = :scenarioId")
  List<Inject> findAllForScenarioAndDoc(@Param("scenarioId") String scenarioId, @Param("documentId") String documentId);

  @Modifying
  @Query(value = "insert into injects (inject_id, inject_title, inject_description, inject_country, inject_city," +
      "inject_injector_contract, inject_all_teams, inject_enabled, inject_exercise, inject_depends_from_another, " +
      "inject_depends_duration, inject_content) " +
      "values (:id, :title, :description, :country, :city, :contract, :allTeams, :enabled, :exercise, :dependsOn, :dependsDuration, :content)", nativeQuery = true)
  void importSaveForExercise(@Param("id") String id,
      @Param("title") String title,
      @Param("description") String description,
      @Param("country") String country,
      @Param("city") String city,
      @Param("contract") String contract,
      @Param("allTeams") boolean allTeams,
      @Param("enabled") boolean enabled,
      @Param("exercise") String exerciseId,
      @Param("dependsOn") String dependsOn,
      @Param("dependsDuration") Long dependsDuration,
      @Param("content") String content);

  @Modifying
  @Query(value = "insert into injects (inject_id, inject_title, inject_description, inject_country, inject_city," +
      "inject_injector_contract, inject_all_teams, inject_enabled, inject_scenario, inject_depends_from_another, " +
      "inject_depends_duration, inject_content) " +
      "values (:id, :title, :description, :country, :city, :contract, :allTeams, :enabled, :scenario, :dependsOn, :dependsDuration, :content)", nativeQuery = true)
  void importSaveForScenario(@Param("id") String id,
      @Param("title") String title,
      @Param("description") String description,
      @Param("country") String country,
      @Param("city") String city,
      @Param("contract") String contract,
      @Param("allTeams") boolean allTeams,
      @Param("enabled") boolean enabled,
      @Param("scenario") String scenarioId,
      @Param("dependsOn") String dependsOn,
      @Param("dependsDuration") Long dependsDuration,
      @Param("content") String content);

  @Modifying
  @Query(value = "insert into injects_tags (inject_id, tag_id) values (:injectId, :tagId)", nativeQuery = true)
  void addTag(@Param("injectId") String injectId, @Param("tagId") String tagId);

  @Modifying
  @Query(value = "insert into injects_teams (inject_id, team_id) values (:injectId, :teamId)", nativeQuery = true)
  void addTeam(@Param("injectId") String injectId, @Param("teamId") String teamId);

  @Modifying
  @Query(value = "insert into injects_assets (inject_id, asset_id) values (:injectId, :assetId)", nativeQuery = true)
  void addAsset(@Param("injectId") String injectId, @Param("assetId") String assetId);

  @Modifying
  @Query(value = "insert into injects_asset_groups (inject_id, asset_group_id) values (:injectId, :assetGroupId)", nativeQuery = true)
  void addAssetGroup(@Param("injectId") String injectId, @Param("assetGroupId") String assetGroupId);

  @Override
  @Query("select count(distinct i) from Inject i " +
      "join i.exercise as e " +
      "join e.grants as grant " +
      "join grant.group.users as user " +
      "where user.id = :userId and i.createdAt < :creationDate")
  long userCount(@Param("userId") String userId, @Param("creationDate") Instant creationDate);

  @Override
  @Query("select count(distinct i) from Inject i where i.createdAt < :creationDate")
  long globalCount(@Param("creationDate") Instant creationDate);

  @Query(value = "SELECT injects.inject_id, ine.asset_group_id, ine.team_id, ine.asset_id " +
          "FROM injects " +
          "LEFT JOIN injects_expectations ine ON injects.inject_id = ine.inject_id " +
          "LEFT JOIN injects_teams it ON injects.inject_id = it.inject_id " +
          "LEFT JOIN teams ON teams.team_id = it.team_id " +
          "LEFT JOIN injects_assets ia ON injects.inject_id = ia.inject_id " +
          "LEFT JOIN assets ON assets.asset_id = ia.asset_id " +
          "LEFT JOIN injects_asset_groups iag ON injects.inject_id = iag.inject_id " +
          "LEFT JOIN asset_groups ON asset_groups.asset_group_id = iag.asset_group_id " +
          "WHERE injects.inject_id IN :ids ;", nativeQuery = true)
  List<RawInject> findRawByIds(@Param("ids")List<String> ids);
}
