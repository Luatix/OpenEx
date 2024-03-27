package io.openbas.injects.challenge;

import io.openbas.contract.Contract;
import io.openbas.contract.ContractConfig;
import io.openbas.contract.Contractor;
import io.openbas.contract.fields.ContractElement;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

import static io.openbas.contract.Contract.executableContract;
import static io.openbas.contract.ContractCardinality.Multiple;
import static io.openbas.contract.ContractDef.contractBuilder;
import static io.openbas.contract.fields.ContractChallenge.challengeField;
import static io.openbas.contract.fields.ContractAttachment.attachmentField;
import static io.openbas.contract.fields.ContractTeam.teamField;
import static io.openbas.contract.fields.ContractCheckbox.checkboxField;
import static io.openbas.contract.fields.ContractText.textField;
import static io.openbas.contract.fields.ContractTextArea.richTextareaField;
import static io.openbas.helper.SupportedLanguage.en;
import static io.openbas.helper.SupportedLanguage.fr;

@Component
public class ChallengeContract extends Contractor {

    public static final String CHALLENGE_PUBLISH = "f8e70b27-a69c-4b9f-a2df-e217c36b3981";

    public static final String TYPE = "openbas_challenge";

    @Override
    protected boolean isExpose() {
        return true;
    }

    @Override
    public String getType() {
        return TYPE;
    }

    @Override
    public ContractConfig getConfig() {
        return new ContractConfig(TYPE, Map.of(en, "Challenge", fr, "Challenge"), "#e91e63", "#e91e63", "/img/challenge.png", isExpose());
    }

    @Override
    public List<Contract> contracts() {
        ContractConfig contractConfig = getConfig();
        // In this "internal" contract we can't express choices.
        // Choices are contextual to a specific exercise.
        String messageBody = """
                    Dear player,<br /><br />
                    News challenges have been published.<br /><br />
                    <#list challenges as challenge>
                        - <a href="${challenge.uri}">${challenge.name}</a><br />
                    </#list>
                    <br/><br/>
                    Kind regards,<br />
                    The animation team
                """;
        List<ContractElement> publishInstance = contractBuilder()
                .mandatory(challengeField("challenges", "Challenges", Multiple))
                .mandatory(textField("subject", "Subject", "New challenges published for ${user.email}"))
                .mandatory(richTextareaField("body", "Body", messageBody))
                .optional(checkboxField("encrypted", "Encrypted", false))
                .mandatory(teamField("teams", "Teams", Multiple))
                .optional(attachmentField("attachments", "Attachments", Multiple))
                .build();
        Contract publishChallenge = executableContract(contractConfig,
                CHALLENGE_PUBLISH, Map.of(en, "Publish challenges", fr, "Publier des challenges"), publishInstance);
        return List.of(publishChallenge);
    }
}
