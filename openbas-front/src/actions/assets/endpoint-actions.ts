import { Dispatch } from 'redux';

import { delReferential, getReferential, putReferential, simpleCall, simplePostCall } from '../../utils/Action';
import type { Endpoint, EndpointOutput, EndpointUpdateInput, SearchPaginationInput } from '../../utils/api-types';
import { arrayOfEndpoints, endpoint } from './asset-schema';

const ENDPOINT_URI = '/api/endpoints';

export const updateEndpoint = (
  assetId: EndpointOutput['asset_id'],
  data: EndpointUpdateInput,
) => (dispatch: Dispatch) => {
  const uri = `${ENDPOINT_URI}/${assetId}`;
  return putReferential(endpoint, uri, data)(dispatch);
};

export const deleteEndpoint = (assetId: Endpoint['asset_id']) => (dispatch: Dispatch) => {
  const uri = `${ENDPOINT_URI}/${assetId}`;
  return delReferential(uri, endpoint.key, assetId)(dispatch);
};

export const fetchEndpoints = () => (dispatch: Dispatch) => {
  return getReferential(arrayOfEndpoints, ENDPOINT_URI)(dispatch);
};

export const searchEndpoints = (searchPaginationInput: SearchPaginationInput) => {
  const data = searchPaginationInput;
  const uri = `${ENDPOINT_URI}/search`;
  return simplePostCall(uri, data);
};

export const findEndpoints = (endpointIds: string[]) => {
  const data = endpointIds;
  const uri = `${ENDPOINT_URI}/find`;
  return simplePostCall(uri, data);
};

export const fetchEndpoint = (endpointId: string) => (dispatch: Dispatch) => {
  const uri = `/api/endpoints/${endpointId}`;
  return getReferential(endpoint, uri)(dispatch);
};

export const searchEndpointAsOption = (searchText: string = '', simulationOrScenarioId: string = '') => {
  const params = { searchText, simulationOrScenarioId };
  return simpleCall(`${ENDPOINT_URI}/options`, params);
};

export const searchEndpointByIdAsOption = (ids: string[]) => {
  return simplePostCall(`${ENDPOINT_URI}/options`, ids);
};
