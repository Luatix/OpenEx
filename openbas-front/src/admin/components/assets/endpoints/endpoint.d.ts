import { EndpointOutput, EndpointOverviewOutput } from '../../../../utils/api-types';

export type EndpointStoreWithType = EndpointOutput & EndpointOverviewOutput & { type: string };
