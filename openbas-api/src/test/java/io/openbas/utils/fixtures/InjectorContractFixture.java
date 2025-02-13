package io.openbas.utils.fixtures;

import static io.openbas.database.model.InjectorContract.CONTACT_CONTENT_FIELDS;
import static io.openbas.utils.fixtures.InjectorFixture.createDefaultInjector;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.openbas.database.model.Injector;
import io.openbas.database.model.InjectorContract;
import io.openbas.database.model.Payload;
import io.openbas.injector_contract.ContractCardinality;
import io.openbas.injector_contract.fields.ContractSelect;
import lombok.SneakyThrows;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class InjectorContractFixture {

  private static ObjectNode createDefaultContent(ObjectMapper objectMapper) {
    ObjectNode node = objectMapper.createObjectNode();
    node.set(CONTACT_CONTENT_FIELDS, objectMapper.valueToTree(new ArrayList<>()));
    return node;
  }
  private static InjectorContract createPayloadInjectorContractInternal(
      Injector injector, Payload payloadCommand, List<ContractSelect> customContent)
      throws JsonProcessingException {
    InjectorContract injectorContract = new InjectorContract();
    injectorContract.setInjector(injector);
    injectorContract.setPayload(payloadCommand);
    injectorContract.setId(UUID.randomUUID().toString());

    ObjectMapper objectMapper = new ObjectMapper();
    ObjectNode content = createDefaultContent(objectMapper);
    content.set(CONTACT_CONTENT_FIELDS, objectMapper.valueToTree(customContent));

    injectorContract.setContent(objectMapper.writeValueAsString(content));
    injectorContract.setConvertedContent(content);

    return injectorContract;
  }

  @SneakyThrows
  public static InjectorContract createDefaultInjectorContract() {
    InjectorContract injectorContract = new InjectorContract();
    injectorContract.setInjector(createDefaultInjector());
    injectorContract.setId(UUID.randomUUID().toString());

    ObjectMapper objectMapper = new ObjectMapper();
    ObjectNode content = createDefaultContent(objectMapper);
    injectorContract.setContent(objectMapper.writeValueAsString(content));
    injectorContract.setConvertedContent(content);
    return injectorContract;
  }

  public static InjectorContract createPayloadInjectorContract(
      Injector injector, Payload payloadCommand) throws JsonProcessingException {
    return createPayloadInjectorContractInternal(injector, payloadCommand, List.of());
  }

  public static InjectorContract createPayloadInjectorContractWithObfuscator(
      Injector injector, Payload payloadCommand) throws JsonProcessingException {
    ContractSelect obfuscatorSelect =
        new ContractSelect("obfuscator", "Obfuscators", ContractCardinality.One);
    obfuscatorSelect.setChoices(Map.of("plain-text", "plain-text", "base64", "base64"));

    return createPayloadInjectorContractInternal(
        injector, payloadCommand, List.of(obfuscatorSelect));
  }

  public static InjectorContract createInjectorContract(
      Map<String, String> labels, String content) {
    InjectorContract injectorContract = new InjectorContract();
    injectorContract.setId(UUID.randomUUID().toString());
    injectorContract.setLabels(labels);
    injectorContract.setContent(content);
    injectorContract.setAtomicTesting(true);
    injectorContract.setCreatedAt(Instant.now());
    injectorContract.setUpdatedAt(Instant.now());
    return injectorContract;
  }
}
