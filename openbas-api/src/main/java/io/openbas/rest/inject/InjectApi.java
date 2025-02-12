package io.openbas.rest.inject;

import static io.openbas.config.SessionHelper.currentUser;
import static io.openbas.database.model.User.ROLE_ADMIN;
import static io.openbas.database.specification.CommunicationSpecification.fromInject;
import static io.openbas.helper.StreamHelper.fromIterable;
import static io.openbas.helper.StreamHelper.iterableToSet;
import static io.openbas.rest.exercise.ExerciseApi.EXERCISE_URI;
import static io.openbas.rest.scenario.ScenarioApi.SCENARIO_URI;
import static java.time.Instant.now;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.openbas.aop.LogExecutionTime;
import io.openbas.database.model.*;
import io.openbas.database.model.InjectStatus;
import io.openbas.database.repository.*;
import io.openbas.database.specification.InjectSpecification;
import io.openbas.execution.ExecutableInject;
import io.openbas.execution.ExecutionContext;
import io.openbas.execution.ExecutionContextService;
import io.openbas.executors.Executor;
import io.openbas.injector_contract.ContractType;
import io.openbas.rest.atomic_testing.form.InjectResultOutput;
import io.openbas.rest.exception.BadRequestException;
import io.openbas.rest.exception.ElementNotFoundException;
import io.openbas.rest.exercise.exports.ExportOptions;
import io.openbas.rest.helper.RestBehavior;
import io.openbas.rest.inject.form.*;
import io.openbas.rest.inject.service.*;
import io.openbas.rest.security.SecurityExpression;
import io.openbas.service.*;
import io.openbas.telemetry.Tracing;
import io.openbas.utils.pagination.SearchPaginationInput;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import java.util.*;
import java.util.logging.Level;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Log
@RestController
@RequiredArgsConstructor
public class InjectApi extends RestBehavior {

  public static final String INJECT_URI = "/api/injects";

  private static final int MAX_NEXT_INJECTS = 6;
  private static final String EXPECTATIONS = "expectations";
  private static final String PREDEFINE_EXPECTATIONS = "predefinedExpectations";

  private final Executor executor;
  private final InjectorContractRepository injectorContractRepository;
  private final CommunicationRepository communicationRepository;
  private final ExerciseRepository exerciseRepository;
  private final UserRepository userRepository;
  private final InjectRepository injectRepository;
  private final InjectDocumentRepository injectDocumentRepository;
  private final TeamRepository teamRepository;
  private final TagRepository tagRepository;
  private final DocumentRepository documentRepository;
  private final AssetService assetService;
  private final AssetGroupService assetGroupService;
  private final ExecutionContextService executionContextService;
  private final ScenarioService scenarioService;
  private final InjectService injectService;
  private final InjectSearchService injectSearchService;
  private final InjectDuplicateService injectDuplicateService;
  private final TagRuleService tagRuleService;
  private final InjectStatusService injectStatusService;
  private final ExecutableInjectService executableInjectService;
  private final ChallengeService challengeService;
  private final InjectExportService injectExportService;

  // -- INJECTS --

  @GetMapping(INJECT_URI + "/{injectId}")
  public Inject inject(@PathVariable @NotBlank final String injectId) {
    return this.injectRepository.findById(injectId).orElseThrow(ElementNotFoundException::new);
  }

