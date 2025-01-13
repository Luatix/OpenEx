package io.openbas.service;

import static io.openbas.utils.pagination.PaginationUtils.buildPaginationJPA;

import com.cronutils.utils.VisibleForTesting;
import io.openbas.database.model.AssetGroup;
import io.openbas.database.model.Tag;
import io.openbas.database.model.TagRule;
import io.openbas.database.repository.AssetGroupRepository;
import io.openbas.database.repository.TagRepository;
import io.openbas.database.repository.TagRuleRepository;
import io.openbas.rest.exception.ElementNotFoundException;
import io.openbas.utils.pagination.SearchPaginationInput;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class TagRuleService {
  private final TagRuleRepository tagRuleRepository;
  private final TagRepository tagRepository;
  private final AssetGroupRepository assetGroupRepository;

  public Optional<TagRule> findById(String id) {
    return tagRuleRepository.findById(id);
  }

  public List<TagRule> findAll() {
    return StreamSupport.stream(tagRuleRepository.findAll().spliterator(), false)
        .collect(Collectors.toList());
  }

  public TagRule createTagRule(@NotBlank final String tagName, final List<String> assetGroupIds) {
    // if the tag  or one of the asset group doesn't exist we exist throw a ElementNotFoundException
    TagRule tagRule = new TagRule();
    tagRule.setTag(getTag(tagName));
    tagRule.setAssetGroups(getAssetGroups(assetGroupIds));
    return tagRuleRepository.save(tagRule);
  }

  public TagRule updateTagRule(
      @NotBlank final String tagRuleId, final String tagName, final List<String> assetGroupIds) {

    // verify that the tag rule exists
    TagRule tagRule =
        tagRuleRepository
            .findById(tagRuleId)
            .orElseThrow(
                () -> new ElementNotFoundException("TagRule not found with id: " + tagRuleId));

    tagRule.setTag(getTag(tagName));

    // if one of the asset groups doesn't exist throw a ResourceNotFoundException
    tagRule.setAssetGroups(getAssetGroups(assetGroupIds));

    return tagRuleRepository.save(tagRule);
  }

  public Page<TagRule> searchTagRule(SearchPaginationInput searchPaginationInput) {
    return buildPaginationJPA(tagRuleRepository::findAll, searchPaginationInput, TagRule.class);
  }

  public void deleteTagRule(@NotBlank final String tagRuleId) {
    // verify that the TagRule exists
    tagRuleRepository
        .findById(tagRuleId)
        .orElseThrow(() -> new ElementNotFoundException("TagRule not found with id: " + tagRuleId));
    tagRuleRepository.deleteById(tagRuleId);
  }

  @VisibleForTesting
  protected Tag getTag(@NotBlank final String tagName) {
    // TODO: tag name normalization needs to be implemented in a reusable method
    return tagRepository
        .findByName(tagName.toLowerCase())
        .orElseThrow(() -> new ElementNotFoundException("Tag not found with name: " + tagName));
  }

  /**
   * Return the set of asset groups to add from a tag id list
   *
   * @param tagIds
   * @return set of asset groups to add by default
   */
  public List<AssetGroup> getAssetGroupsFromTagIds(@NotNull final List<String> tagIds) {
    return this.tagRuleRepository.findByTags(tagIds).stream()
        .flatMap(tagRule -> tagRule.getAssetGroups().stream())
        .toList();
  }

  /**
   * Apply the rule to add the default asset groups to the input asset groups during Injects
   * creation
   *
   * @param tagIds list of Asset Groups of the Inject before applying the rules
   * @param inputAssetGroups list of Asset Groups of the Inject before applying the rules
   * @return return the new list of Asset Groups
   */
  public List<AssetGroup> applyTagRuleToInjectCreation(
      List<String> tagIds, List<AssetGroup> inputAssetGroups) {

    List<AssetGroup> defaultAssetGroups = this.getAssetGroupsFromTagIds(tagIds);

    // remove duplicates
    Set<String> uniqueAssetGrousIds = new HashSet<>();
    return Stream.concat(inputAssetGroups.stream(), defaultAssetGroups.stream())
        .filter(assetGroup -> uniqueAssetGrousIds.add(assetGroup.getId()))
        .toList();
  }

  @VisibleForTesting
  protected List<AssetGroup> getAssetGroups(final List<String> assetGroupIds) {
    return assetGroupIds == null
        ? new ArrayList<>()
        : assetGroupIds.stream()
            .map(
                id ->
                    assetGroupRepository
                        .findById(id)
                        .orElseThrow(
                            () ->
                                new ElementNotFoundException(
                                    "Asset Group not found with id: " + id)))
            .collect(Collectors.toList());
  }
}
