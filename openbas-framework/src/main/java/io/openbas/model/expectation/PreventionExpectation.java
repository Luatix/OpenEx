package io.openbas.model.expectation;

import io.openbas.database.model.Asset;
import io.openbas.database.model.AssetGroup;
import io.openbas.database.model.InjectExpectation.EXPECTATION_TYPE;
import io.openbas.model.Expectation;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import javax.annotation.Nullable;
import java.util.Objects;

import static io.openbas.database.model.InjectExpectation.EXPECTATION_TYPE.PREVENTION;

@Getter
@Setter
public class PreventionExpectation implements Expectation {

  private Integer score;
  private Asset asset;
  private AssetGroup assetGroup;
  private boolean expectationGroup;

  private PreventionExpectation() {}

  @Override
  public EXPECTATION_TYPE type() {
    return PREVENTION;
  }

  public static PreventionExpectation preventionExpectationForAsset(
      @Nullable final Integer score,
      @NotNull final Asset asset,
      boolean expectationGroup) {
    PreventionExpectation preventionExpectation = new PreventionExpectation();
    preventionExpectation.setScore(Objects.requireNonNullElse(score, 100));
    preventionExpectation.setAsset(asset);
    preventionExpectation.setExpectationGroup(expectationGroup);
    return preventionExpectation;
  }

  public static PreventionExpectation preventionExpectationForAssetGroup(
      @Nullable final Integer score,
      @NotNull final AssetGroup assetGroup,
      boolean expectationGroup) {
    PreventionExpectation preventionExpectation = new PreventionExpectation();
    preventionExpectation.setScore(Objects.requireNonNullElse(score, 100));
    preventionExpectation.setAssetGroup(assetGroup);
    preventionExpectation.setExpectationGroup(expectationGroup);
    return preventionExpectation;
  }

}
