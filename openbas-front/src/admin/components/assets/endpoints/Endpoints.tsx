import { DevicesOtherOutlined } from '@mui/icons-material';
import { DialogContent, List, ListItem, ListItemButton, ListItemIcon, ListItemSecondaryAction, ListItemText } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { CSSProperties, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { searchEndpoints } from '../../../../actions/assets/endpoint-actions';
import { fetchExecutors } from '../../../../actions/Executor';
import type { ExecutorHelper } from '../../../../actions/executors/executor-helper';
import type { TagHelper, UserHelper } from '../../../../actions/helper';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import ButtonCreate from '../../../../components/common/ButtonCreate';
import Dialog from '../../../../components/common/Dialog';
import PaginationComponent from '../../../../components/common/pagination/PaginationComponent';
import SortHeadersComponent from '../../../../components/common/pagination/SortHeadersComponent';
import { initSorting } from '../../../../components/common/queryable/Page';
import { buildSearchPagination } from '../../../../components/common/queryable/QueryableUtils';
import { useFormatter } from '../../../../components/i18n';
import ItemTags from '../../../../components/ItemTags';
import PlatformIcon from '../../../../components/PlatformIcon';
import { useHelper } from '../../../../store';
import type { Endpoint, SearchPaginationInput } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import useAuth from '../../../../utils/hooks/useAuth';
import useDataLoader from '../../../../utils/hooks/useDataLoader';
import AssetStatus from '../AssetStatus';
import EndpointPopover from './EndpointPopover';

const useStyles = makeStyles(() => ({
  itemHead: {
    paddingLeft: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
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
  asset_name: {
    width: '30%',
  },
  endpoint_platform: {
    width: '15%',
    display: 'flex',
    alignItems: 'center',
  },
  endpoint_arch: {
    width: '10%',
    display: 'flex',
    alignItems: 'center',
  },
  asset_executor: {
    width: '15%',
    display: 'flex',
    alignItems: 'center',
    cursor: 'default',
  },
  asset_tags: {
    width: '20%',
  },
  asset_status: {
    width: '15%',
    cursor: 'default',
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
  const { userAdmin, executorsMap } = useHelper((helper: ExecutorHelper & UserHelper & TagHelper) => ({
    userAdmin: helper.getMe()?.user_admin ?? false,
    executorsMap: helper.getExecutorsMap(),
    tagsMap: helper.getTagsMap(),
  }));
  useDataLoader(() => {
    dispatch(fetchExecutors());
  });

  // Headers
  const headers = [
    { field: 'asset_name', label: 'Name', isSortable: true },
    { field: 'asset_status', label: 'Status', isSortable: false },
    { field: 'endpoint_platform', label: 'Platform', isSortable: true },
    { field: 'endpoint_arch', label: 'Architecture', isSortable: true },
    { field: 'asset_executor', label: 'Executor', isSortable: false },
    { field: 'asset_tags', label: 'Tags', isSortable: true },
  ];

  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [searchPaginationInput, setSearchPaginationInput] = useState<SearchPaginationInput>(buildSearchPagination({
    sorts: initSorting('asset_name'),
    textSearch: search,
  }));

  // Export
  const exportProps = {
    exportType: 'endpoint',
    exportKeys: [
      'asset_name',
      'asset_description',
      'asset_last_seen',
      'endpoint_ips',
      'endpoint_hostname',
      'endpoint_platform',
      'endpoint_mac_addresses',
      'asset_tags',
    ],
    exportData: endpoints,
    exportFileName: `${t('Endpoints')}.csv`,
  };

  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Assets') }, { label: t('Endpoints'), current: true }]} />
      <PaginationComponent
        fetch={searchEndpoints}
        searchPaginationInput={searchPaginationInput}
        setContent={setEndpoints}
        exportProps={exportProps}
      />
      <List>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
        >
          <ListItemIcon />
          <ListItemText
            primary={(
              <SortHeadersComponent
                headers={headers}
                inlineStylesHeaders={inlineStyles}
                searchPaginationInput={searchPaginationInput}
                setSearchPaginationInput={setSearchPaginationInput}
              />
            )}
          />
          <ListItemSecondaryAction />
        </ListItem>
        {endpoints.map((endpoint: Endpoint) => {
          const executor = executorsMap[endpoint.asset_executor ?? 'Unknown'];
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
                      <div className={classes.bodyItem} style={inlineStyles.asset_status}>
                        <AssetStatus variant="list" status={endpoint.asset_active ? 'Active' : 'Inactive'} />
                      </div>
                      <div className={classes.bodyItem} style={inlineStyles.endpoint_platform}>
                        <PlatformIcon platform={endpoint.endpoint_platform} width={20} marginRight={10} />
                        {' '}
                        {endpoint.endpoint_platform}
                      </div>
                      <div className={classes.bodyItem} style={inlineStyles.endpoint_arch}>
                        {endpoint.endpoint_arch}
                      </div>
                      <div className={classes.bodyItem} style={inlineStyles.asset_executor}>
                        {executor && (
                          <img
                            src={`/api/images/executors/${executor.executor_type}`}
                            alt={executor.executor_type}
                            style={{ width: 25, height: 25, borderRadius: 4, marginRight: 10 }}
                          />
                        )}
                        {executor?.executor_name ?? t('Unknown')}
                      </div>
                      <div className={classes.bodyItem} style={inlineStyles.asset_tags}>
                        <ItemTags variant="list" tags={endpoint.asset_tags} />
                      </div>
                    </div>
                  )}
                />
              </ListItemButton>
            </ListItem>
          );
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
