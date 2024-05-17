import React from 'react';
import TeamsComponent from '../components/teams/Teams';
import { PermissionsContext, PermissionsContextType, TeamContext, type TeamContextType } from '../common/Context';
import { useHelper } from '../../../store';
import type { UserHelper } from '../../../actions/helper';
import type { TeamStore } from '../../../actions/teams/Team';
import type { Team, User } from '../../../utils/api-types';
import type { TeamsHelper } from '../../../actions/teams/team-helper';
import type { UserStore } from './players/Player';
import { updateTeamPlayers } from '../../../actions/teams/team-actions';
import { useAppDispatch } from '../../../utils/hooks';

const Teams = () => {
  const dispatch = useAppDispatch();
  const { user, teams }: { user: User, teams: TeamStore[] } = useHelper((helper: UserHelper & TeamsHelper) => ({
    user: helper.getMe(),
    teams: helper.getTeams(),
  }));

  const permissionsContext: PermissionsContextType = {
    permissions: {
      readOnly: false,
      canWrite: user.user_is_planner || false,
      isRunning: false,
    },
  };

  const teamContext: TeamContextType = {
    onAddUsersTeam(teamId: Team['team_id'], userIds: UserStore['user_id'][]): Promise<void> {
      return dispatch(updateTeamPlayers(teamId, {
        team_users: [...(teams.find((t) => t.team_id === teamId)?.team_users) || [], ...userIds],
      }));
    },
    onRemoveUsersTeam(teamId: TeamStore['team_id'], userIds: UserStore['user_id'][]): Promise<void> {
      return dispatch(updateTeamPlayers(teamId, {
        team_users: [...(teams.find((t) => t.team_id === teamId)?.team_users?.filter((u) => !userIds.includes(u)) || [])],
      }));
    },
  };

  return (
    <PermissionsContext.Provider value={permissionsContext}>
      <TeamContext.Provider value={teamContext}>
        <TeamsComponent />
      </TeamContext.Provider>
    </PermissionsContext.Provider>
  );
};

export default Teams;
