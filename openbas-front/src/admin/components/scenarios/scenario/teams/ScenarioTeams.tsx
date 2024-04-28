import { useParams } from 'react-router-dom';
import React, { useContext } from 'react';
import { useHelper } from '../../../../../store';
import useDataLoader from '../../../../../utils/ServerSideEvent';
import { useAppDispatch } from '../../../../../utils/hooks';
import {
  addScenarioTeamPlayers,
  addScenarioTeams,
  disableScenarioTeamPlayers,
  enableScenarioTeamPlayers,
  fetchScenarioTeams,
  removeScenarioTeamPlayers,
  removeScenarioTeams,
} from '../../../../../actions/scenarios/scenario-actions';
import DefinitionMenu from '../../../components/DefinitionMenu';
import type { ScenariosHelper } from '../../../../../actions/scenarios/scenario-helper';
import type { ScenarioStore } from '../../../../../actions/scenarios/Scenario';
import type { TeamStore } from '../../../../../actions/teams/Team';
import Teams from '../../../components/teams/Teams';
import { PermissionsContext, TeamContext } from '../../../common/Context';
import type { Team, TeamCreateInput } from '../../../../../utils/api-types';
import { addTeam, fetchTeams } from '../../../../../actions/teams/team-actions';
import type { UserStore } from '../../../teams/players/Player';
import AddTeams from '../../../components/teams/AddTeams';

interface Props {
  scenarioTeamsUsers: ScenarioStore['scenario_teams_users'],
}

export const teamContextForScenario = (scenarioId: ScenarioStore['scenario_id'], scenarioTeamsUsers: ScenarioStore['scenario_teams_users']) => {
  const dispatch = useAppDispatch();

  return {
    async onAddUsersTeam(teamId: Team['team_id'], userIds: UserStore['user_id'][]): Promise<void> {
      await dispatch(addScenarioTeamPlayers(scenarioId, teamId, { scenario_team_players: userIds }));
      return dispatch(fetchTeams());
    },
    async onRemoveUsersTeam(teamId: Team['team_id'], userIds: UserStore['user_id'][]): Promise<void> {
      await dispatch(removeScenarioTeamPlayers(scenarioId, teamId, { scenario_team_players: userIds }));
      return dispatch(fetchTeams());
    },
    onAddTeam(teamId: Team['team_id']): Promise<void> {
      return dispatch(addScenarioTeams(scenarioId, { scenario_teams: [teamId] }));
    },
    onCreateTeam(team: TeamCreateInput): Promise<{ result: string }> {
      return dispatch(addTeam({ ...team, team_scenarios: [scenarioId] }));
    },
    checkUserEnabled(teamId: Team['team_id'], userId: UserStore['user_id']): boolean {
      return scenarioTeamsUsers.filter((o: ScenarioStore['scenario_teams_users']) => o.scenario_id === scenarioId && o.team_id === teamId && userId === o.user_id).length > 0;
    },
    computeTeamUsersEnabled(teamId: Team['team_id']) {
      return scenarioTeamsUsers.filter((o: ScenarioStore['scenario_teams_users']) => o.team_id === teamId).length;
    },
    onRemoveTeam(teamId: Team['team_id']): void {
      dispatch(removeScenarioTeams(scenarioId, { scenario_teams: [teamId] }));
    },
    onToggleUser(teamId: Team['team_id'], userId: UserStore['user_id'], userEnabled: boolean): void {
      if (userEnabled) {
        dispatch(disableScenarioTeamPlayers(scenarioId, teamId, { scenario_team_players: [userId] }));
      } else {
        dispatch(enableScenarioTeamPlayers(scenarioId, teamId, { scenario_team_players: [userId] }));
      }
    },
  };
};

const ScenarioTeams: React.FC<Props> = ({ scenarioTeamsUsers }) => {
  // Standard hooks
  const dispatch = useAppDispatch();
  const { scenarioId } = useParams() as { scenarioId: ScenarioStore['scenario_id'] };

  const { teams }: { scenario: ScenarioStore, teams: TeamStore[] } = useHelper((helper: ScenariosHelper) => ({
    teams: helper.getScenarioTeams(scenarioId),
  }));

  const { permissions } = useContext(PermissionsContext);

  useDataLoader(() => {
    dispatch(fetchScenarioTeams(scenarioId));
  });

  const teamIds = teams.map((t) => t.team_id);

  const onAddTeams = (ids: Team['team_id'][]) => dispatch(addScenarioTeams(scenarioId, { scenario_teams: ids }));

  return (
    <TeamContext.Provider value={teamContextForScenario(scenarioId, scenarioTeamsUsers)}>
      <DefinitionMenu base="/admin/scenarios" id={scenarioId} />
      <Teams teamIds={teamIds} contextual={true} />
      {permissions.canWrite && <AddTeams addedTeamIds={teamIds} onAddTeams={onAddTeams} />}
    </TeamContext.Provider>
  );
};

export default ScenarioTeams;
