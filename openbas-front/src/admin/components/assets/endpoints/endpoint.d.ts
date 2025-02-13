import { type EndpointOutput, type EndpointOverviewOutput } from '../../../../utils/api-types';

export type EndpointStoreWithType = EndpointOutput & EndpointOverviewOutput & { type: string };
