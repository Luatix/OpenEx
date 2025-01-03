import { addExerciseTeamPlayers, disableExerciseTeamPlayers, enableExerciseTeamPlayers, removeExerciseTeamPlayers } from '../../../../../actions/Exercise';
import { addExerciseTeams, removeExerciseTeams, replaceExerciseTeams, searchExerciseTeams } from '../../../../../actions/exercises/exercise-teams-action';
import { addTeam, fetchTeams } from '../../../../../actions/teams/team-actions';
import type { Page } from '../../../../../components/common/queryable/Page';
import { Exercise, ExerciseTeamUser, SearchPaginationInput, Team, TeamCreateInput, TeamOutput } from '../../../../../utils/api-types';
import { useAppDispatch } from '../../../../../utils/hooks';
import { TeamContextType } from '../../../common/Context';
import type { UserStore } from '../../../teams/players/Player';

const teamContextForExercise = (exerciseId: Exercise['exercise_id'], exerciseTeamsUsers: Exercise['exercise_teams_users']): TeamContextType => {
  const dispatch = useAppDispatch();

  return {
    async onAddUsersTeam(teamId: Team['team_id'], userIds: UserStore['user_id'][]): Promise<void> {
      await dispatch(addExerciseTeamPlayers(exerciseId, teamId, { exercise_team_players: userIds }));
      return dispatch(fetchTeams());
    },
    async onRemoveUsersTeam(teamId: Team['team_id'], userIds: UserStore['user_id'][]): Promise<void> {
      await dispatch(removeExerciseTeamPlayers(exerciseId, teamId, { exercise_team_players: userIds }));
      return dispatch(fetchTeams());
    },
    onAddTeam(teamId: Team['team_id']): Promise<void> {
      return dispatch(addExerciseTeams(exerciseId, { exercise_teams: [teamId] }));
    },
    onCreateTeam(team: TeamCreateInput): Promise<{ result: string }> {
      return dispatch(addTeam({ ...team, team_exercises: [exerciseId] }));
    },
    checkUserEnabled(teamId: Team['team_id'], userId: UserStore['user_id']): boolean {
      return (exerciseTeamsUsers ?? []).filter((o: ExerciseTeamUser) => o.exercise_id === exerciseId && o.team_id === teamId && userId === o.user_id).length > 0;
    },
    computeTeamUsersEnabled(teamId: Team['team_id']) {
      return (exerciseTeamsUsers ?? []).filter((o: ExerciseTeamUser) => o.team_id === teamId).length;
    },
    onRemoveTeam(teamId: Team['team_id']): void {
      dispatch(removeExerciseTeams(exerciseId, { exercise_teams: [teamId] }));
    },
    onReplaceTeam(teamIds: Team['team_id'][]): Promise<{ result: string[]; entities: { teams: Record<string, Team> } }> {
      return dispatch(replaceExerciseTeams(exerciseId, { exercise_teams: teamIds }));
    },
    onToggleUser(teamId: Team['team_id'], userId: UserStore['user_id'], userEnabled: boolean): void {
      if (userEnabled) {
        dispatch(disableExerciseTeamPlayers(exerciseId, teamId, { exercise_team_players: [userId] }));
      } else {
        dispatch(enableExerciseTeamPlayers(exerciseId, teamId, { exercise_team_players: [userId] }));
      }
    },
    searchTeams(input: SearchPaginationInput, contextualOnly?: boolean): Promise<{ data: Page<TeamOutput> }> {
      return searchExerciseTeams(exerciseId, input, contextualOnly);
    },
  };
};

export default teamContextForExercise;
