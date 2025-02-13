package io.openbas.database.model;

import static io.openbas.database.model.Endpoint.ENDPOINT_TYPE;
import static io.openbas.database.specification.InjectSpecification.VALID_TESTABLE_TYPES;
import static java.time.Instant.now;
import static java.util.Optional.ofNullable;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.openbas.annotation.Queryable;
import io.openbas.database.audit.ModelBaseListener;
import io.openbas.database.converter.ContentConverter;
import io.openbas.database.raw.*;
import io.openbas.helper.*;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.java.Log;
import org.hibernate.annotations.UuidGenerator;

@Setter
@Entity
@Table(name = "injects")
@EntityListeners(ModelBaseListener.class)
@Log
public class Inject implements Base, Injection {

  public static final int SPEED_STANDARD = 1; // Standard speed define by the user.
  public static final String ID_COLUMN_NAME = "inject_id";
  public static final String ID_FIELD_NAME = "id";

  public static final Comparator<Inject> executionComparator =
      (o1, o2) -> {
        if (o1.getDate().isPresent() && o2.getDate().isPresent()) {
          return o1.getDate().get().compareTo(o2.getDate().get());
        }
        return o1.getId().compareTo(o2.getId());
      };

  @Getter
  @Id
  @Column(name = ID_COLUMN_NAME)
  @GeneratedValue(generator = "UUID")
  @UuidGenerator
  @JsonProperty("inject_id")
  @NotBlank
  private String id;

  @Getter
  @Queryable(filterable = true, searchable = true, sortable = true)
  @Column(name = "inject_title")
  @JsonProperty("inject_title")
  @NotBlank
  private String title;

  @Getter
  @Column(name = "inject_description")
  @JsonProperty("inject_description")
  private String description;

  @Getter
  @Column(name = "inject_country")
  @JsonProperty("inject_country")
  private String country;

  @Getter
  @Column(name = "inject_city")
  @JsonProperty("inject_city")
  private String city;

  @Getter
  @Column(name = "inject_enabled")
  @JsonProperty("inject_enabled")
  private boolean enabled = true;

  @Getter
  @Column(name = "inject_trigger_now_date")
  @JsonProperty("inject_trigger_now_date")
  private Instant triggerNowDate;

  @Getter
  @Column(name = "inject_content")
  @Convert(converter = ContentConverter.class)
  @JsonProperty("inject_content")
  private ObjectNode content;

  @Getter
  @Column(name = "inject_created_at")
  @JsonProperty("inject_created_at")
  @NotNull
  private Instant createdAt = now();

  @Getter
  @Column(name = "inject_updated_at")
  @Queryable(filterable = true, sortable = true)
  @JsonProperty("inject_updated_at")
  @NotNull
  private Instant updatedAt = now();

  @Getter
  @Column(name = "inject_all_teams")
  @JsonProperty("inject_all_teams")
  private boolean allTeams;