  @PostMapping(INJECT_URI + "/export")
  public void injectsExport(
      @RequestBody @Valid final InjectExportRequestInput injectExportRequestInput,
      HttpServletResponse response)
      throws IOException {
    List<String> targetIds = injectExportRequestInput.getTargetsIds();
    List<Inject> injects = injectRepository.findAllById(targetIds);

    List<String> foundIds = injects.stream().map(Inject::getId).toList();
    List<String> missedIds =
        new ArrayList<>(targetIds.stream().filter(id -> !foundIds.contains(id)).toList());
    missedIds.addAll(
        injectService
            .authorise(injects, SecurityExpression::isInjectObserver)
            .getUnauthorised()
            .stream()
            .map(Inject::getId)
            .toList());

    if (!missedIds.isEmpty()) {
      throw new ElementNotFoundException(String.join(", ", missedIds));
    }

    int exportOptionsMask =
        ExportOptions.mask(
            injectExportRequestInput.getExportOptions().isWithPlayers(),
            injectExportRequestInput.getExportOptions().isWithTeams(),
            injectExportRequestInput.getExportOptions().isWithVariableValues());
    byte[] zippedExport = injectExportService.exportExerciseToZip(injects, exportOptionsMask);
    String zipName = injectExportService.getZipFileName(exportOptionsMask);

    response.addHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + zipName);
    response.addHeader(HttpHeaders.CONTENT_TYPE, "application/zip");
    response.setStatus(HttpServletResponse.SC_OK);
    ServletOutputStream outputStream = response.getOutputStream();
    outputStream.write(zippedExport);
    outputStream.close();
  }

  @Secured(ROLE_ADMIN)
  @PostMapping(INJECT_URI + "/execution/reception/{injectId}")
  public Inject injectExecutionReception(
      @PathVariable String injectId, @Valid @RequestBody InjectReceptionInput input) {
    Inject inject = injectRepository.findById(injectId).orElseThrow(ElementNotFoundException::new);
    InjectStatus injectStatus = inject.getStatus().orElseThrow(ElementNotFoundException::new);
    injectStatus.setName(ExecutionStatus.PENDING);
    return injectRepository.save(inject);
  }

  @Secured(ROLE_ADMIN)
  @PostMapping(INJECT_URI + "/execution/callback/{injectId}")
  public Inject injectExecutionCallback(
      @PathVariable String injectId, @Valid @RequestBody InjectExecutionInput input) {
    return injectExecutionCallback(null, injectId, input);
  }

  @Secured(ROLE_ADMIN)
  @PostMapping(INJECT_URI + "/execution/{agentId}/callback/{injectId}")
  public Inject injectExecutionCallback(
      @PathVariable
          String agentId, // must allow null because http injector used also this method to work.
      @PathVariable String injectId,
      @Valid @RequestBody InjectExecutionInput input) {
    return injectStatusService.handleInjectExecutionCallback(injectId, agentId, input);
  }

  @Secured(ROLE_ADMIN)
  @GetMapping(INJECT_URI + "/{injectId}/{agentId}/executable-payload")
  @Operation(
      summary = "Get the payload ready to be executed",
      description =
          "This endpoint is invoked by implants to retrieve a payload command that's pre-configured and ready for execution.")
  @Tracing(name = "Get payload ready to be executed", layer = "api", operation = "GET")
  public Payload getExecutablePayloadInject(
      @PathVariable @NotBlank final String injectId, @PathVariable @NotBlank final String agentId)
      throws Exception {
    return executableInjectService.getExecutablePayloadAndUpdateInjectStatus(injectId, agentId);
  }

  // -- EXERCISES --

  @Transactional(rollbackFor = Exception.class)
  @PutMapping(INJECT_URI + "/{exerciseId}/{injectId}")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public Inject updateInject(
      @PathVariable String exerciseId,
      @PathVariable String injectId,
      @Valid @RequestBody InjectInput input) {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    Inject inject = updateInject(injectId, input);

    // If Documents not yet linked directly to the exercise, attached it
    inject
        .getDocuments()
        .forEach(
            document -> {
              if (!document.getDocument().getExercises().contains(exercise)) {
                exercise.getDocuments().add(document.getDocument());
              }
            });
    this.exerciseRepository.save(exercise);
    return injectRepository.save(inject);
  }

  // -- EXERCISES --

  @LogExecutionTime
  @GetMapping(EXERCISE_URI + "/{exerciseId}/injects")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  @Tracing(name = "Get an iterable of injects for an exercise", layer = "api", operation = "GET")
  public Iterable<Inject> exerciseInjects(@PathVariable @NotBlank final String exerciseId) {
    return injectRepository.findByExerciseId(exerciseId).stream()
        .sorted(Inject.executionComparator)
        .toList();
  }

  @LogExecutionTime
  @PostMapping(EXERCISE_URI + "/{exerciseId}/injects/search")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  @Transactional(readOnly = true)
  @Tracing(name = "Get a page of inject result for an exercise", layer = "api", operation = "POST")
  public Page<InjectResultOutput> searchExerciseInjects(
      @PathVariable final String exerciseId,
      @RequestBody @Valid SearchPaginationInput searchPaginationInput) {
    return injectSearchService.getPageOfInjectResults(exerciseId, searchPaginationInput);
  }

  @LogExecutionTime
  @GetMapping(EXERCISE_URI + "/{exerciseId}/injects/results")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  @Transactional(readOnly = true)
  @Tracing(name = "Get a list of inject results for an exercise", layer = "api", operation = "GET")
  public List<InjectResultOutput> exerciseInjectsResults(@PathVariable final String exerciseId) {
    return injectSearchService.getListOfInjectResults(exerciseId);
  }

  @GetMapping(EXERCISE_URI + "/{exerciseId}/injects/{injectId}")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  public Inject exerciseInject(@PathVariable String exerciseId, @PathVariable String injectId) {
    return injectRepository.findById(injectId).orElseThrow(ElementNotFoundException::new);
  }

  @GetMapping(EXERCISE_URI + "/{exerciseId}/injects/{injectId}/teams")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  public Iterable<Team> exerciseInjectTeams(
      @PathVariable String exerciseId, @PathVariable String injectId) {
    return injectRepository
        .findById(injectId)
        .orElseThrow(ElementNotFoundException::new)
        .getTeams();
  }

  @GetMapping(EXERCISE_URI + "/{exerciseId}/injects/{injectId}/communications")
  @PreAuthorize("isExerciseObserver(#exerciseId)")
  public Iterable<Communication> exerciseInjectCommunications(
      @PathVariable String exerciseId, @PathVariable String injectId) {
    List<Communication> coms =
        communicationRepository.findAll(
            fromInject(injectId), Sort.by(Sort.Direction.DESC, "receivedAt"));
    List<Communication> ackComs = coms.stream().peek(com -> com.setAck(true)).toList();
    return communicationRepository.saveAll(ackComs);
  }

  @PostMapping(EXERCISE_URI + "/{exerciseId}/injects")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  @Transactional(rollbackFor = Exception.class)
  public Inject createInjectForExercise(
      @PathVariable String exerciseId, @Valid @RequestBody InjectInput input) {
    Exercise exercise =
        exerciseRepository.findById(exerciseId).orElseThrow(ElementNotFoundException::new);
    InjectorContract injectorContract =
        injectorContractRepository
            .findById(input.getInjectorContract())
            .orElseThrow(ElementNotFoundException::new);
    // Set expectations
    ObjectNode finalContent = input.getContent();
    if (input.getContent() == null
        || input.getContent().get(EXPECTATIONS) == null
        || input.getContent().get(EXPECTATIONS).isEmpty()) {
      try {
        JsonNode jsonNode = mapper.readTree(injectorContract.getContent());
        List<JsonNode> contractElements =
            StreamSupport.stream(jsonNode.get("fields").spliterator(), false)
                .filter(
                    contractElement ->
                        contractElement
                            .get("type")
                            .asText()
                            .equals(ContractType.Expectation.name().toLowerCase()))
                .toList();
        if (!contractElements.isEmpty()) {
          JsonNode contractElement = contractElements.getFirst();
          if (!contractElement.get(PREDEFINE_EXPECTATIONS).isNull()
              && !contractElement.get(PREDEFINE_EXPECTATIONS).isEmpty()) {
            finalContent = finalContent != null ? finalContent : mapper.createObjectNode();
            ArrayNode predefinedExpectations = mapper.createArrayNode();
            StreamSupport.stream(contractElement.get(PREDEFINE_EXPECTATIONS).spliterator(), false)
                .forEach(
                    predefinedExpectation -> {
                      ObjectNode newExpectation = predefinedExpectation.deepCopy();
                      newExpectation.put("expectation_score", 100);
                      predefinedExpectations.add(newExpectation);
                    });
            finalContent.put(EXPECTATIONS, predefinedExpectations);
          }
        }
      } catch (JsonProcessingException e) {
        log.severe("Cannot open injector contract");
      }
    }
    input.setContent(finalContent);
    // Get common attributes
    Inject inject = input.toInject(injectorContract);
    inject.setUser(
        userRepository
            .findById(currentUser().getId())
            .orElseThrow(() -> new ElementNotFoundException("Current user not found")));
    inject.setExercise(exercise);
    // Set dependencies
    if (input.getDependsOn() != null) {
      inject
          .getDependsOn()
          .addAll(
              input.getDependsOn().stream()
                  .map(
                      injectDependencyInput -> {
                        InjectDependency dependency = new InjectDependency();
                        dependency.setInjectDependencyCondition(
                            injectDependencyInput.getConditions());
                        dependency.setCompositeId(new InjectDependencyId());
                        dependency.getCompositeId().setInjectChildren(inject);
                        dependency
                            .getCompositeId()
                            .setInjectParent(
                                injectRepository
                                    .findById(
                                        injectDependencyInput.getRelationship().getInjectParentId())
                                    .orElse(null));
                        return dependency;
                      })
                  .toList());
    }
    inject.setTeams(fromIterable(teamRepository.findAllById(input.getTeams())));
    inject.setAssets(fromIterable(assetService.assets(input.getAssets())));

    // verify if the inject is not manual/sms/emails...
    if (this.injectService.canApplyAssetGroupToInject(inject)) {
      // add default asset groups
      inject.setAssetGroups(
          this.tagRuleService.applyTagRuleToInjectCreation(
              exercise.getTags().stream().map(Tag::getId).toList(),
              assetGroupService.assetGroups(input.getAssetGroups())));
    }

    inject.setTags(iterableToSet(tagRepository.findAllById(input.getTagIds())));
    List<InjectDocument> injectDocuments =
        input.getDocuments().stream()
            .map(
                i -> {
                  InjectDocument injectDocument = new InjectDocument();
                  injectDocument.setInject(inject);
                  injectDocument.setDocument(
                      documentRepository
                          .findById(i.getDocumentId())
                          .orElseThrow(ElementNotFoundException::new));
                  injectDocument.setAttached(i.isAttached());
                  return injectDocument;
                })
            .toList();
    inject.setDocuments(injectDocuments);
    // Linked documents directly to the exercise
    inject
        .getDocuments()
        .forEach(
            document -> {
              if (!document.getDocument().getExercises().contains(exercise)) {
                exercise.getDocuments().add(document.getDocument());
              }
            });
    return injectRepository.save(inject);
  }

  @PostMapping(EXERCISE_URI + "/{exerciseId}/injects/{injectId}")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public Inject duplicateInjectForExercise(
      @PathVariable @NotBlank final String exerciseId,
      @PathVariable @NotBlank final String injectId) {
    return injectDuplicateService.duplicateInjectForExerciseWithDuplicateWordInTitle(
        exerciseId, injectId);
  }

  @Transactional(rollbackFor = Exception.class)
  @PostMapping(value = EXERCISE_URI + "/{exerciseId}/inject")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public InjectStatus executeInject(
      @PathVariable @NotBlank final String exerciseId,
      @Valid @RequestPart("input") DirectInjectInput input,
      @RequestPart("file") Optional<MultipartFile> file) {
    Inject inject =
        input.toInject(
            this.injectorContractRepository
                .findById(input.getInjectorContract())
                .orElseThrow(() -> new ElementNotFoundException("Injector contract not found")));
    inject.setUser(
        this.userRepository
            .findById(currentUser().getId())
            .orElseThrow(() -> new ElementNotFoundException("Current user not found")));
    inject.setExercise(
        this.exerciseRepository
            .findById(exerciseId)
            .orElseThrow(() -> new ElementNotFoundException("Exercise not found")));
    inject.setDependsDuration(0L);
    Inject savedInject = this.injectRepository.save(inject);
    Iterable<User> users = this.userRepository.findAllById(input.getUserIds());
    List<ExecutionContext> userInjectContexts =
        fromIterable(users).stream()
            .map(
                user ->
                    this.executionContextService.executionContext(
                        user, savedInject, "Direct execution"))
            .collect(Collectors.toList());
    ExecutableInject injection =
        new ExecutableInject(
            true,
            true,
            savedInject,
            List.of(),
            savedInject.getAssets(),
            savedInject.getAssetGroups(),
            userInjectContexts);
    file.ifPresent(injection::addDirectAttachment);
    try {
      return executor.directExecute(injection);
    } catch (Exception e) {
      log.log(Level.WARNING, e.getMessage(), e);
      return injectStatusService.failInjectStatus(inject.getId(), e.getMessage());
    }
  }

  @Transactional(rollbackFor = Exception.class)
  @DeleteMapping(EXERCISE_URI + "/{exerciseId}/injects/{injectId}")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public void deleteInject(@PathVariable String exerciseId, @PathVariable String injectId) {
    injectDocumentRepository.deleteDocumentsFromInject(injectId);
    injectRepository.deleteById(injectId);
  }

  @PutMapping(EXERCISE_URI + "/{exerciseId}/injects/{injectId}/activation")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public Inject updateInjectActivationForExercise(
      @PathVariable String exerciseId,
      @PathVariable String injectId,
      @Valid @RequestBody InjectUpdateActivationInput input) {
    return updateInjectActivation(injectId, input);
  }

  @PutMapping(EXERCISE_URI + "/{exerciseId}/injects/{injectId}/trigger")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public Inject updateInjectTrigger(
      @PathVariable String exerciseId, @PathVariable String injectId) {
    Inject inject = injectRepository.findById(injectId).orElseThrow(ElementNotFoundException::new);
    inject.setTriggerNowDate(now());
    inject.setUpdatedAt(now());
    return injectRepository.save(inject);
  }

  @Transactional(rollbackFor = Exception.class)
  @PostMapping(EXERCISE_URI + "/{exerciseId}/injects/{injectId}/status")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public Inject setInjectStatus(
      @PathVariable String exerciseId,
      @PathVariable String injectId,
      @Valid @RequestBody InjectUpdateStatusInput input) {
    return injectStatusService.updateInjectStatus(injectId, input);
  }

  @PutMapping(EXERCISE_URI + "/{exerciseId}/injects/{injectId}/teams")
  @PreAuthorize("isExercisePlanner(#exerciseId)")
  public Inject updateInjectTeams(
      @PathVariable String exerciseId,
      @PathVariable String injectId,
      @Valid @RequestBody InjectTeamsInput input) {
    Inject inject = injectRepository.findById(injectId).orElseThrow(ElementNotFoundException::new);
    Iterable<Team> injectTeams = teamRepository.findAllById(input.getTeamIds());
    inject.setTeams(fromIterable(injectTeams));
    return injectRepository.save(inject);
  }

  @GetMapping(INJECT_URI + "/next")
  public List<Inject> nextInjectsToExecute(@RequestParam Optional<Integer> size) {
    return injectRepository.findAll(InjectSpecification.next()).stream()
        // Keep only injects visible by the user
        .filter(inject -> inject.getDate().isPresent())
        .filter(
            inject ->
                inject
                    .getExercise()
                    .isUserHasAccess(
                        userRepository
                            .findById(currentUser().getId())
                            .orElseThrow(
                                () -> new ElementNotFoundException("Current user not found"))))
        // Order by near execution
        .sorted(Inject.executionComparator)
        // Keep only the expected size
        .limit(size.orElse(MAX_NEXT_INJECTS))
        // Collect the result
        .toList();
  }

  // -- SCENARIOS --

  @PostMapping(SCENARIO_URI + "/{scenarioId}/injects")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  @Transactional(rollbackFor = Exception.class)
  public Inject createInjectForScenario(
      @PathVariable @NotBlank final String scenarioId, @Valid @RequestBody InjectInput input) {
    Scenario scenario = this.scenarioService.scenario(scenarioId);
    InjectorContract injectorContract =
        injectorContractRepository
            .findById(input.getInjectorContract())
            .orElseThrow(ElementNotFoundException::new);
    // Set expectations
    ObjectNode finalContent = input.getContent();
    if (input.getContent() == null
        || input.getContent().get(EXPECTATIONS) == null
        || input.getContent().get(EXPECTATIONS).isEmpty()) {
      try {
        JsonNode jsonNode = mapper.readTree(injectorContract.getContent());
        List<JsonNode> contractElements =
            StreamSupport.stream(jsonNode.get("fields").spliterator(), false)
                .filter(
                    contractElement ->
                        contractElement
                            .get("type")
                            .asText()
                            .equals(ContractType.Expectation.name().toLowerCase()))
                .toList();
        if (!contractElements.isEmpty()) {
          JsonNode contractElement = contractElements.getFirst();
          if (!contractElement.get(PREDEFINE_EXPECTATIONS).isNull()
              && !contractElement.get(PREDEFINE_EXPECTATIONS).isEmpty()) {
            finalContent = finalContent != null ? finalContent : mapper.createObjectNode();
            ArrayNode predefinedExpectations = mapper.createArrayNode();
            StreamSupport.stream(contractElement.get(PREDEFINE_EXPECTATIONS).spliterator(), false)
                .forEach(
                    predefinedExpectation -> {
                      ObjectNode newExpectation = predefinedExpectation.deepCopy();
                      newExpectation.put("expectation_score", 100);
                      predefinedExpectations.add(newExpectation);
                    });
            finalContent.put(EXPECTATIONS, predefinedExpectations);
          }
        }
      } catch (JsonProcessingException e) {
        log.severe("Cannot open injector contract");
      }
    }
    input.setContent(finalContent);
    // Get common attributes
    Inject inject = input.toInject(injectorContract);
    inject.setUser(
        this.userRepository
            .findById(currentUser().getId())
            .orElseThrow(() -> new ElementNotFoundException("Current user not found")));
    inject.setScenario(scenario);
    // Set dependencies
    if (input.getDependsOn() != null) {
      inject
          .getDependsOn()
          .addAll(
              input.getDependsOn().stream()
                  .map(
                      injectDependencyInput -> {
                        InjectDependency dependency = new InjectDependency();
                        dependency.setInjectDependencyCondition(
                            injectDependencyInput.getConditions());
                        dependency.setCompositeId(new InjectDependencyId());
                        dependency.getCompositeId().setInjectChildren(inject);
                        dependency
                            .getCompositeId()
                            .setInjectParent(
                                injectRepository
                                    .findById(
                                        injectDependencyInput.getRelationship().getInjectParentId())
                                    .orElse(null));
                        return dependency;
                      })
                  .toList());
    }
    inject.setTeams(fromIterable(teamRepository.findAllById(input.getTeams())));
    inject.setAssets(fromIterable(assetService.assets(input.getAssets())));

    // verify if the inject is not manual/sms/emails...
    if (this.injectService.canApplyAssetGroupToInject(inject)) {
      // add default asset groups
      inject.setAssetGroups(
          this.tagRuleService.applyTagRuleToInjectCreation(
              scenario.getTags().stream().map(Tag::getId).toList(),
              assetGroupService.assetGroups(input.getAssetGroups())));
    }

    inject.setTags(iterableToSet(tagRepository.findAllById(input.getTagIds())));
    List<InjectDocument> injectDocuments =
        input.getDocuments().stream()
            .map(
                i -> {
                  InjectDocument injectDocument = new InjectDocument();
                  injectDocument.setInject(inject);
                  injectDocument.setDocument(
                      documentRepository
                          .findById(i.getDocumentId())
                          .orElseThrow(ElementNotFoundException::new));
                  injectDocument.setAttached(i.isAttached());
                  return injectDocument;
                })
            .toList();
    inject.setDocuments(injectDocuments);
    // Linked documents directly to the exercise
    inject
        .getDocuments()
        .forEach(
            document -> {
              if (!document.getDocument().getScenarios().contains(scenario)) {
                scenario.getDocuments().add(document.getDocument());
              }
            });
    return injectRepository.save(inject);
  }

  @PostMapping(SCENARIO_URI + "/{scenarioId}/injects/{injectId}")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Inject duplicateInjectForScenario(
      @PathVariable @NotBlank final String scenarioId,
      @PathVariable @NotBlank final String injectId) {
    return injectDuplicateService.duplicateInjectForScenarioWithDuplicateWordInTitle(
        scenarioId, injectId);
  }

  @GetMapping(SCENARIO_URI + "/{scenarioId}/injects")
  @PreAuthorize("isScenarioObserver(#scenarioId)")
  public Iterable<Inject> scenarioInjects(@PathVariable @NotBlank final String scenarioId) {
    return this.injectRepository.findByScenarioId(scenarioId).stream()
        .sorted(Inject.executionComparator)
        .toList();
  }

  @GetMapping(SCENARIO_URI + "/{scenarioId}/injects/{injectId}")
  @PreAuthorize("isScenarioObserver(#scenarioId)")
  public Inject scenarioInject(
      @PathVariable @NotBlank final String scenarioId,
      @PathVariable @NotBlank final String injectId) {
    Scenario scenario = this.scenarioService.scenario(scenarioId);
    assert scenarioId.equals(scenario.getId());
    return injectRepository.findById(injectId).orElseThrow(ElementNotFoundException::new);
  }

  @Transactional(rollbackFor = Exception.class)
  @PutMapping(SCENARIO_URI + "/{scenarioId}/injects/{injectId}")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Inject updateInjectForScenario(
      @PathVariable @NotBlank final String scenarioId,
      @PathVariable @NotBlank final String injectId,
      @Valid @RequestBody @NotNull InjectInput input) {
    Scenario scenario = this.scenarioService.scenario(scenarioId);
    Inject inject = updateInject(injectId, input);

    // If Documents not yet linked directly to the exercise, attached it
    inject
        .getDocuments()
        .forEach(
            document -> {
              if (!document.getDocument().getScenarios().contains(scenario)) {
                scenario.getDocuments().add(document.getDocument());
              }
            });
    this.scenarioService.updateScenario(scenario);
    return injectRepository.save(inject);
  }

  @PutMapping(SCENARIO_URI + "/{scenarioId}/injects/{injectId}/activation")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public Inject updateInjectActivationForScenario(
      @PathVariable @NotBlank final String scenarioId,
      @PathVariable @NotBlank final String injectId,
      @Valid @RequestBody InjectUpdateActivationInput input) {
    return updateInjectActivation(injectId, input);
  }

  @Transactional(rollbackFor = Exception.class)
  @DeleteMapping(SCENARIO_URI + "/{scenarioId}/injects/{injectId}")
  @PreAuthorize("isScenarioPlanner(#scenarioId)")
  public void deleteInjectForScenario(
      @PathVariable @NotBlank final String scenarioId,
      @PathVariable @NotBlank final String injectId) {
    Scenario scenario = this.scenarioService.scenario(scenarioId);
    assert scenarioId.equals(scenario.getId());
    this.injectDocumentRepository.deleteDocumentsFromInject(injectId);
    this.injectRepository.deleteById(injectId);
  }

  @Operation(
      description = "Bulk update of injects",
      tags = {"Injects"})
  @Transactional(rollbackFor = Exception.class)
  @PutMapping(INJECT_URI)
  @LogExecutionTime
  @Tracing(name = "Bulk update of injects", layer = "api", operation = "PUT")
  public List<Inject> bulkUpdateInject(@RequestBody @Valid final InjectBulkUpdateInputs input) {

    // Control and format inputs
    List<Inject> injectsToUpdate = getInjectsAndCheckInputForBulkProcessing(input);

    // Bulk update
    return this.injectService.bulkUpdateInject(injectsToUpdate, input.getUpdateOperations());
  }

  @Operation(
      description = "Bulk delete of injects",
      tags = {"injects-api"})
  @Transactional(rollbackFor = Exception.class)
  @DeleteMapping(INJECT_URI)
  @LogExecutionTime
  @Tracing(name = "Bulk delete of injects", layer = "api", operation = "DELETE")
  public List<Inject> bulkDelete(@RequestBody @Valid final InjectBulkProcessingInput input) {

    // Control and format inputs
    List<Inject> injectsToDelete = getInjectsAndCheckInputForBulkProcessing(input);

    // FIXME: This is a workaround to prevent the GUI from blocking when deleting elements
    injectsToDelete.forEach(inject -> inject.setListened(false));

    // Bulk delete
    this.injectService.deleteAll(injectsToDelete);
    return injectsToDelete;
  }

  /**
   * Retrieve injects that match the search input and check that the user is allowed to bulk process
   * them
   *
   * @param input The input for the bulk processing
   * @return The list of injects to process
   * @throws BadRequestException If the input is not correctly formatted
   */
  private List<Inject> getInjectsAndCheckInputForBulkProcessing(InjectBulkProcessingInput input) {
    // Control and format inputs
    if ((CollectionUtils.isEmpty(input.getInjectIDsToProcess())
            && (input.getSearchPaginationInput() == null))
        || (!CollectionUtils.isEmpty(input.getInjectIDsToProcess())
            && (input.getSearchPaginationInput() != null))) {
      throw new BadRequestException(
          "Either inject_ids_to_process or search_pagination_input must be provided, and not both at the same time");
    }

    // Retrieve injects that match the search input and check that the user is allowed to bulk
    // process them
    return this.injectService.getInjectsAndCheckIsPlanner(input);
  }

  // -- PRIVATE --

  private Inject updateInject(@NotBlank final String injectId, @NotNull InjectInput input) {
    Inject inject =
        this.injectRepository.findById(injectId).orElseThrow(ElementNotFoundException::new);
    inject.setUpdateAttributes(input);

    // Set dependencies
    if (input.getDependsOn() != null) {
      input
          .getDependsOn()
          .forEach(
              entry -> {
                Optional<InjectDependency> existingDependency =
                    inject.getDependsOn().stream()
                        .filter(
                            injectDependency ->
                                injectDependency
                                    .getCompositeId()
                                    .getInjectParent()
                                    .getId()
                                    .equals(entry.getRelationship().getInjectParentId()))
                        .findFirst();
                if (existingDependency.isPresent()) {
                  existingDependency
                      .get()
                      .getInjectDependencyCondition()
                      .setConditions(entry.getConditions().getConditions());
                  existingDependency
                      .get()
                      .getInjectDependencyCondition()
                      .setMode(entry.getConditions().getMode());
                } else {
                  InjectDependency injectDependency = new InjectDependency();
                  injectDependency.getCompositeId().setInjectChildren(inject);
                  injectDependency
                      .getCompositeId()
                      .setInjectParent(
                          injectRepository
                              .findById(entry.getRelationship().getInjectParentId())
                              .orElse(null));
                  injectDependency.setInjectDependencyCondition(
                      new InjectDependencyConditions.InjectDependencyCondition());
                  injectDependency
                      .getInjectDependencyCondition()
                      .setConditions(entry.getConditions().getConditions());
                  injectDependency
                      .getInjectDependencyCondition()
                      .setMode(entry.getConditions().getMode());
                  inject.getDependsOn().add(injectDependency);
                }
              });
    }

    List<InjectDependency> injectDepencyToRemove = new ArrayList<>();
    if (inject.getDependsOn() != null && !inject.getDependsOn().isEmpty()) {
      if (input.getDependsOn() != null && !input.getDependsOn().isEmpty()) {
        inject
            .getDependsOn()
            .forEach(
                injectDependency -> {
                  if (!input.getDependsOn().stream()
                      .map(
                          (injectDependencyInput ->
                              injectDependencyInput.getRelationship().getInjectParentId()))
                      .toList()
                      .contains(injectDependency.getCompositeId().getInjectParent().getId())) {
                    injectDepencyToRemove.add(injectDependency);
                  }
                });
      } else {
        injectDepencyToRemove.addAll(inject.getDependsOn());
      }
      inject.getDependsOn().removeAll(injectDepencyToRemove);
    }

    inject.setTeams(fromIterable(this.teamRepository.findAllById(input.getTeams())));
    inject.setAssets(fromIterable(this.assetService.assets(input.getAssets())));
    inject.setAssetGroups(fromIterable(this.assetGroupService.assetGroups(input.getAssetGroups())));
    inject.setTags(iterableToSet(this.tagRepository.findAllById(input.getTagIds())));

    // Set documents
    List<InjectDocumentInput> inputDocuments = input.getDocuments();
    List<InjectDocument> injectDocuments = inject.getDocuments();

    List<String> askedDocumentIds =
        inputDocuments.stream().map(InjectDocumentInput::getDocumentId).toList();
    List<String> currentDocumentIds =
        inject.getDocuments().stream().map(document -> document.getDocument().getId()).toList();
    // To delete
    List<InjectDocument> toRemoveDocuments =
        injectDocuments.stream()
            .filter(injectDoc -> !askedDocumentIds.contains(injectDoc.getDocument().getId()))
            .toList();
    injectDocuments.removeAll(toRemoveDocuments);
    // To add
    inputDocuments.stream()
        .filter(doc -> !currentDocumentIds.contains(doc.getDocumentId()))
        .forEach(
            in -> {
              Optional<Document> doc = this.documentRepository.findById(in.getDocumentId());
              if (doc.isPresent()) {
                InjectDocument injectDocument = new InjectDocument();
                injectDocument.setInject(inject);
                Document document = doc.get();
                injectDocument.setDocument(document);
                injectDocument.setAttached(in.isAttached());
                InjectDocument savedInjectDoc = this.injectDocumentRepository.save(injectDocument);
                injectDocuments.add(savedInjectDoc);
              }
            });
    // Remap the attached boolean
    injectDocuments.forEach(
        injectDoc -> {
          Optional<InjectDocumentInput> inputInjectDoc =
              input.getDocuments().stream()
                  .filter(id -> id.getDocumentId().equals(injectDoc.getDocument().getId()))
                  .findFirst();
          Boolean attached = inputInjectDoc.map(InjectDocumentInput::isAttached).orElse(false);
          injectDoc.setAttached(attached);
        });
    inject.setDocuments(injectDocuments);

    return inject;
  }

  private Inject updateInjectActivation(
      @NotBlank final String injectId, @NotNull final InjectUpdateActivationInput input) {
    Inject inject =
        this.injectRepository.findById(injectId).orElseThrow(ElementNotFoundException::new);
    inject.setEnabled(input.isEnabled());
    inject.setUpdatedAt(now());
    return injectRepository.save(inject);
  }
}
