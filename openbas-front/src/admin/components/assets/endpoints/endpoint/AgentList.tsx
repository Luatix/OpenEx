import { DevicesOtherOutlined } from '@mui/icons-material';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { type CSSProperties, type FunctionComponent } from 'react';
import { makeStyles } from 'tss-react/mui';

import { fetchExecutors } from '../../../../../actions/Executor';
import { type ExecutorHelper } from '../../../../../actions/executors/executor-helper';
import { useFormatter } from '../../../../../components/i18n';
import { useHelper } from '../../../../../store';
import { type AgentOutput } from '../../../../../utils/api-types';
import { useAppDispatch } from '../../../../../utils/hooks';
import useDataLoader from '../../../../../utils/hooks/useDataLoader';
import AssetStatus from '../../AssetStatus';
import AgentDeploymentMode from '../AgentDeploymentMode';
import AgentPrivilege from '../AgentPrivilege';

const useStyles = makeStyles()(() => ({
  itemHead: {
    paddingLeft: 10,
    textTransform: 'uppercase',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
  bodyItems: {
    display: 'flex',
    alignItems: 'center',
  },
  bodyItem: {
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 10,
  },
}));

const inlineStyles: Record<string, CSSProperties> = {
  agent_executed_by_user: {
    width: '30%',
  },
  agent_executor: {
    width: '15%',
    display: 'flex',
    alignItems: 'center',
    cursor: 'default',
  },
  agent_privilege: {
    width: '15%',
  },
  agent_deployment_mode: {
    width: '10%',
  },
  agent_active: {
    width: '10%',
  },
  agent_last_seen: {
    width: '20%',
  },
};

interface Props {
  agents: AgentOutput[];
}

const AgentList: FunctionComponent<Props> = ({ agents }) => {
  const { classes } = useStyles();
  const dispatch = useAppDispatch();
  const { t, fldt } = useFormatter();
  // Fetching data
  const { executorsMap } = useHelper((helper: ExecutorHelper) => ({
    executorsMap: helper.getExecutorsMap(),
  }));
  useDataLoader(() => {
    dispatch(fetchExecutors());
  });

  // Headers
  const headers = [
    {
      field: 'agent_executed_by_user',
      label: 'Agent Name',
      isSortable: false,
      value: (agent: AgentOutput) => agent.agent_executed_by_user,
    },
    {
      field: 'agent_executor',
      label: 'Executor',
      isSortable: false,
      value: (agent: AgentOutput) => {
        const executor = agent.agent_executor?.executor_id ? executorsMap[agent.agent_executor?.executor_id] : undefined;
        return (
          <>
            {executor && (
              <img
                src={`/api/images/executors/${executor.executor_type}`}
                alt={executor.executor_type}
                style={{ width: 25, height: 25, borderRadius: 4, marginRight: 10 }}
              />
            )}
            {executor?.executor_name ?? t('Unknown')}
          </>
        );
      },
    },
    {
      field: 'agent_privilege',
      label: 'Privilege',
      isSortable: false,
      value: (agent: AgentOutput) => {
        return (<AgentPrivilege variant="list" privilege={agent.agent_privilege ?? 'admin'} />);
      },
    },
    {
      field: 'agent_deployment_mode',
      label: 'Deployment',
      isSortable: false,
      value: (agent: AgentOutput) => {
        return (<AgentDeploymentMode variant="list" mode={agent.agent_deployment_mode ?? 'session'} />);
      },
    },
    {
      field: 'agent_active',
      label: 'Status',
      isSortable: false,
      value: (agent: AgentOutput) => {
        return (<AssetStatus variant="list" status={agent.agent_active ? 'Active' : 'Inactive'} />);
      },
    },
    {
      field: 'agent_last_seen',
      label: 'Last Seen',
      isSortable: false,
      value: (agent: AgentOutput) => fldt(agent.agent_last_seen),
    },
  ];

  return (
    <List>
      <ListItem
        classes={{ root: classes.itemHead }}
        style={{ paddingTop: 0 }}
      >
        <ListItemIcon />
        <ListItemText
          primary={(
            <div>
              <div className={classes.bodyItems}>
                {headers.map(header => (
                  <div
                    key={header.field}
                    className={classes.bodyItem}
                    style={inlineStyles[header.field]}
                  >
                    {t(header.label)}
                  </div>
                ))}
              </div>
            </div>
          )}
        />
      </ListItem>
      <ListItem
        classes={{ root: classes.itemHead }}
        style={{ paddingTop: 0 }}
      >
      </ListItem>
      {agents.map((agent: AgentOutput) => {
        return (
          <ListItem
            key={agent.agent_id}
            classes={{ root: classes.item }}
            divider
          >
            <ListItemIcon>
              <DevicesOtherOutlined color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={(
                <div className={classes.bodyItems}>
                  {headers.map(header => (
                    <div
                      key={header.field}
                      className={classes.bodyItem}
                      style={inlineStyles[header.field]}
                    >
                      {header.value(agent)}
                    </div>
                  ))}
                </div>
              )}
            />
          </ListItem>
        );
      })}
    </List>
  );
};

export default AgentList;
