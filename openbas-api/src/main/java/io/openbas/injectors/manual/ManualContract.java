package io.openbas.injectors.manual;

import static io.openbas.helper.SupportedLanguage.en;
import static io.openbas.helper.SupportedLanguage.fr;
import static io.openbas.injector_contract.Contract.manualContract;
import static io.openbas.injector_contract.ContractCardinality.Multiple;
import static io.openbas.injector_contract.ContractDef.contractBuilder;
import static io.openbas.injector_contract.fields.ContractExpectations.expectationsField;
import static io.openbas.injector_contract.fields.ContractTeam.teamField;
import static io.openbas.injector_contract.fields.ContractTextArea.textareaField;

import io.openbas.database.model.Endpoint;
import io.openbas.helper.SupportedLanguage;
import io.openbas.injector_contract.Contract;
import io.openbas.injector_contract.ContractConfig;
import io.openbas.injector_contract.Contractor;
import io.openbas.injector_contract.ContractorIcon;
import io.openbas.injector_contract.fields.ContractElement;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ManualContract extends Contractor {
  public static final String TYPE = "openbas_manual";

  public static final String MANUAL_DEFAULT = "d02e9132-b9d0-4daa-b3b1-4b9871f8472c";

  @Override
  public boolean isExpose() {
    return true;
  }

  @Override
  public String getType() {
    return TYPE;
  }

  @Override
  public ContractConfig getConfig() {
    Map<SupportedLanguage, String> label = Map.of(en, "Manual", fr, "Manuel");
    return new ContractConfig(TYPE, label, "#009688", "#009688", "/img/manual.png", isExpose());
  }

  @Override
  public List<Contract> contracts() {
    ContractElement teams = teamField("teams", "Teams", Multiple);
    ContractElement expectations = expectationsField("expectations", "Expectations");

    ContractConfig contractConfig = getConfig();
    List<ContractElement> instance =
        contractBuilder()
            .mandatory(textareaField("content", "Content"))
            .mandatoryConditional(teams, expectations)
            .optional(expectations)
            .build();
    return List.of(
        manualContract(
            contractConfig,
            MANUAL_DEFAULT,
            Map.of(en, "Manual", fr, "Manuel"),
            instance,
            List.of(Endpoint.PLATFORM_TYPE.Internal),
            false));
  }

  @Override
  public ContractorIcon getIcon() {
    InputStream iconStream = getClass().getResourceAsStream("/img/icon-manual.png");
    return new ContractorIcon(iconStream);
  }
}
