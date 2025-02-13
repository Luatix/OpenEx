import { simpleCall, simpleDelCall, simplePostCall, simplePutCall } from '../../utils/Action';
import { type AtomicTestingInput, type SearchPaginationInput } from '../../utils/api-types';

const ATOMIC_TESTING_URI = '/api/atomic-testings';

export const searchAtomicTestings = (searchPaginationInput: SearchPaginationInput) => {
  const data = searchPaginationInput;
  const uri = `${ATOMIC_TESTING_URI}/search`;
  return simplePostCall(uri, data);
};

export const fetchInjectResultOverviewOutput = (injectId: string) => {
  const uri = `${ATOMIC_TESTING_URI}/${injectId}`;
  return simpleCall(uri);
};

export const fetchAtomicTestingPayload = (injectId: string) => {
  const uri = `${ATOMIC_TESTING_URI}/${injectId}/payload`;
  return simpleCall(uri);
};

export const deleteAtomicTesting = (injectId: string) => {
  const uri = `${ATOMIC_TESTING_URI}/${injectId}`;
  return simpleDelCall(uri);
};

export const updateAtomicTesting = (injectId: string, data: AtomicTestingInput) => {
  const uri = `${ATOMIC_TESTING_URI}/${injectId}`;
  return simplePutCall(uri, data);
};

export const duplicateAtomicTesting = (injectId: string) => {
  const uri = `${ATOMIC_TESTING_URI}/${injectId}/duplicate`;
  return simplePostCall(uri, null);
};

export const launchAtomicTesting = (injectId: string) => {
  const uri = `${ATOMIC_TESTING_URI}/${injectId}/launch`;
  return simplePostCall(uri);
};

export const relaunchAtomicTesting = (injectId: string) => {
  const uri = `${ATOMIC_TESTING_URI}/${injectId}/relaunch`;
  return simplePostCall(uri);
};

export const fetchTargetResult = (injectId: string, targetId: string, targetType: string, parentTargetId?: string) => {
  let uri = `${ATOMIC_TESTING_URI}/${injectId}/target_results/${targetId}/types/${targetType}`;
  if (parentTargetId) {
    uri += `?parentTargetId=${encodeURIComponent(parentTargetId)}`;
  }
  return simpleCall(uri);
};

export const createAtomicTesting = (data: AtomicTestingInput) => {
  return simplePostCall(ATOMIC_TESTING_URI, data);
};

// -- TEAMS --

export const searchAtomicTestingTeams = (paginationInput: SearchPaginationInput, contextualOnly: boolean = false) => {
  const uri = `${ATOMIC_TESTING_URI}/teams/search?contextualOnly=${contextualOnly}`;
  return simplePostCall(uri, paginationInput);
};
