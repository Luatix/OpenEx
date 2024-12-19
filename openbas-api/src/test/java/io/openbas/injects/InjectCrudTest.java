package io.openbas.injects;

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

import static io.openbas.injectors.email.EmailContract.EMAIL_DEFAULT;
import static io.openbas.utils.fixtures.ExerciseFixture.getExercise;
import static io.openbas.utils.fixtures.InjectFixture.createDefaultInjectEmail;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.TestInstance.Lifecycle.PER_CLASS;

@TestInstance(PER_CLASS)
class InjectCrudTest extends IntegrationTest {

  @Autowired
  private InjectorContractRepository injectorContractRepository;
  @Autowired
  private InjectRepository injectRepository;

  @Autowired
  private ExerciseService exerciseService;
  @Autowired
  private ExerciseRepository exerciseRepository;

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
    EXERCISE_ID = exercise.getId();
    InjectorContract contract = injectorContractRepository.findById(EMAIL_DEFAULT).orElseThrow();
    Inject inject = createDefaultInjectEmail(contract);

    // -- EXECUTE --
    Inject injectCreated = this.injectRepository.save(inject);
    INJECT_ID = injectCreated.getId();
    assertNotNull(injectCreated);
  }
}
