import { Typography } from '@mui/material';

import { useFormatter } from '../../../../../../components/i18n';
import PlatformIcon from '../../../../../../components/PlatformIcon';
import { AgentStatusOutput, EndpointOutput } from '../../../../../../utils/api-types';
import AgentTraces from './AgentTraces';

interface Props {
  endpoint: EndpointOutput;
  tracesByAgent: AgentStatusOutput[];
}

const EndpointTraces = ({ endpoint, tracesByAgent }: Props) => {
  const { t } = useFormatter();

  const sortedTraces = [...tracesByAgent].sort((a, b) => {
    const nameA = a.agent_name ?? '';
    const nameB = b.agent_name ?? '';
    return nameA.localeCompare(nameB);
  });

  return (
    <div style={{ display: 'grid', marginTop: '24px', gap: '5px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Typography margin="0" variant="h3">{t('Name')}</Typography>
        <Typography variant="body2">{endpoint.asset_name}</Typography>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Typography margin="0" variant="h3">{t('Type')}</Typography>
        <Typography variant="body2">{t('Endpoint').toUpperCase()}</Typography>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Typography margin="0" variant="h3">{t('Platform')}</Typography>
        <PlatformIcon key={endpoint.endpoint_platform} platform={endpoint.endpoint_platform} tooltip width={16} />
        <Typography variant="body2">{t(endpoint.endpoint_platform)}</Typography>
      </div>
      <div style={{ marginTop: '8px' }}>
        {sortedTraces.map(t => <AgentTraces key={t.agent_id} agentStatus={t} />)}
      </div>
    </div>
  );
};
export default EndpointTraces;
