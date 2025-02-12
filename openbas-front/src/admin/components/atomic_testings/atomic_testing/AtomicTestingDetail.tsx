import { Props } from 'html-react-parser/lib/attributes-to-props';
import { FunctionComponent, useContext, useEffect, useState } from 'react';

import { searchEndpoints } from '../../../../actions/assets/endpoint-actions';
import { buildFilter } from '../../../../components/common/queryable/filter/FilterUtils';
import { buildSearchPagination } from '../../../../components/common/queryable/QueryableUtils';
import Loader from '../../../../components/Loader';
import { EndpointOutput, type InjectResultOverviewOutput } from '../../../../utils/api-types';
import InjectStatus from '../../common/injects/status/InjectStatus';
import { InjectResultOverviewOutputContext, InjectResultOverviewOutputContextType } from '../InjectResultOverviewOutputContext';

const AtomicTestingDetail: FunctionComponent<Props> = () => {
  // Fetching data
  const [loading, setLoading] = useState(true);
  const { injectResultOverviewOutput } = useContext<InjectResultOverviewOutputContextType>(InjectResultOverviewOutputContext);

  const [endpointsMap, setEndpointsMap] = useState<Map<string, EndpointOutput>>(new Map());

  const extractEndpointsFromInjectResult = (injectResult: InjectResultOverviewOutput): Map<string, EndpointOutput> => {
    const map = new Map<string, EndpointOutput>();
    injectResult?.inject_targets.forEach((result) => {
      if (result.targetType === 'ASSETS_GROUPS' && result.children) {
        result.children.forEach(({ id, name, platformType }) => {
          map.set(id, { asset_id: id, asset_name: name, endpoint_platform: platformType } as EndpointOutput);
        });
      }
      if (result.targetType === 'ASSETS') {
        map.set(result.id, { asset_id: result.id, asset_name: result.name, endpoint_platform: result.platformType } as EndpointOutput);
      }
    });
    return map;
  };

  const findMissingEndpointIds = (injectResult: InjectResultOverviewOutput, existingMap: Map<string, EndpointOutput>): string[] => {
    return injectResult.inject_status?.status_traces_by_agent
      ?.filter(traceByAgent => !existingMap.has(traceByAgent.asset_id))
      .map(traceByAgent => traceByAgent.asset_id) || [];
  };

  useEffect(() => {
    if (!injectResultOverviewOutput) return;
    const newEndpointsMap = extractEndpointsFromInjectResult(injectResultOverviewOutput);
    const missingEndpointIds = findMissingEndpointIds(injectResultOverviewOutput, newEndpointsMap);
    if (missingEndpointIds.length > 0) {
      searchEndpoints(buildSearchPagination({
        filterGroup: {
          mode: 'and',
          filters: [
            buildFilter('asset_id', missingEndpointIds, 'eq'),
          ],
        },
      })).then(({ data }) => {
        data?.content.forEach((endpoint: EndpointOutput) => newEndpointsMap.set(endpoint.asset_id, endpoint));
        setEndpointsMap(newEndpointsMap);
        setLoading(false);
      });
    } else {
      setEndpointsMap(newEndpointsMap);
      setLoading(false);
    }
  }, [injectResultOverviewOutput]);

  if (loading) {
    return <Loader />;
  }
  return (
    <InjectStatus
      injectStatus={injectResultOverviewOutput?.inject_status ?? null}
      endpointsMap={endpointsMap}
    />
  );
};

export default AtomicTestingDetail;
