package io.openex.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.Statement;

@Component
public class V2_64__Audiences_detach_exercises extends BaseJavaMigration {

  @Override
  public void migrate(Context context) throws Exception {
    Connection connection = context.getConnection();
    Statement select = connection.createStatement();
    // Add Variable table
    select.execute("""
        ALTER TABLE audiences RENAME CONSTRAINT subaudiences_pkey TO team_pkey;
        ALTER TABLE audiences DROP CONSTRAINT fk_audience_exercise;
        ALTER TABLE audiences DROP column audience_enabled;
        ALTER TABLE audiences DROP column audience_exercise;
        ALTER TABLE audiences RENAME COLUMN audience_id TO team_id;
        ALTER TABLE audiences RENAME COLUMN audience_name TO team_name;
        ALTER TABLE audiences RENAME COLUMN audience_description TO team_description;
        ALTER TABLE audiences RENAME COLUMN audience_created_at TO team_created_at;
        ALTER TABLE audiences RENAME COLUMN audience_updated_at TO team_updated_at;
        ALTER TABLE audiences RENAME TO teams;
     """);
    select.execute("""  
        CREATE TABLE exercises_teams (
            exercise_id varchar(255) not null
                constraint exercise_id_fk
                    references exercises
                    on delete cascade,
            team_id varchar(255) not null
                constraint team_id_fk
                    references teams
                    on delete cascade,
            primary key (exercise_id, team_id)
        );
        CREATE INDEX idx_exercises_teams_exercise on exercises_teams (exercise_id);
        CREATE INDEX idx_exercises_teams_team on exercises_teams (team_id);
    """);
    select.execute("""  
        CREATE TABLE exercises_teams_users (
            exercise_id varchar(255) not null
                constraint exercise_id_fk
                    references exercises
                    on delete cascade,
            team_id varchar(255) not null
                constraint team_id_fk
                    references teams
                    on delete cascade,
            user_id varchar(255) not null
                constraint user_id_fk
                    references users
                    on delete cascade,                    
            primary key (exercise_id, team_id, user_id)
        );
        CREATE INDEX idx_exercises_teams_users_exercise on exercises_teams_users (exercise_id);
        CREATE INDEX idx_exercises_teams_users_team on exercises_teams_users (team_id);
        CREATE INDEX idx_exercises_teams_users_user on exercises_teams_users (user_id);
    """);
    select.execute("""
      ALTER TABLE users_audiences RENAME CONSTRAINT users_subaudiences_pkey TO users_teams_pkey;
      ALTER TABLE users_audiences RENAME COLUMN audience_id TO team_id;
      ALTER TABLE users_audiences RENAME to users_teams;
    """);
    select.execute("""
      ALTER TABLE audiences_tags RENAME CONSTRAINT audiences_tags_pkey TO teams_tags_pkey;
      ALTER TABLE audiences_tags RENAME COLUMN audience_id TO team_id;
      ALTER TABLE audiences_tags RENAME to teams_tags;
    """);
  }
}
