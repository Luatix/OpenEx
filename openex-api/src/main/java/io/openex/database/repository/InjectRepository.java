package io.openex.database.repository;

import io.openex.database.model.Inject;
import org.jetbrains.annotations.NotNull;
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
public interface InjectRepository extends CrudRepository<Inject, String>, JpaSpecificationExecutor<Inject>, StatisticRepository {

    @NotNull
    Optional<Inject> findById(@NotNull String id);

    @Query(value = "select i from Inject i where i.exercise.id = :exerciseId")
    List<Inject> findAllForExercise(@Param("exerciseId") String exerciseId);

    @Query(value = "select i from Inject i " +
            "join i.documents as doc_rel " +
            "join doc_rel.document as doc " +
            "where doc.id = :documentId and i.exercise.id = :exerciseId")
    List<Inject> findAllForExerciseAndDoc(@Param("exerciseId") String exerciseId, @Param("documentId") String documentId);

    @Modifying
    @Query(value = "insert into injects (inject_id, inject_title, inject_description, inject_country, inject_city," +
            "inject_type, inject_all_audiences, inject_enabled, inject_exercise, inject_depends_from_another, " +
            "inject_depends_duration, inject_content) " +
            "values (:id, :title, :description, :country, :city, :type, :allAudiences, :enabled, :exercise, :dependsOn, :dependsDuration, :content)", nativeQuery = true)
    void importSave(@Param("id") String id,
                    @Param("title") String title,
                    @Param("description") String description,
                    @Param("country") String country,
                    @Param("city") String city,
                    @Param("type") String type,
                    @Param("allAudiences") boolean allAudiences,
                    @Param("enabled") boolean enabled,
                    @Param("exercise") String exerciseId,
                    @Param("dependsOn") String dependsOn,
                    @Param("dependsDuration") Long dependsDuration,
                    @Param("content") String content);

    @Modifying
    @Query(value = "insert into injects_tags (inject_id, tag_id) values (:injectId, :tagId)", nativeQuery = true)
    void addTag(@Param("injectId") String injectId, @Param("tagId") String tagId);

    @Modifying
    @Query(value = "insert into injects_audiences (inject_id, audience_id) values (:injectId, :audienceId)", nativeQuery = true)
    void addAudience(@Param("injectId") String injectId, @Param("audienceId") String audienceId);

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
}
