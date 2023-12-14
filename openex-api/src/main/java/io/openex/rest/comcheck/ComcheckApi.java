package io.openex.rest.comcheck;

import io.openex.database.model.*;
import io.openex.database.repository.TeamRepository;
import io.openex.database.repository.ComcheckRepository;
import io.openex.database.repository.ComcheckStatusRepository;
import io.openex.database.repository.ExerciseRepository;
import io.openex.rest.comcheck.form.ComcheckInput;
import io.openex.rest.helper.RestBehavior;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.transaction.Transactional;
import jakarta.validation.Valid;
import java.util.List;

import static io.openex.helper.StreamHelper.fromIterable;
import static java.time.Instant.now;

@RestController
public class ComcheckApi extends RestBehavior {

    private ComcheckRepository comcheckRepository;
    private TeamRepository teamRepository;
    private ExerciseRepository exerciseRepository;
    private ComcheckStatusRepository comcheckStatusRepository;

    @Autowired
    public void setComcheckStatusRepository(ComcheckStatusRepository comcheckStatusRepository) {
        this.comcheckStatusRepository = comcheckStatusRepository;
    }

    @Autowired
    public void setComcheckRepository(ComcheckRepository comcheckRepository) {
        this.comcheckRepository = comcheckRepository;
    }

    @Autowired
    public void setTeamRepository(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    @Autowired
    public void setExerciseRepository(ExerciseRepository exerciseRepository) {
        this.exerciseRepository = exerciseRepository;
    }

    @Transactional(rollbackOn = Exception.class)
    @GetMapping("/api/comcheck/{comcheckStatusId}")
    public ComcheckStatus checkValidation(@PathVariable String comcheckStatusId) {
        ComcheckStatus comcheckStatus = comcheckStatusRepository.findById(comcheckStatusId).orElseThrow();
        Comcheck comcheck = comcheckStatus.getComcheck();
        if (!comcheck.getState().equals(Comcheck.COMCHECK_STATUS.RUNNING)) {
            throw new UnsupportedOperationException("This comcheck is closed.");
        }
        comcheckStatus.setReceiveDate(now());
        ComcheckStatus status = comcheckStatusRepository.save(comcheckStatus);
        boolean finishedComcheck = comcheck.getComcheckStatus().stream()
                .noneMatch(st -> st.getState().equals(ComcheckStatus.CHECK_STATUS.RUNNING));
        if (finishedComcheck) {
            comcheck.setState(Comcheck.COMCHECK_STATUS.FINISHED);
            comcheckRepository.save(comcheck);
        }
        return status;
    }

    @DeleteMapping("/api/exercises/{exerciseId}/comchecks/{comcheckId}")
    @PreAuthorize("isExercisePlanner(#exerciseId)")
    public void deleteComcheck(@PathVariable String exerciseId, @PathVariable String comcheckId) {
        comcheckRepository.deleteById(comcheckId);
    }

    @Transactional(rollbackOn = Exception.class)
    @PostMapping("/api/exercises/{exerciseId}/comchecks")
    public Comcheck communicationCheck(@PathVariable String exerciseId,
                                       @Valid @RequestBody ComcheckInput comCheck) {
        // 01. Create the comcheck and get the ID
        Comcheck check = new Comcheck();
        check.setUpdateAttributes(comCheck);
        check.setName(comCheck.getName());
        check.setStart(now());
        Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
        check.setExercise(exercise);
        // 02. Get users
        List<String> teamIds = comCheck.getTeamIds();
        List<Team> teams = teamIds.isEmpty() ? exercise.getTeams() :
                fromIterable(teamRepository.findAllById(teamIds));
        List<User> users = teams.stream().flatMap(team -> team.getUsers().stream()).distinct().toList();
        List<ComcheckStatus> comcheckStatuses = users.stream().map(user -> {
            ComcheckStatus comcheckStatus = new ComcheckStatus(user);
            comcheckStatus.setComcheck(check);
            return comcheckStatus;
        }).toList();
        check.setComcheckStatus(comcheckStatuses);
        return comcheckRepository.save(check);
    }
}
