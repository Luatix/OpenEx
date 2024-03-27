package io.openbas.rest.injector;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import io.openbas.config.OpenBASConfig;
import io.openbas.database.model.AttackPattern;
import io.openbas.database.model.Injector;
import io.openbas.database.model.InjectorContract;
import io.openbas.database.repository.AttackPatternRepository;
import io.openbas.database.repository.InjectorContractRepository;
import io.openbas.database.repository.InjectorRepository;
import io.openbas.rest.helper.RestBehavior;
import io.openbas.rest.injector.form.InjectorContractInput;
import io.openbas.rest.injector.form.InjectorCreateInput;
import io.openbas.rest.injector.form.InjectorUpdateInput;
import io.openbas.rest.injector.response.InjectorConnection;
import io.openbas.rest.injector.response.InjectorRegistration;
import jakarta.annotation.Resource;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static io.openbas.database.model.User.ROLE_ADMIN;
import static io.openbas.helper.StreamHelper.fromIterable;
import static io.openbas.service.QueueService.EXCHANGE_KEY;
import static io.openbas.service.QueueService.ROUTING_KEY;

@RestController
public class InjectorApi extends RestBehavior {

    @Resource
    private OpenBASConfig openBASConfig;

    private AttackPatternRepository attackPatternRepository;

    private InjectorRepository injectorRepository;

    private InjectorContractRepository injectorContractRepository;

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

    // TODO JRI => REFACTOR TO RELY ON INJECTOR SERVICE
    private InjectorContract convertInjectorFromInput(InjectorContractInput in, Injector injector) {
        InjectorContract injectorContract = new InjectorContract();
        injectorContract.setId(in.getId());
        injectorContract.setManual(in.isManual());
        injectorContract.setLabels(in.getLabels());
        injectorContract.setInjector(injector);
        injectorContract.setContent(in.getContent());
        if (!in.getAttackPatterns().isEmpty()) {
            List<AttackPattern> attackPatterns = fromIterable(attackPatternRepository.findAllByExternalIdInIgnoreCase(in.getAttackPatterns()));
            injectorContract.setAttackPatterns(attackPatterns);
        } else {
            injectorContract.setAttackPatterns(new ArrayList<>());
        }
        return injectorContract;
    }
    private Injector updateInjector(Injector injector, String name, List<InjectorContractInput> contracts) {
        injector.setUpdatedAt(Instant.now());
        injector.setName(name);
        injector.setExternal(true);
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
                if (!current.get().getAttackPatterns().isEmpty()) {
                    List<AttackPattern> attackPatterns = fromIterable(attackPatternRepository.findAllByExternalIdInIgnoreCase(current.get().getAttackPatterns()));
                    contract.setAttackPatterns(attackPatterns);
                } else {
                    contract.setAttackPatterns(new ArrayList<>());
                }
            } else {
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
        Injector injector = injectorRepository.findById(injectorId).orElseThrow();
        return updateInjector(injector, input.getName(), input.getContracts());
    }

    @Secured(ROLE_ADMIN)
    @GetMapping("/api/injectors/{injectorId}")
    public Injector injector(@PathVariable String injectorId) {
        return injectorRepository.findById(injectorId).orElseThrow();
    }

    @Secured(ROLE_ADMIN)
    @PostMapping("/api/injectors")
    @Transactional
    public InjectorRegistration registerInjector(@Valid @RequestBody InjectorCreateInput input) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost(openBASConfig.getRabbitmqHostname());
        try {
            Connection connection = factory.newConnection();
            Channel channel = connection.createChannel();
            String queueName = openBASConfig.getRabbitmqPrefix() + "_injector_" + input.getType();
            channel.queueDeclare(queueName, true, false, false, null);
            String routingKey = openBASConfig.getRabbitmqPrefix() + ROUTING_KEY + input.getType();
            String exchangeKey = openBASConfig.getRabbitmqPrefix() + EXCHANGE_KEY;
            channel.exchangeDeclare(exchangeKey, "direct", true);
            channel.queueBind(queueName, exchangeKey, routingKey);
            // We need to support upsert for registration
            Injector injector = injectorRepository.findById(input.getId()).orElse(null);
            if (injector != null) {
                updateInjector(injector, input.getName(), input.getContracts());
            } else {
                // save the injector
                Injector newInjector = new Injector();
                newInjector.setId(input.getId());
                newInjector.setExternal(true);
                newInjector.setName(input.getName());
                newInjector.setType(input.getType());
                Injector savedInjector = injectorRepository.save(newInjector);
                // Save the contracts
                List<InjectorContract> injectorContracts = input.getContracts().stream()
                        .map(in -> convertInjectorFromInput(in, savedInjector)).toList();
                injectorContractRepository.saveAll(injectorContracts);
            }
            InjectorConnection conn = new InjectorConnection(
                    openBASConfig.getRabbitmqHostname(),
                    openBASConfig.getRabbitmqVhost(),
                    openBASConfig.isRabbitmqSsl(),
                    openBASConfig.getRabbitmqPort(),
                    openBASConfig.getRabbitmqUser(),
                    openBASConfig.getRabbitmqPass()
            );
            return new InjectorRegistration(conn, queueName);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
