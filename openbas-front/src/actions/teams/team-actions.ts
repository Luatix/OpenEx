import type { Dispatch } from 'redux';
import * as schema from '../Schema';
import { getReferential, putReferential, postReferential, delReferential, simplePostCall } from '../../utils/Action';
import type { SearchPaginationInput, Team, TeamCreateInput, TeamUpdateInput, User } from '../../utils/api-types';

export const fetchTeams = () => (dispatch: Dispatch) => {
  const uri = '/api/teams';
  return getReferential(schema.arrayOfTeams, uri)(dispatch);
};
export const searchTeams = (searchPaginationInput: SearchPaginationInput) => {
  const data = searchPaginationInput;
  const uri = '/api/teams/search';
  return simplePostCall(uri, data);
};

export const fetchTeamPlayers = (teamId: Team['team_id']) => (dispatch: Dispatch) => {
  const uri = `/api/teams/${teamId}/players`;
  return getReferential(schema.arrayOfUsers, uri)(dispatch);
};

export const updateTeam = (teamId: Team['team_id'], data: TeamUpdateInput) => (dispatch: Dispatch) => {
  const uri = `/api/teams/${teamId}`;
  return putReferential(schema.team, uri, data)(dispatch);
};

export const updateTeamPlayers = (teamId: Team['team_id'], data: { team_users: User['user_id'][] }) => (dispatch: Dispatch) => {
  const uri = `/api/teams/${teamId}/players`;
  return putReferential(schema.team, uri, data)(dispatch);
};

export const addTeam = (data: TeamCreateInput) => (dispatch: Dispatch) => {
  const uri = '/api/teams';
  return postReferential(schema.team, uri, data)(dispatch);
};

export const deleteTeam = (teamId: Team['team_id']) => (dispatch: Dispatch) => {
  const uri = `/api/teams/${teamId}`;
  return delReferential(uri, 'teams', teamId)(dispatch);
};
