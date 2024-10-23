import { makeStyles } from '@mui/styles';
import React, { CSSProperties, useMemo, useState } from 'react';
import { Box, Chip, Drawer as MuiDrawer, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText } from '@mui/material';
import { SelectGroup } from 'mdi-material-ui';
import { useSearchParams } from 'react-router-dom';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import type { TagHelper, UserHelper } from '../../../../actions/helper';
import type { AssetGroupStore } from './AssetGroup';
import ItemTags from '../../../../components/ItemTags';
import AssetGroupPopover from './AssetGroupPopover';
import AssetGroupCreation from './AssetGroupCreation';
import { searchAssetGroups } from '../../../../actions/asset_groups/assetgroup-action';
import AssetGroupManagement from './AssetGroupManagement';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import type { EndpointHelper } from '../../../../actions/assets/asset-helper';
import type { AssetGroupOutput } from '../../../../utils/api-types';
import { initSorting } from '../../../../components/common/queryable/Page';
import { useAppDispatch } from '../../../../utils/hooks';
import { fetchTags } from '../../../../actions/Tag';
import useDataLoader from '../../../../utils/hooks/useDataLoader';
import { buildSearchPagination } from '../../../../components/common/queryable/QueryableUtils';
import PaginationComponentV2 from '../../../../components/common/queryable/pagination/PaginationComponentV2';
import ExportButton from '../../../../components/common/ExportButton';
import { useQueryableWithLocalStorage } from '../../../../components/common/queryable/useQueryableWithLocalStorage';
import SortHeadersComponentV2 from '../../../../components/common/queryable/sort/SortHeadersComponentV2';
import { Header } from '../../../../components/common/SortHeadersList';
import ClickableModeChip from '../../../../components/common/chips/ClickableModeChip';
import FilterChipValues from '../../../../components/common/queryable/filter/FilterChipValues';

const useStyles = makeStyles(() => ({
  itemHead: {
    textTransform: 'uppercase',
  },
  item: {
    height: 50,
  },
  bodyItems: {
    display: 'flex',
  },
  bodyItem: {
    height: 24,
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 10,
    boxSizing: 'content-box',
  },
  drawerPaper: {
    minHeight: '100vh',
    width: '50%',
    padding: 0,
  },
}));

const inlineStyles: Record<string, CSSProperties> = {
  asset_group_name: {
    width: '20%',
  },
  asset_group_description: {
    width: '20%',
  },
  asset_group_assets: {
    width: '35%',
    cursor: 'default',
  },
  asset_group_tags: {
    width: '25%',
  },
};

