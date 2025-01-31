package io.openbas.rest.inject.service;

import static io.openbas.utils.FilterUtilsJpa.*;
import static io.openbas.utils.StringUtils.duplicateString;
import static io.openbas.utils.pagination.SearchUtilsJpa.computeSearchJpa;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.openbas.database.model.*;
import io.openbas.database.model.InjectStatus;
import io.openbas.database.repository.InjectDocumentRepository;
import io.openbas.database.repository.InjectRepository;
import io.openbas.database.repository.InjectStatusRepository;
import io.openbas.database.repository.TeamRepository;
import io.openbas.database.specification.InjectSpecification;
import io.openbas.injector_contract.ContractType;
import io.openbas.rest.atomic_testing.form.InjectResultOverviewOutput;
import io.openbas.rest.exception.BadRequestException;
import io.openbas.rest.exception.ElementNotFoundException;
import io.openbas.rest.inject.form.InjectBulkProcessingInput;
import io.openbas.rest.inject.form.InjectBulkUpdateOperation;
import io.openbas.rest.inject.form.InjectBulkUpdateSupportedOperations;
import io.openbas.rest.security.SecurityExpression;
import io.openbas.rest.security.SecurityExpressionHandler;
import io.openbas.service.AssetGroupService;
import io.openbas.service.AssetService;
import io.openbas.utils.InjectMapper;
import io.openbas.utils.InjectUtils;
import io.openbas.utils.JpaUtils;
import jakarta.annotation.Resource;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.*;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

@RequiredArgsConstructor
@Service
@Log
public class InjectService {

  private final TeamRepository teamRepository;
  private final AssetService assetService;
  private final AssetGroupService assetGroupService;
  private final InjectRepository injectRepository;
  private final InjectDocumentRepository injectDocumentRepository;
  private final InjectStatusRepository injectStatusRepository;
  private final InjectMapper injectMapper;
  private final MethodSecurityExpressionHandler methodSecurityExpressionHandler;

  @Resource protected ObjectMapper mapper;

  public Inject inject(@NotBlank final String injectId) {
    return this.injectRepository
        .findById(injectId)
        .orElseThrow(() -> new ElementNotFoundException("Inject not found with id: " + injectId));
  }

  @Transactional(rollbackOn = Exception.class)
  public void deleteAllByIds(List<String> injectIds) {
    if (!CollectionUtils.isEmpty(injectIds)) {
      injectRepository.deleteAllById(injectIds);
    }
  }

  /**
   * Delete all injects given as params
   *
   * @param injects the injects to delete
   */
  @Transactional(rollbackOn = Exception.class)
  public void deleteAll(List<Inject> injects) {
    if (!CollectionUtils.isEmpty(injects)) {
      injectRepository.deleteAll(injects);
    }
  }

  public Map<Asset, Boolean> resolveAllAssetsToExecute(@NotNull final Inject inject) {
    Map<Asset, Boolean> assets = new HashMap<>();
    inject
        .getAssets()
        .forEach(
            (asset -> assets.put(asset, false)));
    inject
        .getAssetGroups()
        .forEach(
            (assetGroup -> {
              List<Asset> assetsFromGroup =
                  this.assetGroupService.assetsFromAssetGroup(assetGroup.getId());
              // Verify asset validity
              assetsFromGroup.forEach(
                  (asset) -> assets.put(asset, true));
            }));
    return assets;
  }

  public void cleanInjectsDocExercise(String exerciseId, String documentId) {
    // Delete document from all exercise injects
    List<Inject> exerciseInjects =
        injectRepository.findAllForExerciseAndDoc(exerciseId, documentId);
    List<InjectDocument> updatedInjects =
        exerciseInjects.stream()
            .flatMap(
                inject -> {
                  @SuppressWarnings("UnnecessaryLocalVariable")
                  Stream<InjectDocument> filterDocuments =
                      inject.getDocuments().stream()
                          .filter(document -> document.getDocument().getId().equals(documentId));
                  return filterDocuments;
                })
            .toList();
    injectDocumentRepository.deleteAll(updatedInjects);
  }

  public <T> T convertInjectContent(@NotNull final Inject inject, @NotNull final Class<T> converter)
      throws Exception {
    ObjectNode content = inject.getContent();
    return this.mapper.treeToValue(content, converter);
  }

