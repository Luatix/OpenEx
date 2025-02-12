package io.openbas.rest.asset_group;

import static io.openbas.database.model.User.ROLE_USER;
import static io.openbas.database.specification.AssetGroupSpecification.byName;
import static io.openbas.database.specification.AssetGroupSpecification.fromIds;
import static io.openbas.helper.StreamHelper.fromIterable;
import static io.openbas.helper.StreamHelper.iterableToSet;

import io.openbas.aop.LogExecutionTime;
import io.openbas.database.model.AssetGroup;
import io.openbas.database.repository.AssetGroupRepository;
import io.openbas.database.repository.TagRepository;
import io.openbas.rest.asset_group.form.AssetGroupInput;
import io.openbas.rest.asset_group.form.AssetGroupOutput;
import io.openbas.rest.asset_group.form.UpdateAssetsOnAssetGroupInput;
import io.openbas.rest.exception.ElementNotFoundException;
import io.openbas.rest.helper.RestBehavior;
import io.openbas.service.AssetGroupService;
import io.openbas.telemetry.Tracing;
import io.openbas.utils.FilterUtilsJpa;
import io.openbas.utils.pagination.SearchPaginationInput;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Secured(ROLE_USER)
public class AssetGroupApi extends RestBehavior {

  public static final String ASSET_GROUP_URI = "/api/asset_groups";

  private final AssetGroupService assetGroupService;
  private final AssetGroupCriteriaBuilderService assetGroupCriteriaBuilderService;
  private final TagRepository tagRepository;
  private final AssetGroupRepository assetGroupRepository;

  @PostMapping(ASSET_GROUP_URI)
  @PreAuthorize("isPlanner()")
  @Transactional(rollbackFor = Exception.class)
  public AssetGroup createAssetGroup(@Valid @RequestBody final AssetGroupInput input) {
    AssetGroup assetGroup = new AssetGroup();
    assetGroup.setUpdateAttributes(input);
    assetGroup.setTags(iterableToSet(this.tagRepository.findAllById(input.getTagIds())));
    return this.assetGroupService.createAssetGroup(assetGroup);
  }

  @GetMapping(ASSET_GROUP_URI)
  @PreAuthorize("isObserver()")
  public List<AssetGroup> assetGroups() {
    return this.assetGroupService.assetGroups();
  }

  @LogExecutionTime
  @PostMapping(ASSET_GROUP_URI + "/search")
  @PreAuthorize("isObserver()")
  @Tracing(name = "Get a page of assetgroups", layer = "api", operation = "POST")
  public Page<AssetGroupOutput> assetGroups(
      @RequestBody @Valid SearchPaginationInput searchPaginationInput) {
    return this.assetGroupCriteriaBuilderService.assetGroupPagination(searchPaginationInput);
  }

  @PostMapping(ASSET_GROUP_URI + "/find")
  @PreAuthorize("isObserver()")
  @Transactional(readOnly = true)
  @Tracing(name = "Find asset groups", layer = "api", operation = "POST")
  public List<AssetGroupOutput> findAssetGroups(
      @RequestBody @Valid @NotNull final List<String> assetGroupIds) {
    return this.assetGroupCriteriaBuilderService.find(fromIds(assetGroupIds));
  }

  @GetMapping(ASSET_GROUP_URI + "/{assetGroupId}")
  @PreAuthorize("isObserver()")
  public AssetGroup assetGroup(@PathVariable @NotBlank final String assetGroupId) {
    return this.assetGroupService.assetGroup(assetGroupId);
  }

  @PutMapping(ASSET_GROUP_URI + "/{assetGroupId}")
  @PreAuthorize("isPlanner()")
  @Transactional(rollbackFor = Exception.class)
  public AssetGroup updateAssetGroup(
      @PathVariable @NotBlank final String assetGroupId,
      @Valid @RequestBody final AssetGroupInput input) {
    AssetGroup assetGroup = this.assetGroupService.assetGroup(assetGroupId);
    assetGroup.setUpdateAttributes(input);
    assetGroup.setTags(iterableToSet(this.tagRepository.findAllById(input.getTagIds())));
    return this.assetGroupService.updateAssetGroup(assetGroup);
  }

  @PutMapping(ASSET_GROUP_URI + "/{assetGroupId}/assets")
  @PreAuthorize("isPlanner()")
  @Transactional(rollbackFor = Exception.class)
  public AssetGroup updateAssetsOnAssetGroup(
      @PathVariable @NotBlank final String assetGroupId,
      @Valid @RequestBody final UpdateAssetsOnAssetGroupInput input) {
    AssetGroup assetGroup = this.assetGroupService.assetGroup(assetGroupId);
    return this.assetGroupService.updateAssetsOnAssetGroup(assetGroup, input.getAssetIds());
  }

  @DeleteMapping(ASSET_GROUP_URI + "/{assetGroupId}")
  @PreAuthorize("isPlanner()")
  @Transactional(rollbackFor = Exception.class)
  public void deleteAssetGroup(@PathVariable @NotBlank final String assetGroupId) {
    try {
      assetGroupService.assetGroup(assetGroupId);
    } catch (IllegalArgumentException ex) {
      throw new ElementNotFoundException(ex.getMessage());
    }
    this.assetGroupService.deleteAssetGroup(assetGroupId);
  }

  // -- OPTION --

  @GetMapping(ASSET_GROUP_URI + "/options")
  public List<FilterUtilsJpa.Option> optionsByName(
      @RequestParam(required = false) final String searchText) {
    return fromIterable(
            this.assetGroupRepository.findAll(
                byName(searchText), Sort.by(Sort.Direction.ASC, "name")))
        .stream()
        .map(i -> new FilterUtilsJpa.Option(i.getId(), i.getName()))
        .toList();
  }

  @PostMapping(ASSET_GROUP_URI + "/options")
  public List<FilterUtilsJpa.Option> optionsById(@RequestBody final List<String> ids) {
    return fromIterable(this.assetGroupRepository.findAllById(ids)).stream()
        .map(i -> new FilterUtilsJpa.Option(i.getId(), i.getName()))
        .toList();
  }
}
