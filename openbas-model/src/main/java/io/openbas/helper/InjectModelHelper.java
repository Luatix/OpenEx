package io.openbas.helper;

import static io.openbas.database.model.Inject.SPEED_STANDARD;
import static io.openbas.database.model.InjectorContract.*;
import static java.time.Duration.between;
import static java.time.Instant.now;
import static java.util.Optional.ofNullable;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.openbas.database.model.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.StreamSupport;

public class InjectModelHelper {

  private InjectModelHelper() {}

  public static boolean isReady(
      InjectorContract injectorContract,
      ObjectNode content,
      boolean allTeams,
      @NotNull final List<String> teams,
      @NotNull final List<String> assets,
      @NotNull final List<String> assetGroups) {
    if (injectorContract == null || content == null) {
      return false;
    }

    ObjectMapper mapper = new ObjectMapper();
    ArrayNode injectContractFields;

    try {
      injectContractFields =
          (ArrayNode)
              mapper
                  .readValue(injectorContract.getContent(), ObjectNode.class)
                  .get(CONTACT_CONTENT_FIELDS);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Error parsing injector contract content", e);
    }

    ObjectNode contractContent = injectorContract.getConvertedContent();
    List<JsonNode> contractFields =
        StreamSupport.stream(contractContent.get(CONTACT_CONTENT_FIELDS).spliterator(), false)
            .toList();

    boolean isReady = true;
    for (JsonNode jsonField : contractFields) {

      // if field is mandatory or if field is asset, check if the field is set
      String key = jsonField.get(CONTACT_ELEMENT_CONTENT_KEY).asText();
      if (jsonField.get(CONTACT_ELEMENT_CONTENT_MANDATORY).asBoolean()
          || (jsonField.hasNonNull(CONTACT_ELEMENT_CONTENT_MANDATORY_GROUPS)
                  && jsonField.get(CONTACT_ELEMENT_CONTENT_MANDATORY_GROUPS).asBoolean()
              || CONTACT_ELEMENT_CONTENT_KEY_ASSETS.equals(key))) {
        isReady =
            isFieldSet(
                allTeams, teams, assets, assetGroups, jsonField, content, injectContractFields);
      }

      // if field is mandatory conditional, if the conditional field is set check if the current
      // field is set
      if (jsonField.hasNonNull(CONTACT_ELEMENT_CONTENT_MANDATORY_CONDITIONAL)) {
        String mandatoryOnConditionFieldKey =
            jsonField.get(CONTACT_ELEMENT_CONTENT_MANDATORY_CONDITIONAL).asText();
        Optional<JsonNode> mandatoryOnConditionField =
            contractFields.stream()
                .filter(
                    jsonNode ->
                        mandatoryOnConditionFieldKey.equals(
                            jsonNode.get(CONTACT_ELEMENT_CONTENT_KEY).asText()))
                .findFirst();
        if (mandatoryOnConditionField.isPresent()) {
          if (isFieldSet(
                  allTeams,
                  teams,
                  assets,
                  assetGroups,
                  mandatoryOnConditionField.get(),
                  content,
                  injectContractFields)
              && !isFieldSet(
                  allTeams, teams, assets, assetGroups, jsonField, content, injectContractFields)) {
            isReady = false;
          }
        } else {
          isReady = false;
        }
      }
      if (!isReady) {
        break;
      }
    }

    return isReady;
  }

  private static boolean isTextOrTextarea(JsonNode jsonField) {
    String type = jsonField.get("type").asText();
    return "text".equals(type) || "textarea".equals(type);
  }

  private static boolean isFieldValid(
      ObjectNode content, ArrayNode injectContractFields, String key) {
    JsonNode fieldValue = content.get(key);
    if (fieldValue == null || fieldValue.asText().isEmpty()) {
      for (JsonNode contractField : injectContractFields) {
        if (key.equals(contractField.get(CONTACT_ELEMENT_CONTENT_KEY).asText())) {
          JsonNode defaultValue = contractField.get(DEFAULT_VALUE_FIELD);
          if (defaultValue == null || defaultValue.isNull()) {
            return false;
          }
        }
      }
    }

    return true;
  }

