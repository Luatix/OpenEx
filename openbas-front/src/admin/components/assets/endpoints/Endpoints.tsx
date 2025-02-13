import { DevicesOtherOutlined } from '@mui/icons-material';
import { Alert, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { type CSSProperties, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { searchEndpoints } from '../../../../actions/assets/endpoint-actions';
import { fetchExecutors } from '../../../../actions/Executor';
import { type ExecutorHelper } from '../../../../actions/executors/executor-helper';
import { type UserHelper } from '../../../../actions/helper';
import { fetchTags } from '../../../../actions/Tag';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import ExportButton from '../../../../components/common/ExportButton';
import { initSorting } from '../../../../components/common/queryable/Page';
import PaginationComponentV2 from '../../../../components/common/queryable/pagination/PaginationComponentV2';
import { buildSearchPagination } from '../../../../components/common/queryable/QueryableUtils';
import SortHeadersComponentV2 from '../../../../components/common/queryable/sort/SortHeadersComponentV2';
import { useQueryableWithLocalStorage } from '../../../../components/common/queryable/useQueryableWithLocalStorage';
import { useFormatter } from '../../../../components/i18n';
import ItemTags from '../../../../components/ItemTags';
import PlatformIcon from '../../../../components/PlatformIcon';
import { useHelper } from '../../../../store';
import { type EndpointOutput, type ExecutorOutput } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import useAuth from '../../../../utils/hooks/useAuth';
import useDataLoader from '../../../../utils/hooks/useDataLoader';
import AssetStatus from '../AssetStatus';
import AgentPrivilege from './AgentPrivilege';
import EndpointPopover from './EndpointPopover';

const useStyles = makeStyles()(() => ({
  itemHead: {
    textTransform: 'uppercase',
  },
  item: {
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
  asset_name: {
    width: '25%',
  },
  endpoint_active: {
    width: '10%',
  },
  endpoint_agents_privilege: {
    width: '12%',
  },
  endpoint_platform: {
    width: '10%',
    display: 'flex',
    alignItems: 'center',
  },
  endpoint_arch: {
    width: '10%',
  },
  endpoint_agents_executor: {
    width: '13%',
    display: 'flex',
    alignItems: 'center',
  },
  asset_tags: {
    width: '15%',
  },
};

const Endpoints = () => {
  // Standard hooks
  const { classes } = useStyles();
  const dispatch = useAppDispatch();
  const { t } = useFormatter();
  const { settings } = useAuth();

  // Query param
  const [searchParams] = useSearchParams();
  const [search] = searchParams.getAll('search');

  // Fetching data
  const { userAdmin, executorsMap } = useHelper((helper: ExecutorHelper & UserHelper) => ({
    userAdmin: helper.getMe()?.user_admin ?? false,
    executorsMap: helper.getExecutorsMap(),
  }));
  useDataLoader(() => {
    dispatch(fetchExecutors());
    dispatch(fetchTags());
  });

  const availableFilterNames = [
    'endpoint_platform',
    'endpoint_arch',
    'asset_tags',
  ];

  const [endpoints, setEndpoints] = useState<EndpointOutput[]>([]);
  const { queryableHelpers, searchPaginationInput } = useQueryableWithLocalStorage('asset', buildSearchPagination({
    sorts: initSorting('asset_name'),
    textSearch: search,
  }));

  // Export
  const exportProps = {
    exportType: 'endpoint',
    exportKeys: [
      'asset_name',
      'endpoint_platform',
      'endpoint_arch',
    ],
    exportData: endpoints,
    exportFileName: `${t('Endpoints')}.csv`,
  };

  const getActiveMsgTooltip = (endpoint: EndpointOutput) => {
    const activeCount = endpoint.asset_agents.filter(agent => agent.agent_active).length;
    const inactiveCount = endpoint.asset_agents.length - activeCount;
    const isActive = activeCount > 0;
    return { isActive: isActive, activeMsgTooltip: t('Active') + ' : ' + activeCount + ' | ' + t('Inactive') + ' : ' + inactiveCount };
  };

  const getPrivilegesCount = (endpoint: EndpointOutput) => {
    const privileges = endpoint.asset_agents.map(agent => agent.agent_privilege);
    const privilegeCount = privileges?.reduce((count, privilege) => {
      if (privilege === 'admin') {
        count.admin += 1;
      } else {
        count.user += 1;
      }
      return count;
    }, { admin: 0, user: 0 });

    return { adminCount: privilegeCount?.admin, userCount: privilegeCount?.user };
  };

  const getExecutorsCount = (endpoint: EndpointOutput) => {
    const executors = endpoint.asset_agents.map(agent => agent.agent_executor);
    return executors?.reduce((acc, executor) => {
      const type = executor?.executor_id ? executorsMap[executor.executor_id]?.executor_type : undefined;
      if (type && executor) {
        acc[type] = acc[type] || [];
        acc[type].push(executor);
      } else {
        acc['Unknown'] = acc['Unknown'] || [];
      }
      return acc;
    }, {} as Record<string, ExecutorOutput[]>);
  };

  // Headers
  const headers = [
    {
      field: 'asset_name',
      label: 'Name',
      isSortable: true,
      value: (endpoint: EndpointOutput) => endpoint.asset_name,
    },
    {
      field: 'endpoint_active',
      label: 'Status',
      isSortable: false,
      value: (endpoint: EndpointOutput) => {
        const status = getActiveMsgTooltip(endpoint);
        return (
          <Tooltip title={status.activeMsgTooltip}>
            <span>
              <AssetStatus variant="list" status={status.isActive ? 'Active' : 'Inactive'} />
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: 'endpoint_agents_privilege',
      label: 'Agents Privileges',
      isSortable: false,
      value: (endpoint: EndpointOutput) => {
        const privileges = getPrivilegesCount(endpoint);
        return (
          <>
            <Tooltip title={t('Admin') + `: ${privileges.adminCount}`} placement="top">
              <span>
                {privileges.adminCount > 0 && (<AgentPrivilege variant="list" privilege="admin" />)}
              </span>
            </Tooltip>
            <Tooltip title={t('User') + `: ${privileges.userCount}`} placement="top">
              <span>
                {privileges.userCount > 0 && (<AgentPrivilege variant="list" privilege="user" />)}
              </span>
            </Tooltip>
          </>
        );
      },
    },
    {
      field: 'endpoint_platform',
      label: 'Platform',
      isSortable: true,
      value: (endpoint: EndpointOutput) => {
        return (
          <>
            <PlatformIcon platform={endpoint.endpoint_platform ?? 'Unknown'} width={20} marginRight={10} />
            {endpoint.endpoint_platform}
          </>
        );
      },
    },
    {
      field: 'endpoint_arch',
      label: 'Architecture',
      isSortable: true,
      value: (endpoint: EndpointOutput) => endpoint.endpoint_arch,
    },
    {
      field: 'endpoint_agents_executor',
      label: 'Executors',
      isSortable: false,
      value: (endpoint: EndpointOutput) => {
        const groupedExecutors = getExecutorsCount(endpoint);
        return (
          <>
            {
              Object.keys(groupedExecutors).map((executorType) => {
                const executorsOfType = groupedExecutors[executorType];
                const count = executorsOfType.length;
                const base = executorsOfType[0];

                if (count > 0) {
                  return (
                    <Tooltip key={executorType} title={`${base.executor_name} : ${count}`} arrow>
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <img
                          src={`/api/images/executors/${executorType}`}
                          alt={executorType}
                          style={{ width: 25, height: 25, borderRadius: 4, marginRight: 10 }}
                        />
                      </div>
                    </Tooltip>
                  );
                } else {
                  return t('Unknown');
                }
              })
            }
          </>
        );
      },
    },
    {
      field: 'asset_tags',
      label: 'Tags',
      isSortable: false,
      value: (endpoint: EndpointOutput) => {
        return (<ItemTags variant="list" tags={endpoint.asset_tags} />);
      },
    },
  ];

  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Assets') }, { label: t('Endpoints'), current: true }]} />
      <Alert variant="outlined" severity="info" style={{ marginBottom: 30 }}>
        {t('To register new endpoints, you will need to install an agent. You can find detailed instructions on the ')}
        <a href={`${settings.platform_base_url}/admin/agents`} target="_blank" rel="noopener noreferrer">
          {t('agent installation page')}
        </a>
        {t(' and in our ')}
        <a href="https://docs.openbas.io" target="_blank" rel="noreferrer">
          {t('documentation')}
        </a>
        .
      </Alert>
      <PaginationComponentV2
        fetch={searchEndpoints}
        searchPaginationInput={searchPaginationInput}
        setContent={setEndpoints}
        entityPrefix="asset"
        availableFilterNames={availableFilterNames}
        queryableHelpers={queryableHelpers}
        topBarButtons={
          <ExportButton totalElements={queryableHelpers.paginationHelpers.getTotalElements()} exportProps={exportProps} />
        }
      />
      <List>
        <ListItem
          classes={{ root: classes.itemHead }}
          style={{ paddingTop: 0 }}
          secondaryAction={<>&nbsp;</>}
        >
          <ListItemIcon />
          <ListItemText
            primary={(
              <SortHeadersComponentV2
                headers={headers}
                inlineStylesHeaders={inlineStyles}
                sortHelpers={queryableHelpers.sortHelpers}
              />
            )}
          />
        </ListItem>
        {endpoints.map((endpoint: EndpointOutput) => {
          return (
            <ListItem
              key={endpoint.asset_id}
              classes={{ root: classes.item }}
              divider
              secondaryAction={
                (userAdmin
                  && (
                    <EndpointPopover
                      inline
                      endpoint={{ ...endpoint, type: 'static' }}
                      onDelete={result => setEndpoints(endpoints.filter(e => (e.asset_id !== result)))}
                    />
                  ))
              }
              disablePadding
            >
              <ListItemButton
                component={Link}
                to={`/admin/assets/endpoints/${endpoint.asset_id}`}
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
                          {header.value(endpoint)}
                        </div>
                      ))}
                    </div>
                  )}
                />
              </ListItemButton>
            </ListItem>
          )
          ;
        })}
      </List>
    </>
  );
};

export default Endpoints;
