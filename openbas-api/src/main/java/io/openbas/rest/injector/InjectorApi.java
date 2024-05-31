package io.openbas.rest.injector;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import io.openbas.config.RabbitmqConfig;
import io.openbas.database.model.AttackPattern;
import io.openbas.database.model.Injector;
import io.openbas.database.model.InjectorContract;
import io.openbas.database.repository.AttackPatternRepository;
import io.openbas.database.repository.InjectorContractRepository;
import io.openbas.database.repository.InjectorRepository;
import io.openbas.rest.exception.ElementNotFoundException;
import io.openbas.rest.helper.RestBehavior;
import io.openbas.rest.injector.form.InjectorCreateInput;
import io.openbas.rest.injector.form.InjectorUpdateInput;
import io.openbas.rest.injector.response.InjectorConnection;
import io.openbas.rest.injector.response.InjectorRegistration;
import io.openbas.rest.injector_contract.form.InjectorContractInput;
import io.openbas.service.FileService;
import jakarta.annotation.Resource;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.*;

import static io.openbas.asset.QueueService.EXCHANGE_KEY;
import static io.openbas.asset.QueueService.ROUTING_KEY;
import static io.openbas.database.model.User.ROLE_ADMIN;
import static io.openbas.helper.StreamHelper.fromIterable;

@Log
@RestController
public class InjectorApi extends RestBehavior {

    @Resource
    private RabbitmqConfig rabbitmqConfig;

    private AttackPatternRepository attackPatternRepository;

    private InjectorRepository injectorRepository;

    private InjectorContractRepository injectorContractRepository;

    private FileService fileService;

    @Resource
    protected ObjectMapper mapper;

    @Autowired
    public void setFileService(FileService fileService) {
        this.fileService = fileService;
    }

    @Autowired
    public void setAttackPatternRepository(AttackPatternRepository attackPatternRepository) {
        this.attackPatternRepository = attackPatternRepository;
    }

    @Autowired
    public void setInjectorRepository(InjectorRepository injectorRepository) {
        this.injectorRepository = injectorRepository;
    }

    @Autowired
    public void setInjectorContractRepository(InjectorContractRepository injectorContractRepository) {
        this.injectorContractRepository = injectorContractRepository;
    }

    @GetMapping("/api/injectors")
    public Iterable<Injector> injectors() {
        return injectorRepository.findAll();
    }

    @GetMapping("/api/injectors/{injectorId}/injector_contracts")
    public Collection<JsonNode> injectorInjectTypes(@PathVariable String injectorId) {
        Injector injector = injectorRepository.findById(injectorId).orElseThrow(ElementNotFoundException::new);
        return fromIterable(injectorContractRepository.findInjectorContractsByInjector(injector)).stream()
                .map(contract -> {
                    try {
                        return mapper.readTree(contract.getContent());
                    } catch (JsonProcessingException e) {
                        throw new RuntimeException(e);
                    }
                }).toList();
    }

    // TODO JRI => REFACTOR TO RELY ON INJECTOR SERVICE
    private InjectorContract convertInjectorFromInput(InjectorContractInput in, Injector injector) {
        InjectorContract injectorContract = new InjectorContract();
        injectorContract.setId(in.getId());
        injectorContract.setManual(in.isManual());
        injectorContract.setLabels(in.getLabels());
        injectorContract.setInjector(injector);
        injectorContract.setContent(in.getContent());
        injectorContract.setAtomicTesting(in.isAtomicTesting());
        injectorContract.setPlatforms(in.getPlatforms());
        if (!in.getAttackPatternsExternalIds().isEmpty()) {
            List<AttackPattern> attackPatterns = fromIterable(attackPatternRepository.findAllByExternalIdInIgnoreCase(in.getAttackPatternsExternalIds()));
            injectorContract.setAttackPatterns(attackPatterns);
        } else {
            injectorContract.setAttackPatterns(new ArrayList<>());
        }
        return injectorContract;
    }

    private Injector updateInjector(
            Injector injector,
            String type,
            String name,
            List<InjectorContractInput> contracts,
            Boolean customContracts,
            String category,
            Map<String, String> executorCommands,
            Map<String, String> executorClearCommands) {
        injector.setUpdatedAt(Instant.now());
        injector.setType(type);
        injector.setName(name);
        injector.setExternal(true);
        injector.setCustomContracts(customContracts);
        injector.setCategory(category);
        injector.setExecutorCommands(executorCommands);
        injector.setExecutorClearCommands(executorClearCommands);
        List<String> existing = new ArrayList<>();
        List<String> toDeletes = new ArrayList<>();
        injector.getContracts().forEach(contract -> {
            Optional<InjectorContractInput> current = contracts.stream()
                    .filter(c -> c.getId().equals(contract.getId())).findFirst();
            if (current.isPresent()) {
                existing.add(contract.getId());
                contract.setManual(current.get().isManual());
                contract.setLabels(current.get().getLabels());
                contract.setContent(current.get().getContent());
                contract.setAtomicTesting(current.get().isAtomicTesting());
                contract.setPlatforms(current.get().getPlatforms());
                if (!current.get().getAttackPatternsExternalIds().isEmpty()) {
                    List<AttackPattern> attackPatterns = fromIterable(attackPatternRepository.findAllByExternalIdInIgnoreCase(current.get().getAttackPatternsExternalIds()));
                    contract.setAttackPatterns(attackPatterns);
                } else {
                    contract.setAttackPatterns(new ArrayList<>());
                }
            } else if (!contract.getCustom()) {
                toDeletes.add(contract.getId());
            }
        });
        List<InjectorContract> toCreates = contracts.stream()
                .filter(c -> !existing.contains(c.getId()))
                .map(in -> convertInjectorFromInput(in, injector)).toList();
        injectorContractRepository.deleteAllById(toDeletes);
        injectorContractRepository.saveAll(toCreates);
        return injectorRepository.save(injector);
    }

