package io.openbas.service;

import static io.openbas.helper.StreamHelper.fromIterable;
import static io.openbas.injectors.challenge.ChallengeContract.CHALLENGE_PUBLISH;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.openbas.database.model.*;
import io.openbas.database.repository.ChallengeRepository;
import io.openbas.database.repository.ExerciseRepository;
import io.openbas.database.repository.InjectExpectationRepository;
import io.openbas.database.repository.InjectRepository;
import io.openbas.injectors.challenge.model.ChallengeContent;
import io.openbas.rest.challenge.form.ChallengeTryInput;
import io.openbas.rest.challenge.response.ChallengeInformation;
import io.openbas.rest.challenge.response.ChallengeResult;
import io.openbas.rest.challenge.response.ChallengesReader;
import io.openbas.rest.exception.ElementNotFoundException;
import io.openbas.utils.ExpectationUtils;
import jakarta.annotation.Resource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChallengeService {

  private final ExerciseRepository exerciseRepository;
  private final ChallengeRepository challengeRepository;
  private final InjectRepository injectRepository;
  private final InjectExpectationRepository injectExpectationRepository;
  @Resource protected ObjectMapper mapper;

  public Challenge enrichChallengeWithExercisesOrScenarios(@NotNull Challenge challenge) {
    List<Inject> injects =
        fromIterable(this.injectRepository.findAllForChallengeId("%" + challenge.getId() + "%"));
    List<String> exerciseIds =
        injects.stream()
            .filter(i -> i.getExercise() != null)
            .map(i -> i.getExercise().getId())
            .distinct()
            .toList();
    challenge.setExerciseIds(exerciseIds);
    List<String> scenarioIds =
        injects.stream()
            .filter(i -> i.getScenario() != null)
            .map(i -> i.getScenario().getId())
            .distinct()
            .toList();
    challenge.setScenarioIds(scenarioIds);
    return challenge;
  }

  public Iterable<Challenge> getExerciseChallenges(@NotBlank final String exerciseId) {
    Exercise exercise = exerciseRepository.findById(exerciseId).orElseThrow();
    return StreamSupport.stream(getInjectsChallenges(exercise.getInjects()).spliterator(), false)
        .map(this::enrichChallengeWithExercisesOrScenarios)
        .toList();
  }

  public Iterable<Challenge> getScenarioChallenges(@NotNull final Scenario scenario) {
    return StreamSupport.stream(getInjectsChallenges(scenario.getInjects()).spliterator(), false)
        .map(this::enrichChallengeWithExercisesOrScenarios)
        .toList();
  }

  public Iterable<Challenge> getInjectsChallenges(@NotNull final List<Inject> injects) {
    return resolveChallenges(injects).toList();
  }

  public ChallengeResult tryChallenge(String challengeId, ChallengeTryInput input) {
    Challenge challenge =
        challengeRepository.findById(challengeId).orElseThrow(ElementNotFoundException::new);
    for (ChallengeFlag flag : challenge.getFlags()) {
      if (checkFlag(flag, input.getValue())) {
        return new ChallengeResult(true);
      }
    }
    return new ChallengeResult(false);
  }

  public ChallengesReader playerChallenges(String exerciseId, User user) {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    ChallengesReader reader = new ChallengesReader(exercise);
    List<InjectExpectation> challengeExpectations =
        injectExpectationRepository.findChallengeExpectationsByExerciseAndUser(
            exerciseId, user.getId());

    // Filter expectations by unique challenge
    Set<String> seenChallenges = new HashSet<>();
    List<InjectExpectation> distinctExpectations = new ArrayList<>();

    for (InjectExpectation expectation : challengeExpectations) {
      String challengeId = expectation.getChallenge().getId();
      if (!seenChallenges.contains(challengeId)) {
        seenChallenges.add(challengeId);
        distinctExpectations.add(expectation);
      }
    }

    List<ChallengeInformation> challenges =
        distinctExpectations.stream()
            .map(
                injectExpectation -> {
                  Challenge challenge = injectExpectation.getChallenge();
                  challenge.setVirtualPublication(injectExpectation.getCreatedAt());
                  return new ChallengeInformation(challenge, injectExpectation);
                })
            .sorted(Comparator.comparing(o -> o.getChallenge().getVirtualPublication()))
            .toList();
    reader.setExerciseChallenges(challenges);
    return reader;
  }

  public ChallengesReader validateChallenge(
      String exerciseId, String challengeId, ChallengeTryInput input, User user) {
    ChallengeResult challengeResult = tryChallenge(challengeId, input);
    if (challengeResult.getResult()) {
      // Find and update the expectations linked to the user
      List<InjectExpectation> playerExpectations =
          injectExpectationRepository.findByUserAndExerciseAndChallenge(
              user.getId(), exerciseId, challengeId);
      playerExpectations.forEach(
          playerExpectation -> {
            playerExpectation.setScore(playerExpectation.getExpectedScore());
            InjectExpectationResult expectationResult =
                InjectExpectationResult.builder()
                    .sourceId("challenge")
                    .sourceType("challenge")
                    .sourceName("Challenge validation")
                    .result(Instant.now().toString())
                    .date(Instant.now().toString())
                    .score(playerExpectation.getExpectedScore())
                    .build();
            playerExpectation.getResults().add(expectationResult);
            playerExpectation.setUpdatedAt(Instant.now());
            injectExpectationRepository.save(playerExpectation);
          });

      // -- VALIDATION TYPE --
      processByValidationType(exerciseId, challengeId, user, true);
    }
    return playerChallenges(exerciseId, user);
  }

  private void processByValidationType(
      String exerciseId, String challengeId, User user, boolean isaNewExpectationResult) {
    // Process expectations linked to teams where the user is a member
    List<String> teamIds = user.getTeams().stream().map(Team::getId).toList();
    // Find all expectations for this exercise, challenge and teams
    List<InjectExpectation> challengeExpectations =
        injectExpectationRepository.findChallengeExpectations(exerciseId, teamIds, challengeId);
    // If user is null then expectation is from a team
    List<InjectExpectation> parentExpectations =
        challengeExpectations.stream().filter(exp -> exp.getUser() == null).toList();
    // If user is not null then expectation is from a player
    Map<Team, List<InjectExpectation>> playerByTeam =
        challengeExpectations.stream()
            .filter(exp -> exp.getUser() != null)
            .collect(Collectors.groupingBy(InjectExpectation::getTeam));

    // Depending on type of validation, We process the parent expectations:
    List<InjectExpectation> toUpdate =
        ExpectationUtils.processByValidationType(
            isaNewExpectationResult, challengeExpectations, parentExpectations, playerByTeam);
    injectExpectationRepository.saveAll(toUpdate);
  }

  // -- PRIVATE --
  private Stream<Challenge> resolveChallenges(@NotNull final List<Inject> injects) {
    List<String> challenges =
        injects.stream()
            .filter(
                inject ->
                    inject
                        .getInjectorContract()
                        .map(contract -> contract.getId().equals(CHALLENGE_PUBLISH))
                        .orElse(false))
            .filter(inject -> inject.getContent() != null)
            .flatMap(
                inject -> {
                  try {
                    ChallengeContent content =
                        mapper.treeToValue(inject.getContent(), ChallengeContent.class);
                    return content.getChallenges().stream();
                  } catch (JsonProcessingException e) {
                    return Stream.empty();
                  }
                })
            .distinct()
            .toList();

    return fromIterable(this.challengeRepository.findAllById(challenges)).stream();
  }

  private boolean checkFlag(ChallengeFlag flag, String value) {
    switch (flag.getType()) {
      case VALUE -> {
        return value.equalsIgnoreCase(flag.getValue());
      }
      case VALUE_CASE -> {
        return value.equals(flag.getValue());
      }
      case REGEXP -> {
        return Pattern.compile(flag.getValue()).matcher(value).matches();
      }
      default -> {
        return false;
      }
    }
  }
}
