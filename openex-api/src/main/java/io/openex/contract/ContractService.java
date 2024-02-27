package io.openex.contract;

import io.openex.contract.fields.ContractElement;
import io.openex.database.model.Inject;
import io.openex.helper.SupportedLanguage;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

import static io.openex.config.SessionHelper.currentUser;

@Service
public class ContractService {

    private static final Logger LOGGER = Logger.getLogger(ContractService.class.getName());

    public static final String TYPE = "type";
    public static final String LABEL = "label";

    @Getter
    private final Map<String, Contract> contracts = new HashMap<>();
    private List<Contractor> baseContracts;

    @Autowired
    public void setBaseContracts(List<Contractor> baseContracts) {
        this.baseContracts = baseContracts;
    }

    // Build the contracts every minute
    @Scheduled(fixedDelay = 60000, initialDelay = 0)
    public void buildContracts() {
        this.baseContracts.stream().parallel().forEach(helper -> {
            try {
                Map<String, Contract> contractInstances = helper.contracts()
                        .stream()
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toMap(Contract::getId, Function.identity()));
                this.contracts.putAll(contractInstances);
            } catch (Exception e) {
                LOGGER.log(Level.SEVERE, e.getMessage(), e);
            }
        });
    }

    public Contract contract(@NotNull final String contractId) {
        return this.contracts.get(contractId);
    }

    public List<ContractConfig> getContractConfigs() {
        return this.contracts.values()
                .stream()
                .map(Contract::getConfig)
                .distinct()
                .toList();
    }

    public String getContractType(@NotNull final String contractId) {
        Contract contractInstance = this.contracts.get(contractId);
        return contractInstance != null ? contractInstance.getConfig().getType() : null;
    }

    public Contract resolveContract(Inject inject) {
        return this.contracts.get(inject.getContract());
    }


    /**
     * Retrieves a paginated list of contracts.
     *
     * @param contractSearchInput Criteria for searching contracts.
     * @param pageable            The pagination information
     * @return a {@link Page} containing the contracts for the requested page
     */
    public Page<Contract> searchContracts(ContractSearchInput contractSearchInput,
                                          Pageable pageable) {

        int currentPage = pageable.getPageNumber();
        int pageSize = pageable.getPageSize();
        int startItem = currentPage * pageSize;

        List<Contract> exposedContracts = searchContracts(contractSearchInput, pageable.getSort());

        int totalContracts = exposedContracts.size();
        if (startItem >= totalContracts) {
            return new PageImpl<>(Collections.emptyList(), pageable, totalContracts);
        }

        int toIndex = Math.min(startItem + pageSize, totalContracts);
        List<Contract> paginatedContracts = exposedContracts.subList(startItem, toIndex);
        return new PageImpl<>(paginatedContracts, pageable, totalContracts);
    }

    /**
     * Searches for contracts based on specified criteria.
     *
     * @param contractSearchInput criteria for searching contracts
     * @param sort                List of orders for sorting contracts
     * @return A list of contracts matching the search criteria.
     */
    private List<Contract> searchContracts(ContractSearchInput contractSearchInput, Sort sort) {
        return getContracts().values().stream()
                .filter(contract -> (!contractSearchInput.isExposedContractsOnly() || contract.getConfig().isExpose())
                        && Optional.ofNullable(contractSearchInput.getType()).map(typeLabel -> contractHasProperty(TYPE, contract, typeLabel)).orElse(true)
                        && Optional.ofNullable(contractSearchInput.getLabel()).map(label -> contractHasProperty(LABEL, contract, label)).orElse(true)
                        && Optional.ofNullable(contractSearchInput.getTextSearch()).map(text -> contractContainsText(contract, text)).orElse(true))
                .sorted(getComparator(sort))
                .toList();
    }

    /**
     * Constructs a comparator for sorting Contract objects based on the provided Sort orders.
     *
     * @param sort The Sort object containing sorting orders.
     * @return A Comparator<Contract> object for sorting Contract objects according to the specified Sort orders.
     */
    private Comparator<Contract> getComparator(Sort sort) {
        Comparator<Contract> comparator = null;

        for (Sort.Order order : sort) {
            Comparator<Contract> propertyComparator = Comparator.comparing(contract -> getValueForComparison(contract, order.getProperty()));

            if (null == comparator) {
                comparator = order.getDirection().equals(Sort.Direction.ASC) ? propertyComparator : propertyComparator.reversed();
            } else {
                comparator = comparator.thenComparing(order.getDirection().equals(Sort.Direction.ASC) ? propertyComparator : propertyComparator.reversed());
            }
        }

        return comparator;
    }

    /**
     * Retrieves the value for comparison based on the property and current user lang.
     *
     * @param contract The contract object from which to extract the value.
     * @param property   The property by which to sort the contracts.
     * @return The value extracted from the contract for comparison based on the property.
     */
    private String getValueForComparison(Contract contract, String property) {
        SupportedLanguage lang = SupportedLanguage.of(currentUser().getLang());
        switch (property) {
            case LABEL:
                return Optional.ofNullable(contract.getLabel().get(lang)).orElse(contract.getLabel().get(SupportedLanguage.en));
            default: //"TYPE"
                return Optional.ofNullable(contract.getConfig().getLabel().get(lang)).orElse(contract.getConfig().getLabel().get(SupportedLanguage.en));
        }
    }

    /**
     * Checks if the specified type is contained within the given Contract.
     *
     * @param property The property where the value is searched.
     * @param contract The Contract object to search within.
     * @param value    The type to check for within the Contract.
     * @return {@code true} if the type is found within the Contract, {@code false} otherwise.
     */
    private boolean contractHasProperty(String property, Contract contract, String value) {
        switch (property) {
            case LABEL:
                return StringUtils.equalsIgnoreCase(getValueForComparison(contract, LABEL), value);
            default:
                return StringUtils.equalsIgnoreCase(getValueForComparison(contract, TYPE), value);
        }
    }

    /**
     * Checks if the given contract contains the specified text.
     *
     * @param contract The contract to search within.
     * @param text     The text to search for.
     * @return {@code true} if the contract contains the text, {@code false} otherwise.
     */
    private boolean contractContainsText(Contract contract, String text) {
        return containsTextIn(getValueForComparison(contract, LABEL), text) ||
                containsTextIn(getValueForComparison(contract, TYPE), text) ||
                containsTextInFields(contract.getFields(), text);
    }

    /**
     * Checks if the given label contains the specified text.
     *
     * @param value  The label to search within.
     * @param text The text to search for.
     * @return {@code true} if the label contains the text, {@code false} otherwise.
     */
    private boolean containsTextIn(String value, String text) {
        return StringUtils.containsIgnoreCase(value, text);
    }

    /**
     * Checks if any of the contract elements in the given list contain the specified text.
     *
     * @param fields The list of contract elements to search within.
     * @param text   The text to search for.
     * @return {@code true} if any contract element contains the text, {@code false} otherwise.
     */
    private boolean containsTextInFields(List<ContractElement> fields, String text) {
        return fields.stream().anyMatch(field -> StringUtils.containsIgnoreCase(field.getLabel(), text));
    }
}
