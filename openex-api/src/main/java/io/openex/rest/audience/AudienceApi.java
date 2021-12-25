package io.openex.rest.audience;

import io.openex.database.model.Audience;
import io.openex.database.model.Exercise;
import io.openex.database.model.User;
import io.openex.database.repository.AudienceRepository;
import io.openex.database.repository.ExerciseRepository;
import io.openex.database.repository.UserRepository;
import io.openex.database.specification.AudienceSpecification;
import io.openex.rest.audience.form.UpdateUsersAudienceInput;
import io.openex.rest.audience.form.CreateAudienceInput;
import io.openex.rest.helper.RestBehavior;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.annotation.security.RolesAllowed;
import javax.validation.Valid;

import static io.openex.database.model.User.ROLE_USER;

@RestController
@RolesAllowed(ROLE_USER)
public class AudienceApi extends RestBehavior {

    private ExerciseRepository exerciseRepository;
    private AudienceRepository audienceRepository;
    private UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Autowired
    public void setExerciseRepository(ExerciseRepository exerciseRepository) {
        this.exerciseRepository = exerciseRepository;
    }

    @Autowired
    public void setAudienceRepository(AudienceRepository audienceRepository) {
        this.audienceRepository = audienceRepository;
    }

    @GetMapping("/api/exercises/{exerciseId}/audiences")
    public Iterable<Audience> getAudiences(@PathVariable String exerciseId) {
        return audienceRepository.findAll(AudienceSpecification.fromExercise(exerciseId));
    }

    @PostMapping("/api/exercises/{exerciseId}/audiences")
    public Audience createObjective(@PathVariable String exerciseId, @Valid @RequestBody CreateAudienceInput input) {
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        Audience audience = new Audience();
        audience.setUpdateAttributes(input);
        audience.setExercise(exercise);
        return audienceRepository.save(audience);
    }

    @PutMapping("/api/audiences/{audienceId}/users")
    public Audience updateAudienceUsers(@PathVariable String audienceId, @Valid @RequestBody UpdateUsersAudienceInput input) {
        Audience audience = audienceRepository.findById(audienceId).orElseThrow();
        Iterable<User> audienceUsers = userRepository.findAllById(input.getUserIds());
        audience.setUsers(fromIterable(audienceUsers));
        return audienceRepository.save(audience);
    }
}
