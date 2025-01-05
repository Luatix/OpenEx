import { DevicesOtherOutlined } from '@mui/icons-material';
import { DialogContent, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { CSSProperties, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { searchEndpoints } from '../../../../actions/assets/endpoint-actions';
import { fetchExecutors } from '../../../../actions/Executor';
import type { ExecutorHelper } from '../../../../actions/executors/executor-helper';
import type { UserHelper } from '../../../../actions/helper';
import { fetchTags } from '../../../../actions/Tag';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import ButtonCreate from '../../../../components/common/ButtonCreate';
import Dialog from '../../../../components/common/Dialog';
import ExportButton from '../../../../components/common/ExportButton';
import { initSorting } from '../../../../components/common/queryable/Page';
import PaginationComponentV2 from '../../../../components/common/queryable/pagination/PaginationComponentV2';
import { buildSearchPagination } from '../../../../components/common/queryable/QueryableUtils';
import { useQueryableWithLocalStorage } from '../../../../components/common/queryable/useQueryableWithLocalStorage';
import { useFormatter } from '../../../../components/i18n';
import ItemTags from '../../../../components/ItemTags';
import PlatformIcon from '../../../../components/PlatformIcon';
import { useHelper } from '../../../../store';
import type { EndpointOutput, ExecutorOutput } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import useAuth from '../../../../utils/hooks/useAuth';
import useDataLoader from '../../../../utils/hooks/useDataLoader';
import AssetStatus from '../AssetStatus';
import AgentPrivilege from './AgentPrivilege';
import EndpointPopover from './EndpointPopover';

const useStyles = makeStyles(() => ({
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
    width: '15%',
  },
  endpoint_agents_privilege: {
    width: '10%',
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
    width: '10%',
    display: 'flex',
    alignItems: 'center',
  },
  asset_tags: {
    width: '15%',
  },
};

const Endpoints = () => {
  // Standard hooks
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const { t } = useFormatter();
  const { settings } = useAuth();

  // Dialog
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);

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

  // Headers
  const headers = [
    { field: 'asset_name', label: 'Name', isSortable: true },
    { field: 'endpoint_active', label: 'Status', isSortable: false },
    { field: 'endpoint_agents_privilege', label: 'Agents Privilege', isSortable: false },
    { field: 'endpoint_platform', label: 'Platform', isSortable: true },
    { field: 'endpoint_arch', label: 'Architecture', isSortable: true },
    { field: 'endpoint_agents_executor', label: 'Executor', isSortable: false },
    { field: 'asset_tags', label: 'Tags', isSortable: false },
  ];

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

  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Assets') }, { label: t('Endpoints'), current: true }]} />
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
              <div>
                <div className={classes.bodyItems}>
                  {headers.map(header => (
                    <div
                      key={header.field}
                      className={classes.bodyItem}
                      style={inlineStyles[header.field]}
                    >
                      {header.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          />
        </ListItem>
        {endpoints.map((endpoint: EndpointOutput) => {
          const privileges = endpoint.asset_agents.map(agent => agent.agent_privilege);
          const executors = endpoint.asset_agents.map(agent => agent.agent_executor);

          const activeCount = endpoint.asset_agents.filter(agent => agent.agent_active).length;
          const inactiveCount = endpoint.asset_agents.length - activeCount;
          const isActive = activeCount > 0;

          const activeMsgTooltip = 'Active : ' + activeCount + ' / Inactive : ' + inactiveCount;
          const privilegeMsgTooltip = 'Active : ' + activeCount + ' / Inactive : ' + inactiveCount;
          const executorMsgTooltip = 'Active : ' + activeCount + ' / Inactive : ' + inactiveCount;

          return (
            <ListItem
              key={endpoint.asset_id}
              classes={{ root: classes.item }}
              divider
              secondaryAction={
                (userAdmin
                  && (
                    <EndpointPopover
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
                      <div className={classes.bodyItem} style={inlineStyles.asset_name}>
                        {endpoint.asset_name}
                      </div>
                      <div className={classes.bodyItem} style={inlineStyles.endpoint_active}>
                        <Tooltip title={activeMsgTooltip}>
                          <span>
                            {' '}
                            {/* Using <span> to wrap the element */}
                            <AssetStatus variant="list" status={isActive ? 'Active' : 'Inactive'} />
                          </span>
                        </Tooltip>
                      </div>
                      <div className={classes.bodyItem} style={inlineStyles.endpoint_agents_privilege}>
                        {privileges?.map((privilege) => {
                          return (<AgentPrivilege variant="list" status={privilege ?? 'admin'} />);
                        })}
                      </div>
                      <div className={classes.bodyItem} style={inlineStyles.endpoint_platform}>
                        <PlatformIcon platform={endpoint.endpoint_platform ?? 'Unknown'} width={20} marginRight={10} />
                        {' '}
                        {endpoint.endpoint_platform}
                      </div>
                      <div className={classes.bodyItem} style={inlineStyles.endpoint_arch}>
                        {endpoint.endpoint_arch}
                      </div>
                      <div className={classes.bodyItem} style={inlineStyles.endpoint_agents_executor}>
                        {executors?.filter(executor => executor !== undefined).map((executor: ExecutorOutput) => {
                          const type = executor?.executor_id ? executorsMap[executor.executor_id]?.executor_type : 'Unknown';
                          return (
                            <img
                              key={executor?.executor_id ?? 'unknown'}
                              src={`/api/images/executors/${type}`}
                              alt={type}
                              style={{ width: 25, height: 25, borderRadius: 4, marginRight: 10 }}
                            />
                          );
                        })}
                      </div>
                      <div className={classes.bodyItem} style={inlineStyles.asset_tags}>
                        <ItemTags variant="list" tags={endpoint.asset_tags} />
                      </div>
                    </div>
                  )}
                />
              </ListItemButton>
            </ListItem>
          )
          ;
        })}
      </List>
      {userAdmin && <ButtonCreate onClick={() => setOpen(true)} />}
      <Dialog
        open={open}
        handleClose={onClose}
        title={t('How Are Endpoints Added?')}
      >
        <DialogContent>
          <span>
            {t('Your assets will be automatically created by the installation of your agent. ')}
          </span>
          <p>
            {t('In order to do so, go to this page ')}
            <a href={`${settings.platform_base_url}/admin/agents`} target="_blank" rel="noopener noreferrer">
              {`${settings.platform_base_url}/admin/agents`}
            </a>
            {t(' to install the agent of your choice with its corresponding assets.')}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Endpoints;
