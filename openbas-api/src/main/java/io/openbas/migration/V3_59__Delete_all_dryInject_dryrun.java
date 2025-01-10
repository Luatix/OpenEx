package io.openbas.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.Statement;

@Component
public class V3_59__Delete_all_dryInject_dryrun extends BaseJavaMigration {

  @Override
  public void migrate(Context context) throws Exception {
    Connection connection = context.getConnection();
    Statement select = connection.createStatement();
    select.execute("DROP TABLE dryinjects;");
    select.execute("DROP TABLE dryinjects_statuses;");
    select.execute("DROP TABLE dryruns;");
    select.execute("DROP TABLE dryruns_users;");
  }
}
