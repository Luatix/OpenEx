package io.openbas.database.model;

import static org.junit.jupiter.api.TestInstance.Lifecycle.PER_CLASS;

import io.openbas.database.raw.RawExercise;
import io.openbas.database.repository.ExerciseRepository;
import io.openbas.utils.fixtures.ExerciseFixture;
import io.openbas.utils.fixtures.composers.ExerciseComposer;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@TestInstance(PER_CLASS)
@Transactional
public class ExerciseTest {
  @Autowired private ExerciseComposer exerciseComposer;
  @Autowired private ExerciseRepository exerciseRepository;
  @Autowired private EntityManager entityManager;

  private final Instant exerciseStartTime = Instant.parse("2012-11-21T04:00:00Z");

  @Test
  @DisplayName("Given a persisted exercise, current pause from raw query is correctly persisted.")
  public void GivenAnExercise_CurrentPauseFromRawQueryIsCorrectlyPersisted() {
    Instant expectedCurrentPauseTime = Instant.parse("2012-11-21T04:05:00Z");
    ExerciseComposer.Composer wrapper =
        exerciseComposer.forExercise(
            ExerciseFixture.createDefaultAttackExercise(exerciseStartTime));
    wrapper.get().setCurrentPause(expectedCurrentPauseTime); // current pause at T+5 minutes

    Exercise expected = wrapper.persist().get();

    // reset JPA
    entityManager.flush();
    entityManager.clear();

    RawExercise dbExercise = exerciseRepository.rawDetailsById(expected.getId());

    Assertions.assertTrue(
        expected.getCurrentPause().isPresent(),
        "Current pause should be present for expected exercise");
    Assertions.assertEquals(expected.getCurrentPause().get(), dbExercise.getExercise_pause_date());
  }
}