  public void cleanInjectsDocScenario(String scenarioId, String documentId) {
    // Delete document from all scenario injects
    List<Inject> scenarioInjects =
        injectRepository.findAllForScenarioAndDoc(scenarioId, documentId);
    List<InjectDocument> updatedInjects =
        scenarioInjects.stream()
            .flatMap(
                inject -> {
                  @SuppressWarnings("UnnecessaryLocalVariable")
                  Stream<InjectDocument> filterDocuments =
                      inject.getDocuments().stream()
                          .filter(document -> document.getDocument().getId().equals(documentId));
                  return filterDocuments;
                })
            .toList();
    injectDocumentRepository.deleteAll(updatedInjects);
  }

  @Transactional
  public InjectResultOverviewOutput duplicate(String id) {
    Inject duplicatedInject = findAndDuplicateInject(id);
    duplicatedInject.setTitle(duplicateString(duplicatedInject.getTitle()));
    Inject savedInject = injectRepository.save(duplicatedInject);
    return injectMapper.toInjectResultOverviewOutput(savedInject);
  }

  @Transactional
  public InjectResultOverviewOutput launch(String id) {
    Inject inject = injectRepository.findById(id).orElseThrow(ElementNotFoundException::new);
    inject.clean();
    inject.setUpdatedAt(Instant.now());
    Inject savedInject = saveInjectAndStatusAsQueuing(inject);
    return injectMapper.toInjectResultOverviewOutput(savedInject);
  }

  @Transactional
  public InjectResultOverviewOutput relaunch(String id) {
    Inject duplicatedInject = findAndDuplicateInject(id);
    Inject savedInject = saveInjectAndStatusAsQueuing(duplicatedInject);
    delete(id);
    return injectMapper.toInjectResultOverviewOutput(savedInject);
  }

  @Transactional
  public void delete(String id) {
    injectDocumentRepository.deleteDocumentsFromInject(id);
    injectRepository.deleteById(id);
  }

  /**
   * Update an inject with default asset groups
   *
   * @param injectId
   * @param defaultAssetGroupsToAdd
   * @return
   */
  @Transactional
  public Inject applyDefaultAssetGroupsToInject(
      final String injectId, final List<AssetGroup> defaultAssetGroupsToAdd) {

    // fetch the inject
    Inject inject =
        this.injectRepository.findById(injectId).orElseThrow(ElementNotFoundException::new);

    // remove/add default asset groups and remove duplicates
    List<AssetGroup> currentAssetGroups = inject.getAssetGroups();

    Set<String> uniqueAssetGroupIds = new HashSet<>();
    List<AssetGroup> newListOfAssetGroups =
        Stream.concat(currentAssetGroups.stream(), defaultAssetGroupsToAdd.stream())
            .filter(assetGroup -> uniqueAssetGroupIds.add(assetGroup.getId()))
            .collect(Collectors.toList());

    if (new HashSet<>(currentAssetGroups).equals(new HashSet<>(newListOfAssetGroups))) {
      return inject;
    } else {
      inject.setAssetGroups(newListOfAssetGroups);
      return this.injectRepository.save(inject);
    }
  }

  /**
   * Check if asset can be applied to a specific inject (will return false for Manual/Email...
   * injects)
   *
   * @param inject
   * @return
   */
  public boolean canApplyAssetGroupToInject(final Inject inject) {

    JsonNode jsonNode = null;
    try {
      jsonNode = mapper.readTree(inject.getInjectorContract().orElseThrow().getContent());
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Unable to injector contract", e);
    }
    return !StreamSupport.stream(jsonNode.get("fields").spliterator(), false)
        .filter(
            contractElement ->
                contractElement.get("type").asText().equals(ContractType.AssetGroup.label))
        .toList()
        .isEmpty();
  }

  private Inject findAndDuplicateInject(String id) {
    Inject injectOrigin = injectRepository.findById(id).orElseThrow(ElementNotFoundException::new);
    return InjectUtils.duplicateInject(injectOrigin);
  }

  private Inject saveInjectAndStatusAsQueuing(Inject inject) {
    Inject savedInject = injectRepository.save(inject);
    InjectStatus injectStatus = saveInjectStatusAsQueuing(savedInject);
    savedInject.setStatus(injectStatus);
    return savedInject;
  }

