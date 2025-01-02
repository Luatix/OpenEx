package io.openbas.migration;

import java.sql.Connection;
import java.sql.Statement;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.stereotype.Component;

@Component
public class V3_55__Add_obfuscator_inject_contract extends BaseJavaMigration {

  @Override
  public void migrate(Context context) throws Exception {
    Connection connection = context.getConnection();
    Statement statement = connection.createStatement();

    String addObfuscationQuery =
        "UPDATE injectors_contracts "
            + "SET injector_contract_content = JSONB_SET("
            + "    injector_contract_content::jsonb,"
            + "    '{fields}',"
            + "    CASE WHEN NOT EXISTS ("
            + "        SELECT 1 FROM jsonb_array_elements(injector_contract_content::jsonb->'fields') AS fields "
            + "        WHERE fields->>'key' = 'obfuscator'"
            + "    ) THEN "
            + "        injector_contract_content::jsonb->'fields' || "
            + "        jsonb_build_object("
            + "            'key', 'obfuscator',"
            + "            'cardinality', '1',"
            + "            'defaultValue', jsonb_build_array('plain-text'),"
            + "            'mandatory', false,"
            + "            'mandatoryGroups', null,"
            + "            'label', 'Obfuscator',"
            + "            'readOnly', false,"
            + "            'linkedFields', jsonb_build_array(),"
            + "            'linkedValues', jsonb_build_array(),"
            + "            'type', 'select',"
            + "            'choices', jsonb_build_object('base64', 'base64', 'plain-text', 'plain-text'),"
            + "            'choiceInformations', jsonb_build_object('base64', 'CMD does not support base64 obfuscation', 'plain-text', '')"
            + "        )"
            + "    ELSE "
            + "        injector_contract_content::jsonb->'fields'"
            + "    END"
            + ") "
            + "WHERE injector_id IN ("
            + "    SELECT injector_id FROM injectors WHERE injector_type = 'openbas_implant'"
            + ") "
            + "AND injector_contract_payload IN ("
            + "    SELECT payload_id FROM payloads WHERE payload_type = 'Command'"
            + ")";
    statement.executeUpdate(addObfuscationQuery);
  }
}
