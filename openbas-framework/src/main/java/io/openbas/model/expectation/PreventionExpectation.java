package io.openbas.model.expectation;

import static io.openbas.database.model.InjectExpectation.EXPECTATION_TYPE.PREVENTION;

import io.openbas.database.model.*;
import io.openbas.database.model.InjectExpectation.EXPECTATION_TYPE;
import io.openbas.model.Expectation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Objects;
import javax.annotation.Nullable;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PreventionExpectation implements Expectation {

  private Double score;
  private String name;
  private String description;
  private Agent agent;
  private Asset asset;
  private AssetGroup assetGroup;
  private boolean expectationGroup;
  private Long expirationTime;
  private List<InjectExpectationSignature> injectExpectationSignatures;

  private PreventionExpectation() {}

  @Override
  public EXPECTATION_TYPE type() {
    return PREVENTION;
  }

  public static PreventionExpectation preventionExpectationForAgent(
      @NotNull Agent agent,
      @NotNull Asset asset,
      @NotNull PreventionExpectation endpointExpectation,
      List<InjectExpectationSignature> injectExpectationSignatures) {
    PreventionExpectation preventionExpectation = new PreventionExpectation();
    preventionExpectation.setScore(
        Objects.requireNonNullElse(endpointExpectation.getScore(), 100.0));
    preventionExpectation.setName(endpointExpectation.getName());
    preventionExpectation.setDescription(endpointExpectation.getDescription());
    preventionExpectation.setAgent(agent);
    preventionExpectation.setAsset(asset);
    preventionExpectation.setExpirationTime(endpointExpectation.getExpirationTime());
    preventionExpectation.setInjectExpectationSignatures(injectExpectationSignatures);
    return preventionExpectation;
  }

  public static PreventionExpectation preventionExpectationForAsset(
      @Nullable final Double score,
      @NotBlank final String name,
      final String description,
      @NotNull final Asset asset,
      final boolean expectationGroup,
      final Long expirationTime) {
    PreventionExpectation endpointExpectation = new PreventionExpectation();
    endpointExpectation.setScore(Objects.requireNonNullElse(score, 100.0));
    endpointExpectation.setName(name);
    endpointExpectation.setDescription(description);
    endpointExpectation.setAsset(asset);
    endpointExpectation.setExpectationGroup(expectationGroup);
    endpointExpectation.setExpirationTime(expirationTime);
    return endpointExpectation;
  }

  public static PreventionExpectation preventionExpectationForAssetGroup(
      @Nullable final Double score,
      @NotBlank final String name,
      final String description,
      @NotNull final AssetGroup assetGroup,
      final boolean expectationGroup,
      @NotNull final Long expirationTime) {
    PreventionExpectation preventionExpectation = new PreventionExpectation();
    preventionExpectation.setScore(Objects.requireNonNullElse(score, 100.0));
    preventionExpectation.setName(name);
    preventionExpectation.setDescription(description);
    preventionExpectation.setAssetGroup(assetGroup);
    preventionExpectation.setExpectationGroup(expectationGroup);
    preventionExpectation.setExpirationTime(expirationTime);
    return preventionExpectation;
  }
}
