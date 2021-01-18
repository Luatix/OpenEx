package io.openex.player;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.openex.player.contract.RestContract;
import io.openex.player.model.Contract;
import io.openex.player.model.execution.Execution;
import io.openex.player.model.inject.InjectBase;
import io.openex.player.model.inject.InjectContext;
import io.openex.player.utils.Executor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class RestHandler {

    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    private List<Contract> contracts;

    @Autowired
    private ApplicationContext context;

    @GetMapping("/contracts")
    public List<RestContract> getContracts() {
        return contracts.stream().filter(Contract::expose).map(Contract::toRest).collect(Collectors.toList());
    }

    @PostMapping("/player/{id}")
    public Execution execute(@PathVariable String id, @RequestBody String jsonRequest) throws Exception {
        Map<String, Contract> contractsById = contracts.stream().collect(Collectors.toMap(Contract::id, contract -> contract));
        Contract contract = contractsById.get(id);
        InjectContext injectContext = mapper.readValue(jsonRequest, InjectContext.class);
        InjectBase injectData = mapper.readValue(injectContext.getData(), contract.dataClass());
        Class<? extends Executor<?>> executorClass = injectData.executor();
        @SuppressWarnings("unchecked")
        Executor<InjectBase> executor = (Executor<InjectBase>) context.getBean(executorClass);
        return executor.execute(injectData);
    }
}
