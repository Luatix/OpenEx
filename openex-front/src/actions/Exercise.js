import * as schema from './Schema';
import {
  getReferential,
  putReferential,
  postReferential,
  delReferential,
} from '../utils/Action';

export const fetchExercises = () => (dispatch) => getReferential(schema.arrayOfExercises, '/api/exercises')(dispatch);

export const fetchExercise = (exerciseId) => (dispatch) => getReferential(schema.exercise, `/api/exercises/${exerciseId}`)(dispatch);

export const addExercise = (data) => (dispatch) => postReferential(schema.exercise, '/api/exercises', data)(dispatch);

export const updateExercise = (exerciseId, data) => (dispatch) => putReferential(
  schema.exercise,
  `/api/exercises/${exerciseId}`,
  data,
)(dispatch);

export const updateExerciseStartDate = (exerciseId, data) => (dispatch) => putReferential(
  schema.exercise,
  `/api/exercises/${exerciseId}/start_date`,
  data,
)(dispatch);

export const updateExerciseTags = (exerciseId, data) => (dispatch) => putReferential(
  schema.exercise,
  `/api/exercises/${exerciseId}/tags`,
  data,
)(dispatch);

export const updateExerciseStatus = (exerciseId, status) => (dispatch) => putReferential(
  schema.exercise,
  `/api/exercises/${exerciseId}/status`,
  status,
)(dispatch);

export const deleteExercise = (exerciseId) => (dispatch) => delReferential(
  `/api/exercises/${exerciseId}`,
  'exercises',
  exerciseId,
)(dispatch);

export const importingExercise = (data) => (dispatch) => {
  const uri = '/api/exercises/import';
  return postReferential(schema.exercise, uri, data)(dispatch);
};

// export const importExercise = (fileId, data) => (dispatch) => {
//   const uri = `/api/exercises/import?file=${fileId}&import_exercise=${data.exercise}
//   &import_audience=${data.audience}&import_objective=${data.objective}&import_scenarios
//   =${data.scenarios}&import_injects=${data.injects}&import_incidents=${data.incidents}`;
//
//   return postReferential(schema.importExerciseResult, uri, data)(dispatch);
// };

// export const importExerciseFromPath = (data) => (dispatch) => {
//   const uri = `/api/exercises/import?import_exercise=${data.exercise}
//   &import_audience=${data.audience}&import_objective=${data.objective}
//   &import_scenarios=${data.scenarios}&import_injects=${data.injects}
//   &import_incidents=${data.incidents}&import_path=${data.import_path}`;
//
//   return postReferential(schema.importExerciseResult, uri, data)(dispatch);
// };

export const checkIfExerciseNameExist = (fileId) => (dispatch) => getReferential(
  schema.checkIfExerciseNameExistResult,
  `/api/exercises/import/check/exercise/${fileId}`,
)(dispatch);

export const getStatisticsForExercise = (exerciseId, data) => (dispatch) => getReferential(
  schema.objectOfStatistics,
  `/api/exercises/${exerciseId}/statistics?interval=${data.value}`,
)(dispatch);
