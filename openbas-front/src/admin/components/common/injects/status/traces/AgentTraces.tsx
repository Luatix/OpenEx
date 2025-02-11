import { ArrowDropDownSharp, ArrowRightSharp } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { useState } from 'react';

import { useFormatter } from '../../../../../../components/i18n';
import ItemStatus from '../../../../../../components/ItemStatus';
import { AgentStatusOutput, ExecutionTracesOutput } from '../../../../../../utils/api-types';
import ExecutionTime from './ExecutionTime';
import TraceMessage from './TraceMessage';

interface Props {
  agentStatus: AgentStatusOutput;
}

const AgentTraces = ({ agentStatus }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useFormatter();

  const toggleExpand = () => {
    setIsExpanded(prevState => !prevState);
  };

  const tracesByAction: { action: string; traces: ExecutionTracesOutput[] }[] = [];
  (agentStatus.agent_traces || [])
    .sort((a, b) => new Date(a.execution_time).getTime() - new Date(b.execution_time).getTime())
    .forEach((trace, index) => {
      if (index > 0 && trace.execution_action === tracesByAction[tracesByAction?.length - 1]?.action) {
        tracesByAction[tracesByAction?.length - 1].traces.push(trace);
      } else {
        tracesByAction.push({ action: trace.execution_action, traces: [trace] });
      }
    });

  return (
    <>
      <div
        onClick={toggleExpand}
        style={{
          marginTop: '5px',
          cursor: 'pointer',
          display: 'flex',
        }}
      >
        {isExpanded ? <ArrowDropDownSharp /> : <ArrowRightSharp /> }
        <Typography gutterBottom marginRight="12px">
          {agentStatus.agent_name}
        </Typography>
        <ItemStatus isInject={true} status={agentStatus.agent_status_name ?? 'PENDING'} label={agentStatus.agent_status_name ?? 'PENDING'} />
      </div>
      {isExpanded && (
        <div style={{ marginLeft: '24px', marginTop: '5px' }}>
          <ExecutionTime
            startDate={agentStatus.tracking_sent_date ?? null}
            endDate={agentStatus.tracking_end_date ?? null}
          />
          <div style={{ display: 'flex', flexBasis: '100%', gap: '12px' }}>
            <Typography variant="h3">{t('Executor')}</Typography>
            <img
              src={`/api/images/executors/${agentStatus.agent_executor_type}`}
              alt={agentStatus.agent_executor_type}
              style={{ width: 20, height: 20, borderRadius: 4 }}
            />
            <Typography variant="body2">{t(agentStatus.agent_executor_name)}</Typography>
          </div>
          <Typography variant="h3">
            {t('Traces :')}
          </Typography>
          {(tracesByAction || [])
            .map((traceByAction, index) => (
              <div key={`agent-trace-${index}`}>
                <Typography variant="h3">
                  {t(traceByAction.action)}
                </Typography>
                <TraceMessage traces={traceByAction.traces} />
              </div>
            ))}
        </div>
      )}
    </>
  );
};
export default AgentTraces;
