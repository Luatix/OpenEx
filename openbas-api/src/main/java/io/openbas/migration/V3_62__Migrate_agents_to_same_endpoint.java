package io.openbas.migration;

import java.sql.Statement;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.stereotype.Component;

@Component
public class V3_62__Migrate_agents_to_same_endpoint extends BaseJavaMigration {
  @Override
  public void migrate(Context context) throws Exception {
    Statement select = context.getConnection().createStatement();
    // Migrate agent from a matching endpoint (hostname, platform and arch = endpoint id) to a
    // unique one
    // At the end, delete endpoints no longer linked to an agent.
    select.execute(
        """
                -- update hostnames to have lowercase for every executors
                UPDATE assets SET endpoint_hostname = lower(endpoint_hostname) WHERE asset_type='Endpoint';
                -- update agent table to add cleared at column from asset table
                ALTER TABLE agents ADD column agent_cleared_at timestamp default now();
                UPDATE agents ag set agent_cleared_at = a.asset_cleared_at FROM (SELECT asset_id, asset_cleared_at FROM assets) AS a WHERE ag.agent_asset=a.asset_id;
                ALTER TABLE assets DROP column asset_cleared_at;
                -- create temp asset table to group the identical endpoints
                CREATE TABLE temp_assets
                AS SELECT count(asset_id), cast(array_agg(asset_id) AS VARCHAR) AS array_asset_id, min(asset_id) AS uniq_asset_id, endpoint_hostname, endpoint_platform, endpoint_arch
                FROM assets WHERE asset_type='Endpoint'
                GROUP BY endpoint_hostname, endpoint_platform, endpoint_arch HAVING count(asset_id) > 1;
                -- update the agents to match with an identical endpoint if it is possible
                UPDATE agents a SET agent_asset=ta.uniq_asset_id
                FROM (SELECT array_asset_id, uniq_asset_id FROM temp_assets) AS ta
                WHERE ta.array_asset_id LIKE concat('%',a.agent_asset,'%');
                -- drop temp asset table
                DROP TABLE temp_assets;
                -- delete old endpoints which are unused now
                DELETE FROM assets WHERE asset_type='Endpoint' AND asset_id NOT IN (SELECT DISTINCT agent_asset FROM agents);
                """);
  }
}
