package io.openbas.utils;

import static io.openbas.database.model.Command.COMMAND_TYPE;
import static io.openbas.database.model.DnsResolution.DNS_RESOLUTION_TYPE;
import static io.openbas.database.model.Executable.EXECUTABLE_TYPE;
import static io.openbas.database.model.FileDrop.FILE_DROP_TYPE;
import static io.openbas.database.model.NetworkTraffic.NETWORK_TRAFFIC_TYPE;
import static java.util.Optional.ofNullable;

import io.openbas.database.model.*;
import io.openbas.rest.atomic_testing.form.AttackPatternSimple;
import io.openbas.rest.atomic_testing.form.StatusPayloadOutput;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Component;

@Component
public class PayloadMapper {

  public StatusPayloadOutput getStatusPayloadOutputFromInject(Optional<Inject> inject) {
    StatusPayloadOutput.StatusPayloadOutputBuilder statusPayloadOutputBuilder =
        StatusPayloadOutput.builder();
    StatusPayloadOutput result = statusPayloadOutputBuilder.build();
    if (inject.isPresent()) {
      Optional<InjectorContract> injectorContractOpt = inject.get().getInjectorContract();
      if (injectorContractOpt.isPresent()) {
        InjectorContract injectorContract = injectorContractOpt.get();

        if (ofNullable(inject.get().getContent())
            .map(c -> c.has("obfuscator"))
            .orElse(Boolean.FALSE)) {
          String obfuscator = inject.get().getContent().findValue("obfuscator").asText();
          statusPayloadOutputBuilder.obfuscator(obfuscator);
        }

        if (inject.get().getStatus().isEmpty()) {
          Payload payload = injectorContract.getPayload();
          statusPayloadOutputBuilder
              .arguments(payload.getArguments())
              .prerequisites(payload.getPrerequisites())
              .externalId(payload.getExternalId())
              .cleanupExecutor(payload.getCleanupExecutor())
              .name(injectorContract.getPayload().getName())
              .type(injectorContract.getPayload().getType())
              .collectorType(injectorContract.getPayload().getCollectorType())
              .description(injectorContract.getPayload().getDescription())
              .platforms(injectorContract.getPayload().getPlatforms())
              .attackPatterns(toAttackPatternSimples(injectorContract.getAttackPatterns()))
              .executableArch(injectorContract.getArch());
          if (COMMAND_TYPE.equals(injectorContract.getPayload().getType())) {
            Command payloadCommand = (Command) Hibernate.unproxy(payload);
            List<String> cleanupCommands = new ArrayList<>();
            if (payloadCommand.getCleanupCommand() != null) {
              cleanupCommands.add(payloadCommand.getCleanupCommand());
            }
            List<PayloadCommandBlock> payloadCommandBlocks = new ArrayList<>();
            PayloadCommandBlock payloadCommandBlock =
                new PayloadCommandBlock(
                    payloadCommand.getExecutor(), payloadCommand.getContent(), cleanupCommands);
            payloadCommandBlocks.add(payloadCommandBlock);
            statusPayloadOutputBuilder.payloadCommandBlocks(payloadCommandBlocks);
          } else if (EXECUTABLE_TYPE.equals(injectorContract.getPayload().getType())) {
            Executable payloadExecutable = (Executable) Hibernate.unproxy(payload);
            statusPayloadOutputBuilder.executableFile(
                new StatusPayloadDocument(payloadExecutable.getExecutableFile()));
          } else if (FILE_DROP_TYPE.equals(injectorContract.getPayload().getType())) {
            FileDrop payloadFileDrop = (FileDrop) Hibernate.unproxy(payload);
            statusPayloadOutputBuilder.fileDropFile(
                new StatusPayloadDocument(payloadFileDrop.getFileDropFile()));
          } else if (DNS_RESOLUTION_TYPE.equals(injectorContract.getPayload().getType())) {
            DnsResolution payloadDnsResolution = (DnsResolution) Hibernate.unproxy(payload);
            statusPayloadOutputBuilder.hostname(payloadDnsResolution.getHostname());
          } else if (NETWORK_TRAFFIC_TYPE.equals(injectorContract.getPayload().getType())) {
            NetworkTraffic payloadNetworkTraffic = (NetworkTraffic) Hibernate.unproxy(payload);
            statusPayloadOutputBuilder
                .protocol(payloadNetworkTraffic.getProtocol())
                .portSrc(payloadNetworkTraffic.getPortSrc())
                .portDst(payloadNetworkTraffic.getPortDst())
                .ipSrc(payloadNetworkTraffic.getIpSrc())
                .ipDst(payloadNetworkTraffic.getIpDst());
          }
          result = statusPayloadOutputBuilder.build();
        } else if (inject.get().getStatus().isPresent()
            && inject.get().getStatus().get().getPayloadOutput() != null) {
          // Commands lines saved because inject has been executed
          StatusPayload statusPayload = inject.get().getStatus().get().getPayloadOutput();
          statusPayloadOutputBuilder
              .cleanupExecutor(statusPayload.getCleanupExecutor())
              .payloadCommandBlocks(statusPayload.getPayloadCommandBlocks())
              .arguments(statusPayload.getArguments())
              .prerequisites(statusPayload.getPrerequisites())
              .externalId(statusPayload.getExternalId())
              .executableFile(statusPayload.getExecutableFile())
              .fileDropFile(statusPayload.getFileDropFile())
              .hostname(statusPayload.getHostname())
              .ipSrc(statusPayload.getIpSrc())
              .ipDst(statusPayload.getIpDst())
              .portSrc(statusPayload.getPortSrc())
              .portDst(statusPayload.getPortDst())
              .protocol(statusPayload.getProtocol())
              .name(injectorContract.getPayload().getName())
              .type(injectorContract.getPayload().getType())
              .collectorType(injectorContract.getPayload().getCollectorType())
              .description(injectorContract.getPayload().getDescription())
              .platforms(injectorContract.getPayload().getPlatforms())
              .attackPatterns(toAttackPatternSimples(injectorContract.getAttackPatterns()))
              .executableArch(injectorContract.getArch());
          result = statusPayloadOutputBuilder.build();

        } else {
          return null;
        }
      }
    }
    return result;
  }

  public List<AttackPatternSimple> toAttackPatternSimples(List<AttackPattern> attackPatterns) {
    return attackPatterns.stream()
        .filter(Objects::nonNull)
        .map(this::toAttackPatternSimple)
        .toList();
  }

  private AttackPatternSimple toAttackPatternSimple(AttackPattern attackPattern) {
    return AttackPatternSimple.builder()
        .id(attackPattern.getId())
        .name(attackPattern.getName())
        .externalId(attackPattern.getExternalId())
        .build();
  }
}
