import * as schema from './Schema';
import { delReferential, postReferential, putReferential } from '../utils/Action';

export const updateExerciseObjective = (exerciseId, objectiveId, data) => (dispatch) => {
  const uri = `/api/exercises/${exerciseId}/objectives/${objectiveId}`;
  return putReferential(schema.objective, uri, data)(dispatch);
};

export const addExerciseObjective = (exerciseId, data) => (dispatch) => {
  const uri = `/api/exercises/${exerciseId}/objectives`;
  return postReferential(schema.objective, uri, data)(dispatch);
};

export const deleteExerciseObjective = (exerciseId, objectiveId) => (dispatch) => {
  const uri = `/api/exercises/${exerciseId}/objectives/${objectiveId}`;
  return delReferential(uri, 'objectives', objectiveId)(dispatch);
};

export const updateScenarioObjective = (scenarioId, objectiveId, data) => (dispatch) => {
  const uri = `/api/scenarios/${scenarioId}/objectives/${objectiveId}`;
  return putReferential(schema.objective, uri, data)(dispatch);
};

export const addScenarioObjective = (scenarioId, data) => (dispatch) => {
  const uri = `/api/scenarios/${scenarioId}/objectives`;
  return postReferential(schema.objective, uri, data)(dispatch);
};

export const deleteScenarioObjective = (scenarioId, objectiveId) => (dispatch) => {
  const uri = `/api/scenarios/${scenarioId}/objectives/${objectiveId}`;
  return delReferential(uri, 'objectives', objectiveId)(dispatch);
};
