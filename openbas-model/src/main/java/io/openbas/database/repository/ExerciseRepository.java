package io.openbas.database.repository;

import io.openbas.database.model.Exercise;
import io.openbas.database.raw.RawExercise;
import io.openbas.database.raw.RawGlobalInjectExpectation;
import io.openbas.database.raw.RawInjectExpectation;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface ExerciseRepository extends CrudRepository<Exercise, String>,
    StatisticRepository,
    JpaSpecificationExecutor<Exercise> {

  @NotNull
  Optional<Exercise> findById(@NotNull String id);

  @Query(value = "select e from Exercise e where e.status = 'SCHEDULED' and e.start <= :start")
  List<Exercise> findAllShouldBeInRunningState(@Param("start") Instant start);

  @Query("select distinct e from Exercise e " +
      "join e.grants as grant " +
      "join grant.group.users as user " +
      "where user.id = :userId")
  List<Exercise> findAllGranted(@Param("userId") String userId);

  @Override
  @Query("select count(distinct e) from Exercise e " +
      "join e.grants as grant " +
      "join grant.group.users as user " +
      "where user.id = :userId and e.createdAt > :creationDate")
  long userCount(@Param("userId") String userId, @Param("creationDate") Instant creationDate);

  @Override
  @Query("select count(distinct e) from Exercise e where e.createdAt > :creationDate")
  long globalCount(@Param("creationDate") Instant creationDate);

  @Query("select COALESCE(e.category, 'Unknown'), count(distinct e) "
      + "from Exercise e where e.createdAt > :creationDate  "
      + "group by e.category ")
  List<Object[]> globalCountGroupByCategory(@Param("creationDate") Instant creationDate);

  @Query("select COALESCE(e.category, 'Unknown'), count(distinct e) from Exercise e "
      + "join e.grants as grant "
      + "join grant.group.users as user "
      + "where user.id = :userId and e.createdAt > :creationDate "
      + "group by e.category ")
  List<Object[]> userCountGroupByCategory(@Param("userId") String userId, @Param("creationDate") Instant creationDate);

  @Query("select DATE_TRUNC('week', e.start), count(distinct e) from Exercise e "
      + "where e.createdAt > :creationDate and e.start is not null "
      + "group by DATE_TRUNC('week', e.start) order by DATE_TRUNC('week', e.start)")
  List<Object[]> globalCountGroupByWeek(@Param("creationDate") Instant creationDate);

  @Query("select DATE_TRUNC('week', e.start), count(distinct e) from Exercise e "
      + "join e.grants as grant "
      + "join grant.group.users as user "
      + "where user.id = :userId and e.createdAt > :creationDate and e.start is not null "
      + "group by DATE_TRUNC('week', e.start) order by DATE_TRUNC('week', e.start)")
  List<Object[]> userCountGroupByWeek(@Param("userId") String userId, @Param("creationDate") Instant creationDate);

  @Query(value = "select e.*, se.scenario_id from exercises e " +
      "left join injects as inject on e.exercise_id = inject.inject_exercise " +
      "left join injects_statuses as status on inject.inject_id = status.status_inject and status.status_name != 'PENDING'"
      +
      "left join scenarios_exercises as se on e.exercise_id = se.exercise_id " +
      "where e.exercise_status = 'RUNNING' group by e.exercise_id, se.scenario_id having count(status) = count(inject);", nativeQuery = true)
  List<Exercise> thatMustBeFinished();

  /**
   * Get all the expectations created from a date
   *
   * @param from the date of creation
   * @return the list of expectations
   */
  @Query(value =
      "SELECT ie.inject_expectation_type, ie.inject_expectation_group, ie.inject_expectation_score, ie.inject_expectation_expected_score "
          +
          "FROM injects_expectations ie " +
          "INNER JOIN injects ON ie.inject_id = injects.inject_id " +
          "INNER JOIN exercises ON injects.inject_exercise = exercises.exercise_id " +
          "WHERE exercises.exercise_created_at > :from ;", nativeQuery = true)
  List<RawInjectExpectation> allInjectExpectationsFromDate(@Param("from") Instant from);

  /**
   * Get all the expectations a user can see that were created from a date
   *
   * @param from   the date of creation
   * @param userId the id of the user
   * @return the list of expectations
   */
  @Query(value =
      "SELECT ie.inject_expectation_type, ie.inject_expectation_group, ie.inject_expectation_score, ie.inject_expectation_expected_score "
          +
          "FROM injects_expectations ie " +
          "INNER JOIN injects ON ie.inject_id = injects.inject_id " +
          "INNER JOIN exercises e ON injects.inject_exercise = e.exercise_id " +
          "INNER join grants ON grants.grant_exercise = e.exercise_id " +
          "INNER join groups ON grants.grant_group = groups.group_id " +
          "INNER JOIN users_groups ON groups.group_id = users_groups.group_id " +
          "WHERE e.exercise_created_at > :from " +
          "AND users_groups.user_id = :userId ;", nativeQuery = true)
  List<RawInjectExpectation> allGrantedInjectExpectationsFromDate(@Param("from") Instant from,
      @Param("userId") String userId);

  /**
   * Returns the global expectations that were created from a date
   *
   * @param from the date of creation
   * @return a list of expectations
   */
  @Query(value =
      "SELECT injects.inject_id, ie.inject_expectation_type, ie.inject_expectation_score, ie.inject_expectation_expected_score, injects.inject_title, icap.attack_pattern_id "
          +
          "FROM exercises " +
          "INNER JOIN injects ON exercises.exercise_id = injects.inject_exercise " +
          "LEFT JOIN injects_expectations ie ON injects.inject_id = ie.inject_id " +
          "INNER JOIN injectors_contracts ic ON injects.inject_injector_contract = ic.injector_contract_id " +
          "INNER JOIN injectors_contracts_attack_patterns icap ON ic.injector_contract_id = icap.injector_contract_id "
          +
          "WHERE exercises.exercise_created_at > :from ;", nativeQuery = true)
  Iterable<RawGlobalInjectExpectation> rawGlobalInjectExpectationResultsFromDate(@Param("from") Instant from);

  /**
   * Returns the global expectations that were created from a date and that a user can see
   *
   * @param from   the date of creation
   * @param userId the id of the user
   * @return the list of global expectations
   */
  @Query(value =
      "SELECT ie.inject_expectation_type, ie.inject_expectation_score, ie.inject_expectation_expected_score, injects.inject_title, icap.attack_pattern_id "
          +
          "FROM exercises " +
          "INNER JOIN injects ON exercises.exercise_id = injects.inject_exercise " +
          "LEFT JOIN injects_expectations ie ON exercises.exercise_id = ie.exercise_id " +
          "INNER JOIN injectors_contracts ic ON injects.inject_injector_contract = ic.injector_contract_id " +
          "INNER JOIN injectors_contracts_attack_patterns icap ON ic.injector_contract_id = icap.injector_contract_id "
          +
          "INNER join grants ON grants.grant_exercise = exercises.exercise_id " +
          "INNER join groups ON grants.grant_group = groups.group_id " +
          "INNER JOIN users_groups ON groups.group_id = users_groups.group_id " +
          "WHERE exercises.exercise_created_at > :from " +
          "AND users_groups.user_id = :userId ;", nativeQuery = true)
  Iterable<RawGlobalInjectExpectation> rawGrantedInjectExpectationResultsFromDate(@Param("from") Instant from,
      @Param("userId") String userId);

  /**
   * Get the raw version of the exercises
   *
   * @return the list of exercises
   */
  @Query(value =
      " SELECT ex.exercise_category, ex.exercise_id, ex.exercise_status, ex.exercise_start_date, ex.exercise_name, " +
          " ex.exercise_subtitle, array_agg(et.tag_id) FILTER ( WHERE et.tag_id IS NOT NULL ) as exercise_tags, " +
          " array_agg(injects.inject_id) FILTER ( WHERE injects.inject_id IS NOT NULL ) as inject_ids " +
          "FROM exercises ex " +
          "LEFT JOIN injects_expectations ie ON ex.exercise_id = ie.exercise_id " +
          "LEFT JOIN injects ON ie.inject_id = injects.inject_id " +
          "LEFT JOIN exercises_tags et ON et.exercise_id = ex.exercise_id " +
          "GROUP BY ex.exercise_id ;", nativeQuery = true)
  List<RawExercise> rawAll();

  /**
   * Get the raw version of the exercises a user can see
   *
   * @param userId the id of the user
   * @return the list of exercises
   */
  @Query(value =
      " SELECT ex.exercise_category, ex.exercise_id, ex.exercise_status, ex.exercise_start_date, ex.exercise_name, " +
          " ex.exercise_subtitle, array_agg(et.tag_id) FILTER ( WHERE et.tag_id IS NOT NULL ) as exercise_tags, " +
          " array_agg(injects.inject_id) FILTER ( WHERE injects.inject_id IS NOT NULL ) as inject_ids " +
          "FROM exercises ex " +
          "LEFT JOIN injects_expectations ie ON ex.exercise_id = ie.exercise_id " +
          "LEFT JOIN injects ON ie.inject_id = injects.inject_id " +
          "LEFT JOIN exercises_tags et ON et.exercise_id = ex.exercise_id " +
          "INNER join grants ON grants.grant_exercise = ex.exercise_id " +
          "INNER join groups ON grants.grant_group = groups.group_id " +
          "INNER JOIN users_groups ON groups.group_id = users_groups.group_id " +
          "WHERE users_groups.user_id = :userId " +
          "GROUP BY ex.exercise_id ;", nativeQuery = true)
  List<RawExercise> rawAllGranted(@Param("userId") String userId);

  /**
   * Get the raw version of the exercises a user can see
   *
   * @param exerciseId the id of the user
   * @return the list of exercises
   */
  @Query(value =
      " SELECT ex.exercise_category, ex.exercise_id, ex.exercise_status, ex.exercise_start_date, ex.exercise_name, " +
          " ex.exercise_description, ex.exercise_main_focus, ex.exercise_severity, ex.exercise_start_date, " +
          " ex.exercise_end_date, ex.exercise_message_header, ex.exercise_message_footer, ex.exercise_mail_from, " +
          " ex.exercise_subtitle, ex.exercise_logo_dark, ex.exercise_logo_light, ex.exercise_lessons_anonymized, " +
          " inj.inject_scenario, ex.exercise_created_at, ex.exercise_updated_at, se.scenario_id, ex.exercise_pause_date, "
          +
          " coalesce(array_agg(et.tag_id) FILTER ( WHERE et.tag_id IS NOT NULL ), '{}') as exercise_tags, " +
          " coalesce(array_agg(ed.document_id) FILTER ( WHERE ed.document_id IS NOT NULL ), '{}') as exercise_documents, "
          +
          " coalesce(array_agg(inj.inject_id) FILTER ( WHERE inj.inject_id IS NOT NULL ), '{}') as inject_ids, " +
          " coalesce(array_agg(ext.team_id) FILTER ( WHERE ext.team_id IS NOT NULL ), '{}') as exercise_teams, " +
          " coalesce(array_agg(emrt.exercise_reply_to) FILTER ( WHERE emrt.exercise_reply_to IS NOT NULL ), '{}') as exercise_reply_to, "
          +
          " coalesce(array_agg(pauses.pause_id) FILTER ( WHERE pauses.pause_id IS NOT NULL ), '{}') as exercise_pauses, "
          +
          " coalesce(array_agg(art.article_id) FILTER ( WHERE art.article_id IS NOT NULL ), '{}') as exercise_articles, "
          +
          " coalesce(array_agg(lc.lessons_category_id) FILTER ( WHERE lc.lessons_category_id IS NOT NULL ), '{}') as exercise_lessons_categories, "
          +
          " coalesce(array_agg(ut.user_id) FILTER ( WHERE ut.user_id IS NOT NULL ), '{}') as exercise_users, " +
          " coalesce(array_agg(la.lessons_answer_id) FILTER ( WHERE la.lessons_answer_id IS NOT NULL ), '{}') as lessons_answers, "
          +
          " coalesce(array_agg(ut.user_id) FILTER ( WHERE ut.user_id IS NOT NULL ), '{}') as users, " +
          " coalesce(array_agg(logs.log_id) FILTER ( WHERE logs.log_id IS NOT NULL ), '{}') as logs " +
          "FROM exercises ex " +
          "LEFT JOIN injects_expectations ie ON ex.exercise_id = ie.exercise_id " +
          "LEFT JOIN injects ON ie.inject_id = injects.inject_id " +
          "LEFT JOIN injects inj ON ex.exercise_id = inj.inject_exercise " +
          "LEFT JOIN exercises_tags et ON et.exercise_id = ex.exercise_id " +
          "LEFT JOIN exercise_mails_reply_to emrt ON emrt.exercise_id = ex.exercise_id " +
          "LEFT JOIN exercises_teams ext ON ext.exercise_id = ex.exercise_id " +
          "LEFT JOIN pauses ON pauses.pause_exercise = ex.exercise_id " +
          "LEFT JOIN exercises_documents ed ON ed.exercise_id = ex.exercise_id " +
          "LEFT JOIN articles art ON art.article_exercise = ex.exercise_id " +
          "LEFT JOIN lessons_categories lc ON lc.lessons_category_exercise = ex.exercise_id " +
          "LEFT JOIN lessons_questions lq ON lq.lessons_question_category = lc.lessons_category_id " +
          "LEFT JOIN lessons_answers la ON la.lessons_answer_question = lq.lessons_question_id " +
          "LEFT JOIN scenarios_exercises se ON se.exercise_id = ex.exercise_id " +
          "LEFT JOIN users_teams ut ON ext.team_id = ut.team_id " +
          "LEFT JOIN logs ON logs.log_exercise = ex.exercise_id " +
          "WHERE ex.exercise_id = :exerciseId " +
          "GROUP BY ex.exercise_id, inj.inject_scenario, se.scenario_id ;", nativeQuery = true)
  RawExercise rawDetailsById(@Param("exerciseId") String exerciseId);
}
