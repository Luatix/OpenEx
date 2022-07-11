package io.openex.rest.security;

import io.openex.database.model.Exercise;
import io.openex.database.model.User;
import io.openex.database.repository.ExerciseRepository;
import io.openex.database.repository.UserRepository;
import org.springframework.security.access.expression.SecurityExpressionRoot;
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;
import java.util.Optional;

import static io.openex.database.model.User.ROLE_ADMIN;

public class SecurityExpression extends SecurityExpressionRoot implements MethodSecurityExpressionOperations {

    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;
    private Object filterObject;
    private Object returnObject;

    // region utils
    public SecurityExpression(Authentication authentication, UserRepository userRepository, ExerciseRepository exerciseRepository) {
        super(authentication);
        this.exerciseRepository = exerciseRepository;
        this.userRepository = userRepository;
    }

    private User getUser() {
        return (User) this.getPrincipal();
    }

    private boolean isUserHasBypass() {
        User principal = getUser();
        return principal.getAuthorities().stream().map(GrantedAuthority::getAuthority)
                .anyMatch(s -> s.equals(ROLE_ADMIN));
    }
    // endregion

    // region annotations
    @SuppressWarnings("unused")
    public boolean isExercisePlanner(String exerciseId) {
        if (isUserHasBypass()) {
            return true;
        }
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        List<User> planners = exercise.getPlanners();
        Optional<User> planner = planners.stream()
                .filter(user -> user.getId().equals(getUser().getId())).findAny();
        return planner.isPresent();
    }

    @SuppressWarnings("unused")
    public boolean isExerciseObserver(String exerciseId) {
        if (isUserHasBypass()) {
            return true;
        }
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        List<User> observers = exercise.getObservers();
        Optional<User> planner = observers.stream()
                .filter(user -> user.getId().equals(getUser().getId())).findAny();
        return planner.isPresent();
    }

    @SuppressWarnings("unused")
    public boolean isPlanner() {
        if (isUserHasBypass()) {
            return true;
        }
        User user = userRepository.findById(getUser().getId()).orElseThrow();
        return user.isPlanner();
    }

    @SuppressWarnings("unused")
    public boolean isObserver() {
        if (isUserHasBypass()) {
            return true;
        }
        User user = userRepository.findById(getUser().getId()).orElseThrow();
        return user.isObserver();
    }
    // endregion

    // region setters
    @Override
    public Object getFilterObject() {
        return this.filterObject;
    }

    @Override
    public void setFilterObject(Object obj) {
        this.filterObject = obj;
    }

    @Override
    public Object getReturnObject() {
        return this.returnObject;
    }

    @Override
    public void setReturnObject(Object obj) {
        this.returnObject = obj;
    }

    @Override
    public Object getThis() {
        return this;
    }
    // endregion
}