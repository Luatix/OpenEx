package io.openbas.rest.helper;

import io.openbas.database.model.*;
import io.openbas.database.raw.*;
import io.openbas.database.repository.CommunicationRepository;
import io.openbas.database.repository.ExerciseTeamUserRepository;
import io.openbas.database.repository.InjectExpectationRepository;
import io.openbas.database.repository.ScenarioRepository;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

public class TeamHelper {

    public static List<SimplerTeam> rawTeamToSimplerTeam(List<RawTeam> teams,
                                                         InjectExpectationRepository injectExpectationRepository,
                                                         CommunicationRepository communicationRepository,
                                                         ExerciseTeamUserRepository exerciseTeamUserRepository,
                                                         ScenarioRepository scenarioRepository) {
        // Getting a map of inject expectations
        Map<String, RawInjectExpectation> mapInjectExpectation = injectExpectationRepository.rawByIds(
                        teams.stream().flatMap(rawTeam -> rawTeam.getTeam_expectations().stream()).toList()
                )
                .stream().collect(Collectors.toMap(RawInjectExpectation::getInject_expectation_id, Function.identity()));

        // Getting a map of communications
        Map<String, RawCommunication> mapCommunication = communicationRepository.rawByIds(
                        teams.stream().flatMap(rawTeam -> rawTeam.getTeam_communications().stream()).toList()
                )
                .stream().collect(Collectors.toMap(RawCommunication::getCommunication_id, Function.identity()));

        // Getting a map of exercises team users by team id
        Map<String, List<RawExerciseTeamUser>> mapExerciseTeamUser = exerciseTeamUserRepository.rawByTeamIds(
                        teams.stream().map(RawTeam::getTeam_id).toList()
                )
                .stream().collect(Collectors.groupingBy(RawExerciseTeamUser::getTeam_id));

        // Getting a map of Injects by scenarios ids
        Map<String, Set<String>> mapInjectsByScenarioIds = scenarioRepository.rawInjectsFromScenarios(
                teams.stream().flatMap(rawTeam -> rawTeam.getTeam_scenarios().stream()).toList()
        ).stream().collect(Collectors.toMap(RawScenario::getScenario_id, RawScenario::getScenario_injects));

        // Then, for all the raw teams, we will create a simpler team object and then send it back to the front
        return teams.stream().map(rawTeam -> {
            // We create the simpler team object using the raw one
            SimplerTeam simplerTeam = new SimplerTeam(rawTeam);

            // We set the inject expectations
            simplerTeam.setInjectExpectations(
                    rawTeam.getTeam_expectations().stream().map(
                            expectation -> {
                                // We set the inject expectation using the map we generated earlier
                                RawInjectExpectation raw = mapInjectExpectation.get(expectation);
                                InjectExpectation injectExpectation = new InjectExpectation();
                                injectExpectation.setScore(raw.getInject_expectation_score());
                                injectExpectation.setId(raw.getInject_expectation_id());
                                injectExpectation.setExpectedScore(raw.getInject_expectation_expected_score());
                                if(raw.getExercise_id() != null) {
                                    injectExpectation.setExercise(new Exercise());
                                    injectExpectation.getExercise().setId(raw.getExercise_id());
                                }
                                injectExpectation.setTeam(new Team());
                                injectExpectation.getTeam().setId(rawTeam.getTeam_id());
                                injectExpectation.setType(InjectExpectation.EXPECTATION_TYPE.valueOf(raw.getInject_expectation_type()));
                                return injectExpectation;
                            }
                    ).toList()
            );

            // We set the communications using the map we generated earlier
            // This object has content, content_html and attachments ignored because WE DON'T WANT THE FULL EXTENT
            simplerTeam.setCommunications(
                    rawTeam.getTeam_communications().stream().map(communicationId -> {
                        RawCommunication raw = mapCommunication.get(communicationId);
                        Communication communication = new Communication();
                        communication.setAck(raw.getCommunication_ack());
                        communication.setId(raw.getCommunication_id());
                        communication.setIdentifier(raw.getCommunication_message_id());
                        communication.setReceivedAt(raw.getCommunication_received_at());
                        communication.setSentAt(raw.getCommunication_sent_at());
                        communication.setSubject(raw.getCommunication_subject());
                        Inject inject = new Inject();
                        inject.setId(raw.getCommunication_inject());
                        Exercise exercise = new Exercise();
                        exercise.setId(raw.getCommunication_exercise());
                        inject.setExercise(exercise);
                        communication.setInject(inject);
                        communication.setUsers(raw.getCommunication_users().stream().map(id -> {
                            User user = new User();
                            user.setId(id);
                            return user;
                        }).toList());
                        communication.setAnimation(raw.getCommunication_animation());
                        communication.setFrom(raw.getCommunication_from());
                        communication.setTo(raw.getCommunication_to());
                        return communication;
                    }).toList()
            );

            // We set the tuple of exercise/user/team
            List<RawExerciseTeamUser> exerciseTeamUsers = mapExerciseTeamUser.get(rawTeam);
            if(exerciseTeamUsers != null) {
                simplerTeam.setExerciseTeamUsers(exerciseTeamUsers.stream().map(
                        rawExerciseTeamUser -> {
                            ExerciseTeamUser exerciseTeamUser = new ExerciseTeamUser();
                            exerciseTeamUser.setTeam(new Team());
                            exerciseTeamUser.getTeam().setId(rawExerciseTeamUser.getTeam_id());
                            exerciseTeamUser.setExercise(new Exercise());
                            exerciseTeamUser.getExercise().setId(rawExerciseTeamUser.getExercise_id());
                            exerciseTeamUser.setUser(new User());
                            exerciseTeamUser.getUser().setId(rawExerciseTeamUser.getUser_id());
                            return exerciseTeamUser;
                        }
                ).collect(Collectors.toSet()));
            }

            // We set the injects linked to the scenarios
            simplerTeam.setScenariosInjects(rawTeam.getTeam_scenarios().stream().flatMap(
                    scenario -> mapInjectsByScenarioIds.get(scenario).stream()
            ).collect(Collectors.toSet()));

            return simplerTeam;
        }).collect(Collectors.toList());
    }
}