  @Getter
  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "inject_exercise")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @JsonProperty("inject_exercise")
  @Schema(type = "string")
  private Exercise exercise;

  @Getter
  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "inject_scenario")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @JsonProperty("inject_scenario")
  @Schema(type = "string")
  private Scenario scenario;

  @Getter
  @OneToMany(
      mappedBy = "compositeId.injectChildren",
      fetch = FetchType.EAGER,
      orphanRemoval = true,
      cascade = CascadeType.ALL)
  @JsonProperty("inject_depends_on")
  private List<InjectDependency> dependsOn = new ArrayList<>();

  @Getter
  @Column(name = "inject_depends_duration")
  @JsonProperty("inject_depends_duration")
  @NotNull
  @Min(value = 0L, message = "The value must be positive")
  @Queryable(sortable = true)
  private Long dependsDuration;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "inject_injector_contract")
  @JsonProperty("inject_injector_contract")
  @Queryable(filterable = true, dynamicValues = true, path = "injectorContract.injector.id")
  private InjectorContract injectorContract;

  @Getter
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "inject_user")
  @JsonSerialize(using = MonoIdDeserializer.class)
  @JsonProperty("inject_user")
  @Schema(type = "string")
  private User user;

  // CascadeType.ALL is required here because inject status are embedded
  @OneToOne(mappedBy = "inject", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonProperty("inject_status")
  @Queryable(filterable = true, sortable = true)
  private InjectStatus status;

  @ArraySchema(schema = @Schema(type = "string"))
  @Getter
  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "injects_tags",
      joinColumns = @JoinColumn(name = "inject_id"),
      inverseJoinColumns = @JoinColumn(name = "tag_id"))
  @JsonSerialize(using = MultiIdSetDeserializer.class)
  @JsonProperty("inject_tags")
  @Queryable(filterable = true, dynamicValues = true)
  private Set<Tag> tags = new HashSet<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @Getter
  @ManyToMany(fetch = FetchType.EAGER)
  @JoinTable(
      name = "injects_teams",
      joinColumns = @JoinColumn(name = "inject_id"),
      inverseJoinColumns = @JoinColumn(name = "team_id"))
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("inject_teams")
  @Queryable(filterable = true, dynamicValues = true, path = "teams.id")
  private List<Team> teams = new ArrayList<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @Getter
  @ManyToMany(fetch = FetchType.EAGER)
  @JoinTable(
      name = "injects_assets",
      joinColumns = @JoinColumn(name = "inject_id"),
      inverseJoinColumns = @JoinColumn(name = "asset_id"))
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("inject_assets")
  @Queryable(filterable = true, dynamicValues = true, path = "assets.id")
  private List<Asset> assets = new ArrayList<>();

  @ArraySchema(schema = @Schema(type = "string"))
  @Getter
  @ManyToMany(fetch = FetchType.EAGER)
  @JoinTable(
      name = "injects_asset_groups",
      joinColumns = @JoinColumn(name = "inject_id"),
      inverseJoinColumns = @JoinColumn(name = "asset_group_id"))
  @JsonSerialize(using = MultiIdListDeserializer.class)
  @JsonProperty("inject_asset_groups")
  @Queryable(filterable = true, dynamicValues = true, path = "assetGroups.id")
  private List<AssetGroup> assetGroups = new ArrayList<>();

  // CascadeType.ALL is required here because of complex relationships
  @ArraySchema(schema = @Schema(type = "string"))
  @Getter
  @OneToMany(
      mappedBy = "inject",
      fetch = FetchType.EAGER,
      cascade = CascadeType.ALL,
      orphanRemoval = true)
  @JsonProperty("inject_documents")
  @JsonSerialize(using = MultiModelDeserializer.class)
  private List<InjectDocument> documents = new ArrayList<>();

  // CascadeType.ALL is required here because communications are embedded
  @ArraySchema(schema = @Schema(type = "string"))
  @Getter
  @OneToMany(
      mappedBy = "inject",
      fetch = FetchType.EAGER,
      cascade = CascadeType.ALL,
      orphanRemoval = true)
  @JsonProperty("inject_communications")
  @JsonSerialize(using = MultiModelDeserializer.class)
  private List<Communication> communications = new ArrayList<>();

  // CascadeType.ALL is required here because expectations are embedded
  @ArraySchema(schema = @Schema(type = "string"))
  @Getter
  @OneToMany(
      mappedBy = "inject",
      fetch = FetchType.EAGER,
      cascade = CascadeType.ALL,
      orphanRemoval = true)
  @JsonProperty("inject_expectations")
  @JsonSerialize(using = MultiModelDeserializer.class)
  private List<InjectExpectation> expectations = new ArrayList<>();

  @Getter @Setter @Transient private boolean isListened = true;

  // region transient
  @Transient
  public String getHeader() {
    return ofNullable(this.getExercise()).map(Exercise::getHeader).orElse("");
  }

  @Transient
  public String getFooter() {
    return ofNullable(this.getExercise()).map(Exercise::getFooter).orElse("");
  }

  @JsonIgnore
  @Override
  public boolean isUserHasAccess(User user) {
    return this.getExercise().isUserHasAccess(user);
  }

  @JsonIgnore
  public void clean() {
    this.status = null;
    this.communications.clear();
    this.expectations.clear();
  }

  @JsonProperty("inject_users_number")
  public long getNumberOfTargetUsers() {
    if (this.getExercise() == null) {
      return 0L;
    }
    if (this.isAllTeams()) {
      return this.getExercise().usersNumber();
    }
    return getTeams().stream()
        .map(team -> team.getUsersNumberInExercise(getExercise().getId()))
        .reduce(Long::sum)
        .orElse(0L);
  }

  @JsonProperty("inject_ready")
  public boolean isReady() {
    return InjectModelHelper.isReady(
        getInjectorContract().orElse(null),
        getContent(),
        isAllTeams(),
        getTeams().stream().map(Team::getId).collect(Collectors.toList()),
        getAssets().stream().map(Asset::getId).collect(Collectors.toList()),
        getAssetGroups().stream().map(AssetGroup::getId).collect(Collectors.toList()));
  }

  @JsonIgnore
  public Instant computeInjectDate(Instant source, int speed) {
    return InjectModelHelper.computeInjectDate(source, speed, getDependsDuration(), getExercise());
  }

  @JsonProperty("inject_date")
  public Optional<Instant> getDate() {
    // If a trigger now was executed for this inject linked to an exercise, we ignore pauses and we
    // set inject inside of a range of execution
    if (getExercise() != null && triggerNowDate != null) {
      Optional<Instant> exerciseStartOpt = getExercise().getStart();
      if (exerciseStartOpt.isPresent()
          && (exerciseStartOpt.get().equals(triggerNowDate)
              || exerciseStartOpt.get().isBefore(triggerNowDate))) {
        return Optional.of(now().minusSeconds(60));
      }
    }
    return InjectModelHelper.getDate(getExercise(), getScenario(), getDependsDuration());
  }

  @JsonIgnore
  public Inject getInject() {
    return this;
  }

  @JsonIgnore
  public boolean isNotExecuted() {
    return this.getStatus().isEmpty();
  }

  @JsonIgnore
  public boolean isPastInject() {
    return this.getDate().map(date -> date.isBefore(now())).orElse(false);
  }

  @JsonIgnore
  public boolean isFutureInject() {
    return this.getDate().map(date -> date.isAfter(now())).orElse(false);
  }

  // endregion

  public Optional<InjectorContract> getInjectorContract() {
    return Optional.ofNullable(this.injectorContract);
  }

  public Optional<InjectStatus> getStatus() {
    return ofNullable(this.status);
  }

  public List<InjectExpectation> getUserExpectationsForArticle(User user, Article article) {
    return this.expectations.stream()
        .filter(execution -> execution.getType().equals(InjectExpectation.EXPECTATION_TYPE.ARTICLE))
        .filter(execution -> execution.getArticle().equals(article))
        .filter(
            execution ->
                execution.getUser()
                    != null) // We include only the expectations from players, because the
        // validation link is always from a player
        .filter(execution -> execution.getUser().equals(user))
        .toList();
  }

  @JsonProperty("inject_communications_number")
  public long getCommunicationsNumber() {
    return this.getCommunications().size();
  }

  @JsonProperty("inject_communications_not_ack_number")
  public long getCommunicationsNotAckNumber() {
    return this.getCommunications().stream()
        .filter(communication -> !communication.getAck())
        .count();
  }

  @JsonProperty("inject_sent_at")
  public Instant getSentAt() {
    return InjectModelHelper.getSentAt(this.getStatus());
  }

  @JsonProperty("inject_kill_chain_phases")
  @Queryable(
      filterable = true,
      dynamicValues = true,
      path = "injectorContract.attackPatterns.killChainPhases.id")
  public List<KillChainPhase> getKillChainPhases() {
    return getInjectorContract()
        .map(
            injectorContract ->
                injectorContract.getAttackPatterns().stream()
                    .flatMap(attackPattern -> attackPattern.getKillChainPhases().stream())
                    .distinct()
                    .collect(Collectors.toList()))
        .orElseGet(ArrayList::new);
  }

  @JsonProperty("inject_attack_patterns")
  public List<AttackPattern> getAttackPatterns() {
    return getInjectorContract().map(InjectorContract::getAttackPatterns).orElseGet(ArrayList::new);
  }

  @JsonProperty("inject_type")
  @Queryable(filterable = true, path = "injectorContract.labels", clazz = Map.class)
  private String getType() {
    return getInjectorContract()
        .map(InjectorContract::getInjector)
        .map(Injector::getType)
        .orElse(null);
  }

  @JsonIgnore
  @JsonProperty("inject_platforms")
  @Queryable(filterable = true, path = "injectorContract.platforms", clazz = String[].class)
  private Endpoint.PLATFORM_TYPE[] getPlatforms() {
    return getInjectorContract()
        .map(InjectorContract::getPlatforms)
        .orElse(new Endpoint.PLATFORM_TYPE[0]);
  }

  @JsonIgnore
  public boolean isAtomicTesting() {
    return this.exercise == null && this.scenario == null;
  }

  @JsonProperty("inject_testable")
  public boolean getInjectTestable() {
    return VALID_TESTABLE_TYPES.contains(this.getType());
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || !Base.class.isAssignableFrom(o.getClass())) {
      return false;
    }
    Base base = (Base) o;
    return id.equals(base.getId());
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }

  /**
   * Creates an Inject from a Raw Inject
   *
   * @param rawInject the raw inject to convert
   * @param rawTeams the map of the teams containing at least the ones linked to this inject
   * @param rawInjectExpectationMap the map of the expectations containing at least the ones linked
   *     to this inject
   * @param mapOfAssetGroups the map of the asset groups containing at least the ones linked to this
   *     inject
   * @param mapOfAsset the map of the asset containing at least the ones linked to this inject and
   *     the asset groups linked to it
   * @return an Inject
   */
  public static Inject fromRawInject(
      RawInject rawInject,
      Map<String, RawTeam> rawTeams,
      Map<String, RawInjectExpectation> rawInjectExpectationMap,
      Map<String, RawAssetGroup> mapOfAssetGroups,
      Map<String, RawAsset> mapOfAsset) {
    // Create the object
    Inject inject = new Inject();
    inject.setId(rawInject.getInject_id());

    // Set a list of expectations
    inject.setExpectations(new ArrayList<>());
    for (String expectationId : rawInject.getInject_expectations()) {
      RawInjectExpectation rawInjectExpectation = rawInjectExpectationMap.get(expectationId);
      if (rawInjectExpectation != null) {
        // Create a new expectation
        InjectExpectation expectation = new InjectExpectation();
        expectation.setId(rawInjectExpectation.getInject_expectation_id());
        expectation.setType(
            InjectExpectation.EXPECTATION_TYPE.valueOf(
                rawInjectExpectation.getInject_expectation_type()));
        expectation.setScore(rawInjectExpectation.getInject_expectation_score());
        expectation.setExpectedScore(rawInjectExpectation.getInject_expectation_expected_score());
        expectation.setExpectationGroup(rawInjectExpectation.getInject_expectation_group());

        // Add the team of the expectation
        if (rawInjectExpectation.getTeam_id() != null) {
          RawTeam rawTeam = rawTeams.get(rawInjectExpectation.getTeam_id());
          if (rawTeam != null) {
            Team team = new Team();
            team.setId(rawInjectExpectation.getTeam_id());
            team.setName(rawTeam.getTeam_name());
            expectation.setTeam(team);
          }
        }

        // Add the asset group of the expectation
        if (rawInjectExpectation.getAsset_group_id() != null) {
          RawAssetGroup rawAssetGroup =
              mapOfAssetGroups.get(rawInjectExpectation.getAsset_group_id());
          if (rawAssetGroup != null) {
            AssetGroup assetGroup = new AssetGroup();
            assetGroup.setId(rawAssetGroup.getAsset_group_id());
            assetGroup.setName(rawAssetGroup.getAsset_group_name());
            assetGroup.setAssets(new ArrayList<>());

            // We add the assets to the asset group
            if (rawAssetGroup.getAsset_ids() != null) {
              for (String assetId : rawAssetGroup.getAsset_ids()) {
                RawAsset rawAsset = mapOfAsset.get(assetId);
                if (rawAsset != null) {
                  if (rawAsset.getAsset_type().equals(ENDPOINT_TYPE)) {
                    Endpoint endpoint =
                        new Endpoint(
                            rawAsset.getAsset_id(),
                            rawAsset.getAsset_type(),
                            rawAsset.getAsset_name(),
                            Endpoint.PLATFORM_TYPE.valueOf(rawAsset.getEndpoint_platform()));
                    assetGroup.getAssets().add(endpoint);
                  } else {
                    Asset asset =
                        new Asset(
                            rawAsset.getAsset_id(),
                            rawAsset.getAsset_type(),
                            rawAsset.getAsset_name());
                    assetGroup.getAssets().add(asset);
                  }
                }
              }
            }
            expectation.setAssetGroup(assetGroup);
          }
        }

        // We add the asset to the expectation
        if (rawInjectExpectation.getAsset_id() != null) {
          RawAsset rawAsset = mapOfAsset.get(rawInjectExpectation.getAsset_id());
          if (rawAsset != null) {
            if (rawAsset.getAsset_type().equals(ENDPOINT_TYPE)) {
              Endpoint endpoint =
                  new Endpoint(
                      rawAsset.getAsset_id(),
                      rawAsset.getAsset_type(),
                      rawAsset.getAsset_name(),
                      Endpoint.PLATFORM_TYPE.valueOf(rawAsset.getEndpoint_platform()));
              expectation.setAsset(endpoint);
            } else {
              Asset asset =
                  new Asset(
                      rawAsset.getAsset_id(), rawAsset.getAsset_type(), rawAsset.getAsset_name());
              expectation.setAsset(asset);
            }
          }
        }
        inject.getExpectations().add(expectation);
      }
    }

    // We add the teams to the inject
    ArrayList<Team> injectTeams = new ArrayList<>();
    for (String injectTeamId : rawInject.getInject_teams()) {
      Team team = new Team();
      team.setId(rawTeams.get(injectTeamId).getTeam_id());
      team.setName(rawTeams.get(injectTeamId).getTeam_name());
      injectTeams.add(team);
    }
    inject.setTeams(injectTeams);

    // We add the assets to the inject
    ArrayList<Asset> injectAssets = new ArrayList<>();
    for (String injectAssetId : rawInject.getInject_assets()) {
      RawAsset rawAsset = mapOfAsset.get(injectAssetId);

      if (rawAsset == null) {
        continue; // Skip to the next iteration
      }

      if ("Endpoint".equals(rawAsset.getAsset_type())) {
        Endpoint endpoint =
            new Endpoint(
                rawAsset.getAsset_id(),
                rawAsset.getAsset_type(),
                rawAsset.getAsset_name(),
                Endpoint.PLATFORM_TYPE.valueOf(rawAsset.getEndpoint_platform()));
        injectAssets.add(endpoint);
      } else {
        Asset newAsset =
            new Asset(rawAsset.getAsset_id(), rawAsset.getAsset_type(), rawAsset.getAsset_name());
        injectAssets.add(newAsset);
      }
    }
    inject.setAssets(injectAssets);

    // Add the asset groups to the inject
    ArrayList<AssetGroup> injectAssetGroups = new ArrayList<>();
    for (String injectAssetGroupId : rawInject.getInject_asset_groups()) {
      Optional<RawAssetGroup> rawAssetGroup =
          Optional.ofNullable(mapOfAssetGroups.get(injectAssetGroupId));
      rawAssetGroup.ifPresent(
          rag -> {
            AssetGroup assetGroup = new AssetGroup();
            assetGroup.setName(rag.getAsset_group_name());
            assetGroup.setId(rag.getAsset_group_id());

            // We add the assets linked to the asset group
            assetGroup.setAssets(
                rag.getAsset_ids().stream()
                    .map(
                        assetId -> {
                          RawAsset rawAsset = mapOfAsset.get(assetId);
                          if (rawAsset == null) {
                            return null;
                          }

                          if ("Endpoint".equals(rawAsset.getAsset_type())) {
                            return new Endpoint(
                                rawAsset.getAsset_id(),
                                rawAsset.getAsset_type(),
                                rawAsset.getAsset_name(),
                                Endpoint.PLATFORM_TYPE.valueOf(rawAsset.getEndpoint_platform()));
                          } else {
                            return new Asset(
                                rawAsset.getAsset_id(),
                                rawAsset.getAsset_type(),
                                rawAsset.getAsset_name());
                          }
                        })
                    .filter(Objects::nonNull)
                    .toList());
            injectAssetGroups.add(assetGroup);
          });
    }

    inject.setAssetGroups(injectAssetGroups);

    return inject;
  }
}