    @Secured(ROLE_ADMIN)
    @PutMapping("/api/injectors/{injectorId}")
    public Injector updateInjector(@PathVariable String injectorId, @Valid @RequestBody InjectorUpdateInput input) {
        Injector injector = injectorRepository.findById(injectorId).orElseThrow(ElementNotFoundException::new);
        return updateInjector(
                injector,
                injector.getType(),
                input.getName(),
                input.getContracts(),
                input.getCustomContracts(),
                input.getCategory(),
                input.getExecutorCommands(),
                input.getExecutorClearCommands()
        );
    }

    @Secured(ROLE_ADMIN)
    @GetMapping("/api/injectors/{injectorId}")
    public Injector injector(@PathVariable String injectorId) {
        return injectorRepository.findById(injectorId).orElseThrow(ElementNotFoundException::new);
    }

    @Secured(ROLE_ADMIN)
    @PostMapping(value = "/api/injectors",
            produces = {MediaType.APPLICATION_JSON_VALUE},
            consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    @Transactional(rollbackOn = Exception.class)
    public InjectorRegistration registerInjector(@Valid @RequestPart("input") InjectorCreateInput input,
                                                 @RequestPart("icon") Optional<MultipartFile> file) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost(rabbitmqConfig.getHostname());
        factory.setPort(rabbitmqConfig.getPort());
        factory.setUsername(rabbitmqConfig.getUser());
        factory.setPassword(rabbitmqConfig.getPass());
        factory.setVirtualHost(rabbitmqConfig.getVhost());
        // Declare queueing
        Connection connection = null;
        try {
            // Upload icon
            if (file.isPresent() && "image/png".equals(file.get().getContentType())) {
                fileService.uploadFile(FileService.INJECTORS_IMAGES_BASE_PATH + input.getType() + ".png", file.get());
            }
            connection = factory.newConnection();
            Channel channel = connection.createChannel();
            String queueName = rabbitmqConfig.getPrefix() + "_injector_" + input.getType();
            Map<String, Object> queueOptions = new HashMap<>();
            queueOptions.put("x-queue-type", rabbitmqConfig.getQueueType());
            channel.queueDeclare(queueName, true, false, false, queueOptions);
            String routingKey = rabbitmqConfig.getPrefix() + ROUTING_KEY + input.getType();
            String exchangeKey = rabbitmqConfig.getPrefix() + EXCHANGE_KEY;
            channel.exchangeDeclare(exchangeKey, "direct", true);
            channel.queueBind(queueName, exchangeKey, routingKey);
            // We need to support upsert for registration
            Injector injector = injectorRepository.findById(input.getId()).orElse(null);
            if( injector == null ) {
                Injector injectorChecking = injectorRepository.findByType(input.getType()).orElse(null);
                if (injectorChecking != null ) {
                    throw new Exception("The injector " + input.getType() + " already exists with a different ID, please delete it or contact your administrator.");
                }
            }
            if (injector != null) {
                updateInjector(
                        injector,
                        input.getType(),
                        input.getName(),
                        input.getContracts(),
                        input.getCustomContracts(),
                        input.getCategory(),
                        input.getExecutorCommands(),
                        input.getExecutorClearCommands()
                );
            } else {
                // save the injector
                Injector newInjector = new Injector();
                newInjector.setId(input.getId());
                newInjector.setExternal(true);
                newInjector.setName(input.getName());
                newInjector.setType(input.getType());
                newInjector.setCategory(input.getCategory());
                newInjector.setCustomContracts(input.getCustomContracts());
                newInjector.setExecutorCommands(input.getExecutorCommands());
                newInjector.setExecutorClearCommands(input.getExecutorClearCommands());
                Injector savedInjector = injectorRepository.save(newInjector);
                // Save the contracts
                List<InjectorContract> injectorContracts = input.getContracts().stream()
                        .map(in -> convertInjectorFromInput(in, savedInjector)).toList();
                injectorContractRepository.saveAll(injectorContracts);
            }
            InjectorConnection conn = new InjectorConnection(
                    rabbitmqConfig.getHostname(),
                    rabbitmqConfig.getVhost(),
                    rabbitmqConfig.isSsl(),
                    rabbitmqConfig.getPort(),
                    rabbitmqConfig.getUser(),
                    rabbitmqConfig.getPass()
            );
            return new InjectorRegistration(conn, queueName);
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            if (connection != null) {
                try {
                    connection.close();
                } catch (IOException e) {
                    log.severe("Unable to close RabbitMQ connection. You should worry as this could impact performance");
                }
            }
        }
    }
}