  private InjectStatus saveInjectStatusAsQueuing(Inject inject) {
    InjectStatus injectStatus = new InjectStatus();
    injectStatus.setInject(inject);
    injectStatus.setTrackingSentDate(Instant.now());
    injectStatus.setName(ExecutionStatus.QUEUING);
    this.injectStatusRepository.save(injectStatus);
    return injectStatus;
  }

  /**
   * Get the inject specification for the search pagination input
   *
   * @param input the search input
   * @return the inject specification to search in DB
   * @throws BadRequestException if neither of the searchPaginationInput or injectIDsToSearch is
   *     provided
   */
  public Specification<Inject> getInjectSpecification(final InjectBulkProcessingInput input) {
    if ((CollectionUtils.isEmpty(input.getInjectIDsToProcess())
            && (input.getSearchPaginationInput() == null))
        || (!CollectionUtils.isEmpty(input.getInjectIDsToProcess())
            && (input.getSearchPaginationInput() != null))) {
      throw new BadRequestException(
          "Either inject_ids_to_process or search_pagination_input must be provided, and not both at the same time");
    }
    Specification<Inject> filterSpecifications =
        InjectSpecification.fromScenarioOrSimulation(input.getSimulationOrScenarioId());
    if (input.getSearchPaginationInput() == null) {
      filterSpecifications =
          filterSpecifications.and(
              JpaUtils.computeIn(Inject.ID_FIELD_NAME, input.getInjectIDsToProcess()));
    } else {
      filterSpecifications =
          filterSpecifications.and(
              computeFilterGroupJpa(input.getSearchPaginationInput().getFilterGroup()));
      filterSpecifications =
          filterSpecifications.and(
              computeSearchJpa(input.getSearchPaginationInput().getTextSearch()));
    }
    if (!CollectionUtils.isEmpty(input.getInjectIDsToIgnore())) {
      filterSpecifications =
          filterSpecifications.and(
              JpaUtils.computeNotIn(Inject.ID_FIELD_NAME, input.getInjectIDsToIgnore()));
    }
    return filterSpecifications;
  }

  /**
   * Update injects in bulk corresponding to the given criteria with a list of operations
   *
   * @param injectsToUpdate list of injects to update
   * @param operations the operations to perform with fields and values to add, remove or replace
   * @return the list of updated injects
   */
  public List<Inject> bulkUpdateInject(
      final List<Inject> injectsToUpdate, final List<InjectBulkUpdateOperation> operations) {
    // We aggregate the different field values in distinct sets in order to avoid retrieving the
    // same data multiple times
    Set<String> teamsIDs = new HashSet<>();
    Set<String> assetsIDs = new HashSet<>();
    Set<String> assetGroupsIDs = new HashSet<>();
    for (var operation : operations) {
      if (CollectionUtils.isEmpty(operation.getValues())) continue;

      switch (operation.getField()) {
        case TEAMS -> teamsIDs.addAll(operation.getValues());
        case ASSETS -> assetsIDs.addAll(operation.getValues());
        case ASSET_GROUPS -> assetGroupsIDs.addAll(operation.getValues());
        default ->
            throw new BadRequestException("Invalid field to update: " + operation.getOperation());
      }
    }

    // We retrieve the data from DB for teams, assets and asset groups in the input values
    Map<String, Team> teamsFromDB =
        this.teamRepository.findAllById(teamsIDs).stream()
            .collect(Collectors.toMap(Team::getId, team -> team));
    Map<String, Asset> assetsFromDB =
        this.assetService.assets(assetsIDs.stream().toList()).stream()
            .collect(Collectors.toMap(Asset::getId, asset -> asset));
    Map<String, AssetGroup> assetGroupsFromDB =
        this.assetGroupService.assetGroups(assetGroupsIDs.stream().toList()).stream()
            .collect(Collectors.toMap(AssetGroup::getId, assetGroup -> assetGroup));

    // we update the injects values
    injectsToUpdate.forEach(
        inject ->
            applyUpdateOperation(inject, operations, teamsFromDB, assetsFromDB, assetGroupsFromDB));

    // Save updated injects and return them
    return this.injectRepository.saveAll(injectsToUpdate);
  }

