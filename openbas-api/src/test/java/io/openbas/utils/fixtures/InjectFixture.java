package io.openbas.utils.fixtures;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.openbas.database.model.*;
import io.openbas.injectors.challenge.model.ChallengeContent;
import java.util.List;
import java.util.Map;

public class InjectFixture {

  public static final String INJECT_EMAIL_NAME = "Test email inject";
  public static final String INJECT_CHALLENGE_NAME = "Test challenge inject";

  private static Inject createInject(InjectorContract injectorContract, String title) {
    Inject inject = new Inject();
    inject.setTitle(title);
    inject.setInjectorContract(injectorContract);
    inject.setEnabled(true);
    inject.setDependsDuration(0L);
    return inject;
  }

  public static Inject createDefaultInjectEmail(InjectorContract injectorContract) {
    return createInject(injectorContract, INJECT_EMAIL_NAME);
  }

  public static Inject createDefaultInjectChallenge(
      InjectorContract injectorContract, ObjectMapper objectMapper, List<String> challengeIds) {
    Inject inject = createInject(injectorContract, INJECT_CHALLENGE_NAME);

    ChallengeContent content = new ChallengeContent();
    content.setChallenges(challengeIds);
    inject.setContent(objectMapper.valueToTree(content));
    return inject;
  }

  public static Inject createInjectCommandPayload(
      InjectorContract injectorContract, Map<String, String> payloadArguments) {

    Inject inject = createInject(injectorContract, "Inject title");
    ObjectMapper objectMapper = new ObjectMapper();
    ObjectNode injectContent = objectMapper.createObjectNode();
    payloadArguments.forEach(
        (key, value) -> injectContent.set(key, objectMapper.convertValue(value, JsonNode.class)));
    inject.setContent(injectContent);

    return inject;
  }
}