const computeRuleValues = (assetGroup: AssetGroupOutput, t: (value: string) => string) => {
  const computeDynamic = () => {
    if (assetGroup.asset_group_dynamic_filter?.filters && assetGroup.asset_group_dynamic_filter?.filters.length > 0) {
      return (
        <>
          {assetGroup.asset_group_dynamic_filter.filters.map((filter, idx) => (
            <React.Fragment key={filter.key}>
              {idx !== 0 && <ClickableModeChip mode={assetGroup.asset_group_dynamic_filter?.mode} />}
              <Chip
                key={filter.key}
                variant={'filled'}
                size="small"
                sx={{ borderRadius: 1 }}
                label={<FilterChipValues filter={filter} />}
              />
            </React.Fragment>))}
        </>
      );
    }
    return (<></>);
  };

  const computeStatic = () => {
    if (assetGroup.asset_group_assets && assetGroup.asset_group_assets?.length > 0) {
      return (
        <div style={{ alignContent: 'center' }}>{assetGroup.asset_group_assets?.length} {t('managed assets')}</div>
      );
    }
    return (<></>);
  };

  const andWord = () => {
    if (assetGroup.asset_group_dynamic_filter?.filters && assetGroup.asset_group_dynamic_filter?.filters.length > 0
      && assetGroup.asset_group_assets && assetGroup.asset_group_assets?.length > 0) {
      return (<div style={{ alignContent: 'center' }}>{t('and')}</div>);
    }
    return (<></>);
  };

  return (
    <Box
      sx={{
        padding: '0px 4px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      {computeDynamic()}
      {andWord()}
      {computeStatic()}
    </Box>
  );
};

const AssetGroups = () => {
  // Standard hooks
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const { t } = useFormatter();

  const [selectedAssetGroupId, setSelectedAssetGroupId] = useState<AssetGroupStore['asset_group_id'] | undefined>(undefined);

  // Query param
  const [searchParams] = useSearchParams();
  const [search] = searchParams.getAll('search');
  const [searchId] = searchParams.getAll('id');

  // Fetching data
  const { userAdmin } = useHelper((helper: EndpointHelper & UserHelper & TagHelper) => ({
    userAdmin: helper.getMe()?.user_admin ?? false,
  }));

  useDataLoader(() => {
    dispatch(fetchTags());
  });

  // Headers
  const headers: Header[] = useMemo(() => [
    {
      field: 'asset_group_name',
      label: 'Name',
      isSortable: true,
      value: (assetGroup: AssetGroupOutput) => assetGroup.asset_group_name,
    },
    {
      field: 'asset_group_description',
      label: 'Description',
      isSortable: true,
      value: (assetGroup: AssetGroupOutput) => assetGroup.asset_group_description || '-',
    },
    {
      field: 'asset_group_assets',
      label: 'Rules',
      isSortable: true,
      value: (assetGroup: AssetGroupOutput) => {
        return computeRuleValues(assetGroup, t);
      },
    },
    {
      field: 'asset_group_tags',
      label: 'Tags',
      isSortable: true,
      value: (assetGroup: AssetGroupOutput) => <ItemTags variant="list" tags={assetGroup.asset_group_tags} />,
    },
  ], []);

  const availableFilterNames = [
    'asset_group_name',
    'asset_group_description',
    'asset_group_tags',
  ];

  const [assetGroups, setAssetGroups] = useState<AssetGroupStore[]>([]);
  const { queryableHelpers, searchPaginationInput } = useQueryableWithLocalStorage('asset-groups', buildSearchPagination({
    sorts: initSorting('asset_group_name'),
    textSearch: search,
  }));

  // Export
  const exportProps = {
    exportType: 'asset_group',
    exportKeys: [
      'asset_group_name',
      'asset_group_description',
      'asset_group_tags',
    ],
    exportData: assetGroups,
    exportFileName: `${t('AssetGroups')}.csv`,
  };

  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Assets') }, { label: t('Asset groups'), current: true }]} />
      <PaginationComponentV2
        fetch={searchAssetGroups}
        searchPaginationInput={searchPaginationInput}
        setContent={setAssetGroups}
        entityPrefix="asset_group"
        availableFilterNames={availableFilterNames}
        queryableHelpers={queryableHelpers}
        topBarButtons={
          <ExportButton totalElements={queryableHelpers.paginationHelpers.getTotalElements()} exportProps={exportProps} />
        }
      />
      <List>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
          secondaryAction={<>&nbsp;</>}
        >
          <ListItemIcon />
          <ListItemText
            primary={
              <SortHeadersComponentV2
                headers={headers}
                inlineStylesHeaders={inlineStyles}
                sortHelpers={queryableHelpers.sortHelpers}
              />
            }
          />
        </ListItem>
        {assetGroups.map((assetGroup: AssetGroupOutput) => (
          <ListItem
            key={assetGroup.asset_group_id}
            classes={{ root: classes.item }}
            divider
            button
            onClick={() => setSelectedAssetGroupId(assetGroup.asset_group_id)}
          >
            <ListItemIcon>
              <SelectGroup color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <div className={classes.bodyItems}>
                  {headers.map((header) => (
                    <div
                      key={header.field}
                      className={classes.bodyItem}
                      style={inlineStyles[header.field]}
                    >
                      {header.value?.(assetGroup)}
                    </div>
                  ))}
                </div>
              }
            />
            <ListItemSecondaryAction>
              <AssetGroupPopover
                assetGroup={assetGroup}
                onUpdate={(result) => setAssetGroups(assetGroups.map((ag) => (ag.asset_group_id !== result.asset_group_id ? ag : result)))}
                onDelete={(result) => setAssetGroups(assetGroups.filter((ag) => (ag.asset_group_id !== result)))}
                onRemoveEndpointFromAssetGroup={(assetId) => setAssetGroups(assetGroups.map((ag) => (ag.asset_group_id !== assetGroup.asset_group_id ? ag : {
                  ...ag,
                  asset_group_assets: ag?.asset_group_assets?.toSpliced(ag?.asset_group_assets?.indexOf(assetId), 1),
                })))}
                openEditOnInit={assetGroup.asset_group_id === searchId}
              />
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      {userAdmin && <AssetGroupCreation onCreate={(result) => setAssetGroups([result, ...assetGroups])} />}
      <MuiDrawer
        open={selectedAssetGroupId !== undefined}
        keepMounted={false}
        anchor="right"
        sx={{ zIndex: 1202 }}
        classes={{ paper: classes.drawerPaper }}
        onClose={() => setSelectedAssetGroupId(undefined)}
        elevation={1}
      >
        {selectedAssetGroupId !== undefined && (
          <AssetGroupManagement
            assetGroupId={selectedAssetGroupId}
            handleClose={() => setSelectedAssetGroupId(undefined)}
            onUpdate={(result) => setAssetGroups(assetGroups.map((ag) => (ag.asset_group_id !== result.asset_group_id ? ag : result)))}
            onRemoveEndpointFromAssetGroup={(assetId) => setAssetGroups(assetGroups.map((ag) => (ag.asset_group_id !== selectedAssetGroupId ? ag : {
              ...ag,
              asset_group_assets: ag?.asset_group_assets?.toSpliced(ag?.asset_group_assets?.indexOf(assetId), 1),
            })))}
          />
        )}
      </MuiDrawer>
    </>
  );
};

export default AssetGroups;
