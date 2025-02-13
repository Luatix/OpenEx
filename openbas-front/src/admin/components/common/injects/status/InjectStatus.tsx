import { Paper, Typography } from '@mui/material';

import { useFormatter } from '../../../../../components/i18n';
import ItemStatus from '../../../../../components/ItemStatus';
import {
  type AgentStatusOutput,
  type EndpointOutput, type InjectStatusOutput,
} from '../../../../../utils/api-types';
import EndpointTraces from './traces/EndpointTraces';
import ExecutionTime from './traces/ExecutionTime';
import TraceMessage from './traces/TraceMessage';

interface Props {
  injectStatus?: InjectStatusOutput | null;
  endpointsMap?: Map<string, EndpointOutput>;
}

const InjectStatus = ({ injectStatus = null, endpointsMap = new Map() }: Props) => {
  const { t } = useFormatter();
  const orderedTracesByAsset = new Map<string, AgentStatusOutput[]>();

  (injectStatus?.status_traces_by_agent || []).forEach((t) => {
    if (!orderedTracesByAsset.has(t.asset_id)) {
      orderedTracesByAsset.set(t.asset_id, []);
    }
    orderedTracesByAsset.get(t.asset_id)!.push(t);
  });

  return (
    <>
      <Typography variant="h4">{t('Execution logs')}</Typography>
      {injectStatus ? (
        <Paper variant="outlined" style={{ padding: '20px' }}>
          <Typography variant="subtitle1" style={{ fontWeight: 'bold' }} gutterBottom>
            {t('Execution status')}
          </Typography>
          {injectStatus.status_name
          && (
            <ItemStatus
              isInject
              status={injectStatus.status_name}
              label={t(injectStatus.status_name)}
            />
          )}
          <ExecutionTime style={{ marginTop: '16px' }} startDate={injectStatus.tracking_sent_date ?? null} endDate={injectStatus.tracking_end_date ?? null} />
          <Typography variant="subtitle1" style={{ fontWeight: 'bold', marginTop: 20 }} gutterBottom>
            {t('Traces')}
          </Typography>
          {(injectStatus.status_main_traces || []).length > 0 && <TraceMessage traces={injectStatus.status_main_traces || []} />}
          {Array.from(orderedTracesByAsset.entries()).map(([assetId, tracesByAgent]) => (
            <EndpointTraces key={assetId} endpoint={endpointsMap.get(assetId) as EndpointOutput} tracesByAgent={tracesByAgent || []} />
          ))}
        </Paper>
      ) : (
        <Paper variant="outlined" style={{ padding: '20px' }}>
          <Typography variant="body1">{t('No data available')}</Typography>
        </Paper>
      )}
    </>
  );
};
export default InjectStatus;