  public static Instant computeInjectDate(
      Instant source, int speed, Long dependsDuration, Exercise exercise) {
    // Compute origin execution date
    long duration = ofNullable(dependsDuration).orElse(0L) / speed;
    Instant standardExecutionDate = source.plusSeconds(duration);
    // Compute execution dates with previous terminated pauses
    Instant afterPausesExecutionDate = standardExecutionDate;
    List<Pause> sortedPauses = new ArrayList<>();
    if (exercise != null) {
      sortedPauses.addAll(
          exercise.getPauses().stream()
              .sorted(
                  (pause0, pause1) ->
                      pause0.getDate().equals(pause1.getDate())
                          ? 0
                          : pause0.getDate().isBefore(pause1.getDate()) ? -1 : 1)
              .toList());
    }
    long previousPauseDelay = 0L;
    for (Pause pause : sortedPauses) {
      if (pause.getDate().isAfter(afterPausesExecutionDate)) {
        break;
      }
      previousPauseDelay += pause.getDuration().orElse(0L);
      afterPausesExecutionDate = standardExecutionDate.plusSeconds(previousPauseDelay);
    }

    // Add current pause duration in date computation if needed
    long currentPauseDelay = 0;
    Instant finalAfterPausesExecutionDate = afterPausesExecutionDate;
    if (exercise != null) {
      currentPauseDelay =
          exercise
              .getCurrentPause()
              .filter(pauseTime -> pauseTime.isBefore(finalAfterPausesExecutionDate))
              .map(pauseTime -> between(pauseTime, now()).getSeconds())
              .orElse(0L);
    }
    long globalPauseDelay = previousPauseDelay + currentPauseDelay;
    long minuteAlignModulo = globalPauseDelay % 60;
    long alignedPauseDelay =
        minuteAlignModulo > 0 ? globalPauseDelay + (60 - minuteAlignModulo) : globalPauseDelay;
    return standardExecutionDate.plusSeconds(alignedPauseDelay);
  }

  public static Optional<Instant> getDate(
      Exercise exercise, Scenario scenario, Long dependsDuration) {
    if (exercise == null && scenario == null) {
      return Optional.ofNullable(now().minusSeconds(30));
    }

    if (scenario != null) {
      return Optional.empty();
    }

    if (exercise != null) {
      if (exercise.getStatus().equals(ExerciseStatus.CANCELED)) {
        return Optional.empty();
      }
      return exercise
          .getStart()
          .map(source -> computeInjectDate(source, SPEED_STANDARD, dependsDuration, exercise));
    }
    return Optional.ofNullable(LocalDateTime.now().toInstant(ZoneOffset.UTC));
  }

  public static Instant getSentAt(Optional<InjectStatus> status) {
    if (status.isPresent()) {
      return status.orElseThrow().getTrackingSentDate();
    }
    return null;
  }

  public static boolean isFieldSet(
      final boolean allTeams,
      @NotNull final List<String> teams,
      @NotNull final List<String> assets,
      @NotNull final List<String> assetGroups,
      @NotNull final JsonNode jsonField,
      @NotNull final ObjectNode content,
      @NotNull final ArrayNode injectContractFields) {
    boolean isSet = true;
    String key = jsonField.get(CONTACT_ELEMENT_CONTENT_KEY).asText();
    switch (key) {
      case CONTACT_ELEMENT_CONTENT_KEY_TEAMS -> {
        if (teams.isEmpty() && !allTeams) {
          isSet = false;
        }
      }
      case CONTACT_ELEMENT_CONTENT_KEY_ASSETS -> {
        if (assets.isEmpty() && assetGroups.isEmpty()) {
          isSet = false;
        }
      }
      default -> {
        if (isTextOrTextarea(jsonField) && !isFieldValid(content, injectContractFields, key)) {
          isSet = false;
        } else if (content.get(key) == null
            || (content.get(key).isArray() && content.get(key).isEmpty())
            || (content.get(key).isObject() && content.get(key).isEmpty())
            || (content.get(key).isTextual() && content.get(key).asText().isEmpty())) {
          isSet = false;
        }
      }
    }
    return isSet;
  }
}
