import { type InjectResultOverviewOutput } from '../api-types';

const isInjectWithPayloadInfo = (injectResultOverviewOutput: InjectResultOverviewOutput) => {
  return injectResultOverviewOutput.inject_type !== undefined && !['openbas_email', 'openbas_channel', 'openbas_challenge', 'openbas_ovh_sms', 'openbas_mastodon', 'openbas_http_query'].includes(injectResultOverviewOutput.inject_type);
};

export default isInjectWithPayloadInfo;
