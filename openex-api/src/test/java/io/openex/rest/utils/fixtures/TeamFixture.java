package io.openex.rest.utils.fixtures;

import io.openex.database.model.Team;
import io.openex.database.model.User;

import java.util.ArrayList;

public class TeamFixture {

  public static final String TEAM_NAME = "My team";

  public static Team getTeam(final User user) {
    Team team = new Team();
    team.setName(TEAM_NAME);
    team.setUsers(new ArrayList<>(){{add(user);}});
    return team;
  }

}
