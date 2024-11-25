package io.openbas.migration;

import java.sql.Connection;
import java.sql.Statement;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.stereotype.Component;

@Component
public class V3_49__Update_executable_arch_payload_type_command extends BaseJavaMigration {

  @Override
  public void migrate(Context context) throws Exception {
    Connection connection = context.getConnection();
    Statement statement = connection.createStatement();
    statement.execute(
        "UPDATE payloads SET executable_arch = 'ALL_ARCHITECTURES' WHERE executable_arch IS NULL;");
    statement.execute(
        "ALTER TABLE payloads RENAME COLUMN executable_arch TO payload_execution_arch");
    statement.execute(
        "ALTER TABLE payloads ALTER COLUMN payload_execution_arch SET DEFAULT 'ALL_ARCHITECTURES'");
  }
}
