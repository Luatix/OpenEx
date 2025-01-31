package io.openbas.utils.fixtures;

import io.openbas.database.model.Agent;
import io.openbas.database.model.AssetGroup;
import io.openbas.database.model.Endpoint;
import io.openbas.database.model.InjectExpectationSignature;
import io.openbas.model.expectation.DetectionExpectation;
import io.openbas.model.expectation.PreventionExpectation;
import io.openbas.rest.exercise.form.ExpectationUpdateInput;
import java.util.List;

public class ExpectationFixture {

  static Double SCORE = 100.0;

  public static PreventionExpectation createTechnicalPreventionExpectation(
      Agent agent,
      Endpoint endpoint,
      PreventionExpectation preventionExpectation,
      List<InjectExpectationSignature> signatures) {
    return PreventionExpectation.preventionExpectationForAgent(
        agent, endpoint, preventionExpectation, signatures);
  }

  public static DetectionExpectation createTechnicalDetectionExpectation(
      Agent agent,
      Endpoint endpoint,
      DetectionExpectation detectionExpectation,
      List<InjectExpectationSignature> signatures) {
    return DetectionExpectation.detectionExpectationForAgent(
        agent, endpoint, detectionExpectation, signatures);
  }

  public static PreventionExpectation createTechnicalPreventionExpectation(
      Endpoint endpoint, Long expirationTime) {
    return PreventionExpectation.preventionExpectationForAsset(
        SCORE, "Prevention", "Prevention Expectation", endpoint, false, expirationTime);
  }

  public static DetectionExpectation createTechnicalDetectionExpectation(
      Endpoint endpoint, Long expirationTime) {
    return DetectionExpectation.detectionExpectationForAsset(
        SCORE, "Detection", "Detection Expectation", endpoint, false, expirationTime);
  }

  public static PreventionExpectation createPreventionExpectationForAssetGroup(
      AssetGroup assetGroup, Long expirationTime) {
    return PreventionExpectation.preventionExpectationForAssetGroup(
        SCORE, "Prevention", "Prevention Expectation", assetGroup, false, expirationTime);
  }

  public static DetectionExpectation createDetectionExpectationForAssetGroup(
      AssetGroup assetGroup, Long expirationTime) {
    return DetectionExpectation.detectionExpectationForAssetGroup(
        SCORE, "Detection", "Detection Expectation", assetGroup, false, expirationTime);
  }

  public static ExpectationUpdateInput getExpectationUpdateInput(String sourceId, Double score) {
    return ExpectationUpdateInput.builder()
        .sourceId(sourceId)
        .sourceName("security-platform-name")
        .sourceType("security-platform-type")
        .score(score)
        .build();
  }
}
