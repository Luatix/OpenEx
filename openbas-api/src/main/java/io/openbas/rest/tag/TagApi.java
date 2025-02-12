package io.openbas.rest.tag;

import static io.openbas.database.model.User.ROLE_ADMIN;
import static io.openbas.database.specification.TagSpecification.byName;
import static io.openbas.helper.StreamHelper.fromIterable;
import static io.openbas.utils.pagination.PaginationUtils.buildPaginationJPA;

import io.openbas.aop.UserRoleDescription;
import io.openbas.database.model.Tag;
import io.openbas.database.repository.TagRepository;
import io.openbas.rest.exception.ElementNotFoundException;
import io.openbas.rest.helper.RestBehavior;
import io.openbas.rest.tag.form.TagCreateInput;
import io.openbas.rest.tag.form.TagUpdateInput;
import io.openbas.utils.FilterUtilsJpa;
import io.openbas.utils.pagination.SearchPaginationInput;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

@RestController
@io.swagger.v3.oas.annotations.tags.Tag(
    name = "Tags management",
    description = "Endpoints to manage tags")
@UserRoleDescription
public class TagApi extends RestBehavior {

  public static final String TAG_URI = "/api/tags";

  private TagRepository tagRepository;

  @Autowired
  public void setTagRepository(TagRepository tagRepository) {
    this.tagRepository = tagRepository;
  }

  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "All the existing tags")})
  @Operation(description = "Get the list of tags", summary = "Get tags")
  @GetMapping("/api/tags")
  public Iterable<Tag> tags() {
    return tagRepository.findAll();
  }

  @ApiResponses(
      value = {
        @ApiResponse(
            responseCode = "200",
            description = "All the existing tags corresponding to the search criteria")
      })
  @Operation(description = "Search tags corresponding to the criteria", summary = "Search tags")
  @PostMapping("/api/tags/search")
  public Page<Tag> tags(@RequestBody @Valid SearchPaginationInput searchPaginationInput) {
    return buildPaginationJPA(
        (Specification<Tag> specification, Pageable pageable) ->
            this.tagRepository.findAll(specification, pageable),
        searchPaginationInput,
        Tag.class);
  }

  @Secured(ROLE_ADMIN)
  @PutMapping("/api/tags/{tagId}")
  @Transactional(rollbackOn = Exception.class)
  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "The updated tag")})
  @Operation(description = "Update a tag", summary = "Update tag")
  public Tag updateTag(
      @PathVariable @Schema(description = "ID of the tag") String tagId,
      @Valid @RequestBody TagUpdateInput input) {
    Tag tag = tagRepository.findById(tagId).orElseThrow(ElementNotFoundException::new);
    tag.setUpdateAttributes(input);
    return tagRepository.save(tag);
  }

  @Secured(ROLE_ADMIN)
  @PostMapping("/api/tags")
  @Transactional(rollbackOn = Exception.class)
  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "The created tag")})
  @Operation(description = "Create a tag", summary = "Create tag")
  public Tag createTag(@Valid @RequestBody TagCreateInput input) {
    Tag tag = new Tag();
    tag.setUpdateAttributes(input);
    return tagRepository.save(tag);
  }

  @Secured(ROLE_ADMIN)
  @PostMapping("/api/tags/upsert")
  @Transactional(rollbackOn = Exception.class)
  @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "The upserted tag")})
  @Operation(description = "Upsert a tag", summary = "Upsert tag")
  public Tag upsertTag(@Valid @RequestBody TagCreateInput input) {
    Optional<Tag> tag = tagRepository.findByName(input.getName());
    if (tag.isPresent()) {
      return tag.get();
    } else {
      Tag newTag = new Tag();
      newTag.setUpdateAttributes(input);
      return tagRepository.save(newTag);
    }
  }

  @Secured(ROLE_ADMIN)
  @DeleteMapping("/api/tags/{tagId}")
  @ApiResponses(value = {@ApiResponse(responseCode = "200")})
  @Operation(description = "Delete a tag", summary = "Delete tag")
  public void deleteTag(@PathVariable @Schema(description = "ID of the tag") String tagId) {
    tagRepository.deleteById(tagId);
  }

  // -- OPTION --

  @GetMapping(TAG_URI + "/options")
  @ApiResponses(
      value = {@ApiResponse(responseCode = "200", description = "The list of tags corresponding")})
  @Operation(
      description = "Get a list of tag IDs and labels corresponding to the text search",
      summary = "Search tags by text")
  public List<FilterUtilsJpa.Option> optionsByName(
      @RequestParam(required = false) @Schema(description = "Search text")
          final String searchText) {
    return fromIterable(
            this.tagRepository.findAll(byName(searchText), Sort.by(Sort.Direction.ASC, "name")))
        .stream()
        .map(i -> new FilterUtilsJpa.Option(i.getId(), i.getName()))
        .toList();
  }

  @PostMapping(TAG_URI + "/options")
  @ApiResponses(
      value = {@ApiResponse(responseCode = "200", description = "The list of tags corresponding")})
  @Operation(
      description = "Get a list of tag IDs and labels corresponding to a list of IDs",
      summary = "Search tags by ids")
  public List<FilterUtilsJpa.Option> optionsById(@RequestBody final List<String> ids) {
    return fromIterable(this.tagRepository.findAllById(ids)).stream()
        .map(i -> new FilterUtilsJpa.Option(i.getId(), i.getName()))
        .toList();
  }
}
