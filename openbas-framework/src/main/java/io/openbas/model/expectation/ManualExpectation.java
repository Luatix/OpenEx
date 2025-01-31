package io.openbas.model.expectation;

import static io.openbas.database.model.InjectExpectation.EXPECTATION_TYPE;

import io.openbas.database.model.Asset;
import io.openbas.database.model.AssetGroup;
import io.openbas.model.Expectation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Objects;
import javax.annotation.Nullable;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode
public class ManualExpectation implements Expectation {

  private Double score;
  private String name;
  private String description;
  private Asset asset;
  private AssetGroup assetGroup;
  private boolean expectationGroup;
  private Long expirationTime;

  public ManualExpectation() {}

  public ManualExpectation(final Double score) {
    this.score = Objects.requireNonNullElse(score, 100.0);
  }

  public ManualExpectation(io.openbas.model.inject.form.Expectation expectation) {
    this(expectation.getScore());
    this.name = expectation.getName();
    this.description = expectation.getDescription();
    this.expectationGroup = expectation.isExpectationGroup();
    this.expirationTime = expectation.getExpirationTime();
  }

  public static ManualExpectation manualExpectationForAsset(
      @Nullable final Double score,
      @NotBlank final String name,
      final String description,
      @NotNull final Asset asset,
      final Long expirationTime,
      final boolean expectationGroup) {
    ManualExpectation manualExpectation = new ManualExpectation();
    manualExpectation.setScore(Objects.requireNonNullElse(score, 100.0));
    manualExpectation.setName(name);
    manualExpectation.setDescription(description);
    manualExpectation.setAsset(asset);
    manualExpectation.setExpirationTime(expirationTime);
    manualExpectation.setExpectationGroup(expectationGroup);
    return manualExpectation;
  }

  public static ManualExpectation manualExpectationForAssetGroup(
      @Nullable final Double score,
      @NotBlank final String name,
      final String description,
      @NotNull final AssetGroup assetGroup,
      final Long expirationTime,
      final boolean expectationGroup) {
    ManualExpectation manualExpectation = new ManualExpectation();
    manualExpectation.setScore(Objects.requireNonNullElse(score, 100.0));
    manualExpectation.setName(name);
    manualExpectation.setDescription(description);
    manualExpectation.setAssetGroup(assetGroup);
    manualExpectation.setExpirationTime(expirationTime);
    manualExpectation.setExpectationGroup(expectationGroup);
    return manualExpectation;
  }

  @Override
  public EXPECTATION_TYPE type() {
    return EXPECTATION_TYPE.MANUAL;
  }
}
