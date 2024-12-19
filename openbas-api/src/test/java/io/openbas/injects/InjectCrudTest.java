package io.openbas.injects;

import static io.openbas.injectors.email.EmailContract.EMAIL_DEFAULT;
import static io.openbas.utils.fixtures.ExerciseFixture.getExercise;
import static io.openbas.utils.fixtures.InjectFixture.createDefaultInjectEmail;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.TestInstance.Lifecycle.PER_CLASS;

import io.openbas.IntegrationTest;
import io.openbas.database.model.Exercise;
import io.openbas.database.model.Inject;
import io.openbas.database.model.InjectorContract;
import io.openbas.database.repository.ExerciseRepository;
import io.openbas.database.repository.InjectRepository;
import io.openbas.database.repository.InjectorContractRepository;
import io.openbas.rest.exercise.service.ExerciseService;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@TestInstance(PER_CLASS)
class InjectCrudTest extends IntegrationTest {

  @Autowired private InjectorContractRepository injectorContractRepository;
  @Autowired private InjectRepository injectRepository;

  @Autowired private ExerciseService exerciseService;
  @Autowired private ExerciseRepository exerciseRepository;

  private static String EXERCISE_ID;
  private static String INJECT_ID;

  @AfterAll
  void afterAll() {
    this.exerciseRepository.deleteById(EXERCISE_ID);
    this.injectRepository.deleteById(INJECT_ID);
  }

  @DisplayName("Test inject creation with non null depends duration")
  @Test
  @Transactional
  void createInjectSuccess() {
    // -- PREPARE --
    Exercise exercise = this.exerciseService.createExercise(getExercise());
    assertNotNull(exercise.getId(), "Exercise ID should not be null after creation.");
    EXERCISE_ID = exercise.getId();

    InjectorContract contract =
        injectorContractRepository
            .findById(EMAIL_DEFAULT)
            .orElseThrow(() -> new IllegalStateException("Injector contract not found."));
    Inject inject = createDefaultInjectEmail(contract);
    inject.setExercise(exercise);

    // -- EXECUTE --
    Inject injectCreated = this.injectRepository.save(inject);
    assertNotNull(injectCreated.getId(), "Inject ID should not be null after saving.");
    INJECT_ID = injectCreated.getId();

    // -- VALIDATE --
    assertNotNull(injectCreated.getExercise(), "Inject should reference a valid Exercise.");
    assertNotNull(
        injectRepository.findById(injectCreated.getId()),
        "Inject should be persisted in the database.");
  }
}
