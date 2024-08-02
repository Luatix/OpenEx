package io.openbas.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.openbas.database.model.*;
import io.openbas.database.repository.ArticleRepository;
import io.openbas.database.repository.ChannelRepository;
import io.openbas.database.repository.ExerciseRepository;
import io.openbas.database.repository.InjectExpectationRepository;
import io.openbas.injectors.channel.model.ChannelContent;
import io.openbas.rest.channel.model.VirtualArticle;
import io.openbas.rest.channel.response.ChannelReader;
import io.openbas.rest.exception.ElementNotFoundException;
import jakarta.annotation.Resource;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static io.openbas.helper.StreamHelper.fromIterable;
import static io.openbas.injectors.channel.ChannelContract.CHANNEL_PUBLISH;

@Service
@AllArgsConstructor
public class ChannelService {

    @Resource
    protected ObjectMapper mapper;

    private InjectExpectationRepository injectExpectationExecutionRepository;
    private ExerciseRepository exerciseRepository;
    private ScenarioService scenarioService;
    private ArticleRepository articleRepository;
    private ChannelRepository channelRepository;


    public ChannelReader validateArticles(String exerciseId, String channelId, User user) {
        ChannelReader channelReader;
        Channel channel = channelRepository.findById(channelId).orElseThrow(ElementNotFoundException::new);
        List<Inject> injects;

        Optional<Exercise> exerciseOpt = exerciseRepository.findById(exerciseId);
        if (exerciseOpt.isPresent()) {
            Exercise exercise = exerciseOpt.get();
            channelReader = new ChannelReader(channel, exercise);
            injects = exercise.getInjects();
        } else {
            Scenario scenario = this.scenarioService.scenario(exerciseId);
            channelReader = new ChannelReader(channel, scenario);
            injects = scenario.getInjects();
        }

        Map<String, Instant> toPublishArticleIdsMap = injects.stream()
                .filter(inject -> inject.getInjectorContract()
                        .map(contract -> contract.getId().equals(CHANNEL_PUBLISH))
                        .orElse(false))
                .filter(inject -> inject.getStatus().isPresent())
                .sorted(Comparator.comparing(inject -> inject.getStatus().get().getTrackingSentDate()))
                .flatMap(inject -> {
                    Instant virtualInjectDate = inject.getStatus().get().getTrackingSentDate();
                    try {
                        ChannelContent content = mapper.treeToValue(inject.getContent(), ChannelContent.class);
                        if (content.getArticles() != null) {
                            return content.getArticles().stream().map(article -> new VirtualArticle(virtualInjectDate, article));
                        }
                        return null;
                    } catch (JsonProcessingException e) {
                        // Invalid channel content.
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toMap(VirtualArticle::id, VirtualArticle::date));
        if (!toPublishArticleIdsMap.isEmpty()) {
            List<Article> publishedArticles = fromIterable(articleRepository.findAllById(toPublishArticleIdsMap.keySet()))
                    .stream().filter(article -> article.getChannel().equals(channel))
                    .peek(article -> article.setVirtualPublication(toPublishArticleIdsMap.get(article.getId())))
                    .sorted(Comparator.comparing(Article::getVirtualPublication).reversed())
                    .toList();
            channelReader.setChannelArticles(publishedArticles);
            // Fulfill article expectations
            List<Inject> finalInjects = injects;
            List<InjectExpectation> expectationExecutions = publishedArticles.stream()
                    .flatMap(article -> finalInjects.stream()
                            .flatMap(inject -> inject.getUserExpectationsForArticle(user, article).stream()))
                    .filter(exec -> exec.getResults().isEmpty()).toList();

            // Update all expectations linked to player
            expectationExecutions.forEach(injectExpectationExecution -> {
                injectExpectationExecution.setResults(List.of(
                        InjectExpectationResult.builder()
                                .sourceId("media-pressure")
                                .sourceType("media-pressure")
                                .sourceName("Media pressure read")
                                .result(Instant.now().toString())
                                .date(Instant.now().toString())
                                .score(injectExpectationExecution.getExpectedScore())
                                .build()
                ));
                injectExpectationExecution.setScore(injectExpectationExecution.getExpectedScore());
                injectExpectationExecution.setUpdatedAt(Instant.now());
                injectExpectationExecutionRepository.save(injectExpectationExecution);
            });

            // Process expectation linked to teams where user if part of
            List<String> injectIds = injects.stream().map(Inject::getId).toList();
            List<String> teamIds = user.getTeams().stream().map(Team::getId).toList();
            List<String> articleIds = publishedArticles.stream().map(Article::getId).toList();
            // Find all expectations linked to teams' user, channel and exercise
            List<InjectExpectation> channelExpectations = injectExpectationExecutionRepository.findChannelExpectations(injectIds, teamIds, articleIds);

            // Depending on type of validation, we process the parent expectations:
            channelExpectations.stream().findAny().ifPresentOrElse(process -> {
                boolean validationType = process.isExpectationGroup();

                channelExpectations.forEach(parentExpectation -> {
                    if (validationType) { // Validation type at least one target
                        parentExpectation.setScore(injectExpectationExecutionRepository.computeAverageScoreWhenValidationTypeIsAtLeastOnePlayerForChannel(
                                injectIds,
                                articleIds,
                                parentExpectation.getTeam().getId())
                        );
                    } else { // Validation type all
                        parentExpectation.setScore(injectExpectationExecutionRepository.computeAverageScoreWhenValidationTypeIsAllPlayersForChannel(
                                injectIds,
                                articleIds,
                                parentExpectation.getTeam().getId())
                        );
                    }
                    InjectExpectationResult result = InjectExpectationResult.builder()
                            .sourceId("media-pressure")
                            .sourceType("media-pressure")
                            .sourceName("Media pressure read")
                            .result(Instant.now().toString())
                            .date(Instant.now().toString())
                            .score(process.getExpectedScore())
                            .build();

                    parentExpectation.getResults().add(result);
                    parentExpectation.setUpdatedAt(Instant.now());
                    injectExpectationExecutionRepository.save(parentExpectation);
                });
            }, ElementNotFoundException::new);
        }
        return channelReader;
    }
}
