package io.openbas.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.Statement;

@Component
public class V3_54__TagRule extends BaseJavaMigration {

  @Override
  public void migrate(Context context) throws Exception {
    Connection connection = context.getConnection();
    Statement select = connection.createStatement();
    // Create relations between contracts and attack_patterns
    select.execute(
        """
               CREATE TABLE tag_rules (
                   tag_rule_id varchar(255) not null,
                   tag_id varchar(255) not null
                       constraint tag_id_fk
                           references tags,
                   primary key (tag_rule_id)
               );
            """);

    select.execute(
            """
                   CREATE TABLE tag_rule_assets (
                       tag_rule_id varchar(255) not null
                            constraint tag_rule_id_fk
                               references tag_rules,
                       asset_id varchar(255) not null
                           constraint asset_id_fk
                               references assets,
                       primary key (tag_rule_id)
                   );
                """);
  }
}
