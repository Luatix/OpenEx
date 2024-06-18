package io.openbas.rest.mapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.openbas.database.model.ImportMapper;
import io.openbas.database.model.InjectImporter;
import io.openbas.database.model.InjectorContract;
import io.openbas.database.model.RuleAttribute;
import io.openbas.database.raw.RawImportMapper;
import io.openbas.database.repository.ImportMapperRepository;
import io.openbas.database.repository.InjectorContractRepository;
import io.openbas.rest.exception.ElementNotFoundException;
import io.openbas.rest.helper.RestBehavior;
import io.openbas.rest.injector_contract.form.InjectorContractUpdateInput;
import io.openbas.rest.mapper.form.InjectImporterInput;
import io.openbas.rest.mapper.form.MapperAddInput;
import jakarta.annotation.Resource;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static io.openbas.database.model.User.ROLE_ADMIN;
import static io.openbas.database.model.User.ROLE_USER;

@RestController
@RequiredArgsConstructor
public class MapperApi extends RestBehavior {

    private final ImportMapperRepository importMapperRepository;

    private final InjectorContractRepository injectorContractRepository;

    @Resource
    protected ObjectMapper mapper;

    @Secured(ROLE_USER)
    @GetMapping("/api/mappers")
    @Transactional(rollbackOn = Exception.class)
    public List<RawImportMapper> getImportMapper() {
        return importMapperRepository.findAllMinimalMappers();
    }

    @Secured(ROLE_ADMIN)
    @GetMapping("/api/mappers/{mapperId}")
    public ImportMapper getImportMapperById(@PathVariable String mapperId) {
        return importMapperRepository.findById(UUID.fromString(mapperId)).orElseThrow(ElementNotFoundException::new);
    }

    @Secured(ROLE_ADMIN)
    @PostMapping("/api/mappers")
    public void createImportMapper(@RequestBody @Valid final MapperAddInput mapperAddInput) {
        ImportMapper importMapper = new ImportMapper();
        importMapper.setName(mapperAddInput.getName());
        importMapper.setInjectTypeColumn(mapperAddInput.getInjectTypeColumn());
        importMapper.setInjectImporters(new ArrayList<>());
        importMapper.setId(UUID.randomUUID().toString());

        Map<String, InjectorContract> mapInjectorContracts = StreamSupport.stream(injectorContractRepository.findAllById(
                mapperAddInput.getImporters().stream().map(InjectImporterInput::getInjectorContractId).toList()
            ).spliterator(), false).collect(Collectors.toMap(InjectorContract::getId, Function.identity()));

        mapperAddInput.getImporters().forEach(
                injectImporterInput -> {
                    InjectImporter injectImporter = new InjectImporter();
                    injectImporter.setId(UUID.randomUUID().toString());
                    injectImporter.setInjectorContract(mapInjectorContracts.get(injectImporterInput.getInjectorContractId()));
                    injectImporter.setImportTypeValue(injectImporterInput.getInjectTypeValue());
                    injectImporter.setRuleAttributes(new ArrayList<>());
                    injectImporterInput.getRuleAttributes().forEach(ruleAttributeInput -> {
                        RuleAttribute ruleAttribute = new RuleAttribute();
                        ruleAttribute.setColumns(ruleAttributeInput.getColumns());
                        ruleAttribute.setName(ruleAttributeInput.getName());
                        ruleAttribute.setDefaultValue(ruleAttributeInput.getDefaultValue());
                        injectImporter.getRuleAttributes().add(ruleAttribute);
                    });
                    importMapper.getInjectImporters().add(injectImporter);
                }
        );

        importMapperRepository.save(importMapper);
    }

    @Secured(ROLE_ADMIN)
    @PutMapping("/api/mappers/{mapperId}")
    public ImportMapper updateImportMapper(@PathVariable String mapperId, @Valid @RequestBody InjectorContractUpdateInput input) {
        ImportMapper importMapper = importMapperRepository.findById(UUID.fromString(mapperId)).orElseThrow(ElementNotFoundException::new);
        importMapper.setUpdateAttributes(input);
        return importMapperRepository.save(importMapper);
    }

    @Secured(ROLE_ADMIN)
    @DeleteMapping("/api/mappers/{mapperId}")
    public void deleteImportMapper(@PathVariable String mapperId) {
        importMapperRepository.deleteById(UUID.fromString(mapperId));
    }
}
