import * as schema from './Schema';
import {
  getReferential,
  fileSave,
  putReferential,
  postReferential,
  delReferential,
} from '../utils/Action';

export const fetchAudiences = (exerciseId) => (dispatch) => {
  const uri = `/api/exercises/${exerciseId}/audiences`;
  return getReferential(schema.arrayOfAudiences, uri)(dispatch);
};

export const fetchAudience = (audienceId, exerciseId) => (dispatch) => {
  const uri = `/api/exercises/${exerciseId}/audiences/${audienceId}`;
  return getReferential(schema.audience, uri)(dispatch);
};

export const downloadExportAudiences = (exerciseId) => (dispatch) => fileSave(
  `/api/exercises/${exerciseId}/audiences.xlsx`,
  'audiences.xlsx',
)(dispatch);

export const downloadExportAudience = (exerciseId, audienceId) => (dispatch) => fileSave(
  `/api/exercises/${exerciseId}/audiences/${audienceId}/users.xlsx`,
  'users.xlsx',
)(dispatch);

export const updateAudience = (exerciseId, audienceId, data) => (dispatch) => {
  const uri = `/api/exercises/${exerciseId}/audiences/${audienceId}`;
  return putReferential(schema.audience, uri, data)(dispatch);
};

export const addAudience = (exerciseId, data) => (dispatch) => {
  const uri = `/api/exercises/${exerciseId}/audiences`;
  return postReferential(schema.audience, uri, data)(dispatch);
};

export const deleteAudience = (exerciseId, audienceId) => (dispatch) => {
  const uri = `/api/exercises/${exerciseId}/audiences/${audienceId}`;
  return delReferential(uri, 'audiences', audienceId)(dispatch);
};

export const copyAudienceToExercise = (exerciseId, audienceId, data) => (
  dispatch,
) => {
  const uri = `/api/exercises/${exerciseId}/copy-audience/${audienceId}`;
  return putReferential(schema.audience, uri, data)(dispatch);
};
