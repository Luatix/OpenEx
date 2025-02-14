import { delReferential, getReferential, postReferential, putReferential } from '../../utils/Action';
import { channelReader } from '../Schema';
import { arrayOfChannels, channelAction } from './channel-schema';

export const fetchChannels = () => (dispatch) => {
  const uri = '/api/channels';
  return getReferential(arrayOfChannels, uri)(dispatch);
};
export const fetchChannel = channelId => (dispatch) => {
  const uri = `/api/channels/${channelId}`;
  return getReferential(channelAction, uri)(dispatch);
};
export const updateChannel = (channelId, data) => (dispatch) => {
  const uri = `/api/channels/${channelId}`;
  return putReferential(channelAction, uri, data)(dispatch);
};
export const updateChannelLogos = (channelId, data) => (dispatch) => {
  const uri = `/api/channels/${channelId}/logos`;
  return putReferential(channelAction, uri, data)(dispatch);
};
export const addChannel = data => dispatch => postReferential(channelAction, '/api/channels', data)(dispatch);
export const deleteChannel = channelId => (dispatch) => {
  const uri = `/api/channels/${channelId}`;
  return delReferential(uri, 'channels', channelId)(dispatch);
};

export const fetchPlayerChannel = (exerciseId, channelId, userId) => (dispatch) => {
  const uri = `/api/player/channels/${exerciseId}/${channelId}?userId=${userId}`;
  return getReferential(channelReader, uri)(dispatch);
};
export const fetchObserverChannel = (exerciseId, channelId) => (dispatch) => {
  const uri = `/api/observer/channels/${exerciseId}/${channelId}`;
  return getReferential(channelReader, uri)(dispatch);
};