  /**
   * Get the injects to update/delete and check if the user is allowed to update/delete them
   *
   * @param input the injects search input.
   * @return the injects to update/delete
   * @throws AccessDeniedException if the user is not allowed to update/delete the injects
   */
  public List<Inject> getInjectsAndCheckIsPlanner(InjectBulkProcessingInput input) {
    // Control and format inputs
    // Specification building
    Specification<Inject> filterSpecifications = getInjectSpecification(input);

    // Services calls
    // Bulk select
    List<Inject> injectsToProcess = this.injectRepository.findAll(filterSpecifications);

    // Assert that the user is allowed to delete the injects
    // Can't use PreAuthorized as we don't have the data about involved scenarios and simulations

    isPlanner(injectsToProcess, Inject::getScenario, SecurityExpression::isScenarioPlanner);
    isPlanner(injectsToProcess, Inject::getExercise, SecurityExpression::isSimulationPlanner);
    return injectsToProcess;
  }

  /**
   * Check if the user is allowed to delete the injects from the scenario or exercise
   *
   * @param injects the injects to check
   * @param scenarioOrExercise the function to get the scenario or exercise from the inject
   * @param isPlannerFunction the function to check if the user is a planner for the scenario or
   *     exercise
   * @throws AccessDeniedException if the user is not allowed to delete the injects from the
   *     scenario or exercise
   */
  public <T extends Base> void isPlanner(
      List<Inject> injects,
      Function<Inject, T> scenarioOrExercise,
      BiFunction<SecurityExpression, String, Boolean> isPlannerFunction) {
    Set<String> scenarioOrExerciseIds =
        injects.stream()
            .filter(inject -> scenarioOrExercise.apply(inject) != null)
            .map(inject -> scenarioOrExercise.apply(inject).getId())
            .collect(Collectors.toSet());

    for (String scenarioOrExerciseId : scenarioOrExerciseIds) {
      if (!isPlannerFunction.apply(
          ((SecurityExpressionHandler) methodSecurityExpressionHandler).getSecurityExpression(),
          scenarioOrExerciseId)) {
        throw new AccessDeniedException(
            "You are not allowed to delete the injects from the scenario or exercise "
                + scenarioOrExerciseId);
      }
    }
  }

  /**
   * Update the inject with the given input
   *
   * @param injectToUpdate the inject to update
   * @param operations the operation to perform, with the values to add, remove or replace
   * @param teamsFromDB the teams from the DB, coming from the input values
   * @param assetsFromDB the assets from the DB, coming from the input values
   * @param assetGroupsFromDB the asset groups from the DB, coming from the input values
   */
  private void applyUpdateOperation(
      Inject injectToUpdate,
      List<InjectBulkUpdateOperation> operations,
      Map<String, Team> teamsFromDB,
      Map<String, Asset> assetsFromDB,
      Map<String, AssetGroup> assetGroupsFromDB) {
    if (CollectionUtils.isEmpty(operations)) return;

    for (var operation : operations) {
      switch (operation.getField()) {
        case TEAMS ->
            updateInjectEntities(
                injectToUpdate.getTeams(),
                operation.getValues(),
                teamsFromDB,
                operation.getOperation());
        case ASSETS ->
            updateInjectEntities(
                injectToUpdate.getAssets(),
                operation.getValues(),
                assetsFromDB,
                operation.getOperation());
        case ASSET_GROUPS ->
            updateInjectEntities(
                injectToUpdate.getAssetGroups(),
                operation.getValues(),
                assetGroupsFromDB,
                operation.getOperation());
        default ->
            throw new BadRequestException("Invalid field to update: " + operation.getField());
      }
    }
  }

  /**
   * Update the inject entities
   *
   * @param injectEntities the inject entities to update
   * @param newValuesIDs the IDs of the value to add, remove or replace
   * @param entitiesFromDB the entities from the DB
   * @param operation the operation to apply
   * @param <T> the type of the entities
   */
  private <T> void updateInjectEntities(
      List<T> injectEntities,
      List<String> newValuesIDs,
      Map<String, T> entitiesFromDB,
      InjectBulkUpdateSupportedOperations operation) {
    if (operation == InjectBulkUpdateSupportedOperations.REPLACE) injectEntities.clear();
    newValuesIDs.forEach(
        id -> {
          T entity = entitiesFromDB.get(id);
          if (entity == null) {
            log.warning("Inject update entity with ID " + id + " not found in the DB");
            return;
          }

          switch (operation) {
            case REPLACE, ADD -> {
              if (!injectEntities.contains(entity)) injectEntities.add(entity);
            }
            case REMOVE -> injectEntities.remove(entity);
            default ->
                throw new BadRequestException(
                    "Invalid operation to update inject entities: " + operation);
          }
        });
  }
}
