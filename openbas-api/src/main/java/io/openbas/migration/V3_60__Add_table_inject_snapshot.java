package io.openbas.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.stereotype.Component;

import java.sql.Statement;

@Component
public class V3_60__Add_table_inject_snapshot extends BaseJavaMigration {

  @Override
  public void migrate(Context context) throws Exception {
    Statement select = context.getConnection().createStatement();
    select.execute(
        """
                    CREATE TABLE injects_snapshots (
                        inject_snapshot_id VARCHAR(255) NOT NULL CONSTRAINT injects_snapshots_pkey PRIMARY KEY,
                        snapshot_inject VARCHAR(255) NOT NULL CONSTRAINT snapshot_inject_id_fk REFERENCES injects ON DELETE CASCADE,
                        snapshot_assets VARCHAR(255) NOT NULL CONSTRAINT snapshot_asset_id_fk REFERENCES assets ON DELETE CASCADE,
                        snapshot_asset_groups VARCHAR(255) NOT NULL CONSTRAINT snapshot_asset_group_id_fk REFERENCES asset_groups ON DELETE CASCADE,
                        snapshot_teams VARCHAR(255) NOT NULL CONSTRAINT snapshot_team_id_fk REFERENCES teams ON DELETE CASCADE,          
                        snapshot_created_at TIMESTAMP DEFAULT now(),
                        snapshot_updated_at TIMESTAMP DEFAULT now()
                      );
                    CREATE INDEX idx_snapshot_inject ON injects_snapshots(snapshot_inject);
                    CREATE INDEX idx_snapshot_assets ON injects_snapshots(snapshot_assets);
                    CREATE INDEX idx_snapshot_asset_groups ON injects_snapshots(snapshot_asset_groups);
                    CREATE INDEX idx_snapshot_teams ON injects_snapshots(snapshot_teams);
            
                    ALTER TABLE injects ADD COLUMN inject_snapshot VARCHAR(255);
                    ALTER TABLE assets ADD COLUMN inject_snapshot_id VARCHAR(255);
                    ALTER TABLE asset_groups ADD COLUMN inject_snapshot_id VARCHAR(255);
                    ALTER TABLE teams ADD COLUMN inject_snapshot_id VARCHAR(255);
            """);
  }

}
