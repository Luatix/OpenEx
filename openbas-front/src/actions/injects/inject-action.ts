import axios from 'axios';
import { Dispatch } from 'redux';

import { getReferential, simpleCall, simplePostCall } from '../../utils/Action';
import {
  Exercise,
  InjectBulkProcessingInput,
  InjectExportRequestInput,
  Scenario,
  SearchPaginationInput,
} from '../../utils/api-types';
import { MESSAGING$ } from '../../utils/Environment';
import * as schema from '../Schema';

export const testInject = (injectId: string) => {
  const uri = `/api/injects/${injectId}/test`;
  return simpleCall(uri);
};

export const bulkTestInjects = (data: InjectBulkProcessingInput) => {
  const uri = '/api/injects/test';
  return simplePostCall(uri, data, false).catch((error) => {
    MESSAGING$.notifyError('Can\'t be tested');
    throw error;
  });
};

export const exportInjects = (data: InjectExportRequestInput) => {
  const uri = '/api/injects/export';
  return axios.post(uri, data, { responseType: 'arraybuffer' }).catch((error) => {
    MESSAGING$.notifyError('Could not request export of injects');
    throw error;
  });
};

// -- EXERCISES --

export const fetchExerciseInjectsSimple = (exerciseId: Exercise['exercise_id']) => (dispatch: Dispatch) => {
  const uri = `/api/exercises/${exerciseId}/injects/simple`;
  return getReferential(schema.arrayOfInjects, uri)(dispatch);
};

export const searchExerciseInjectsSimple = (exerciseId: Exercise['exercise_id'], input: SearchPaginationInput) => {
  const uri = `/api/exercises/${exerciseId}/injects/simple`;
  return simplePostCall(uri, input);
};

// -- SCENARIOS --

export const fetchScenarioInjectsSimple = (scenarioId: Scenario['scenario_id']) => (dispatch: Dispatch) => {
  const uri = `/api/scenarios/${scenarioId}/injects/simple`;
  return getReferential(schema.arrayOfInjects, uri)(dispatch);
};

export const searchScenarioInjectsSimple = (scenarioId: Scenario['scenario_id'], input: SearchPaginationInput) => {
  const uri = `/api/scenarios/${scenarioId}/injects/simple`;
  return simplePostCall(uri, input);
};
