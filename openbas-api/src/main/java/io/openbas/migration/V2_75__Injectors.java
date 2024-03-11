package io.openbas.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.Statement;

@Component
public class V2_75__Injectors extends BaseJavaMigration {

  @Override
  public void migrate(Context context) throws Exception {
    Connection connection = context.getConnection();
    Statement select = connection.createStatement();
    // Create table
    select.execute("""
          CREATE TABLE injectors (
            injector_id varchar(255) not null constraint injector_pkey primary key,
            injector_created_at timestamp not null default now(),
            injector_updated_at timestamp not null default now(),
            injector_name varchar(255) not null,
            injector_type varchar(255) not null,
            injector_state text,
            injector_contracts text not null
          );
          CREATE INDEX idx_injectors on injectors (injector_id);
          CREATE UNIQUE INDEX injectors_unique on injectors (injector_type);
     """);
  }
}
