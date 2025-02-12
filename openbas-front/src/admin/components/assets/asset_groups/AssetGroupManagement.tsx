import { CloseRounded } from '@mui/icons-material';
import { IconButton, Typography } from '@mui/material';
import { FunctionComponent } from 'react';
import { makeStyles } from 'tss-react/mui';

import { fetchAssetGroup } from '../../../../actions/asset_groups/assetgroup-action';
import type { AssetGroupsHelper } from '../../../../actions/asset_groups/assetgroup-helper';
import type { EndpointHelper } from '../../../../actions/assets/asset-helper';
import { fetchEndpoints } from '../../../../actions/assets/endpoint-actions';
import type { UserHelper } from '../../../../actions/helper';
import SearchFilter from '../../../../components/SearchFilter';
import { useHelper } from '../../../../store';
import type { AssetGroup, Endpoint } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import useDataLoader from '../../../../utils/hooks/useDataLoader';
import useSearchAnFilter from '../../../../utils/SortingFiltering';
import TagsFilter from '../../common/filters/TagsFilter';
import EndpointPopover from '../endpoints/EndpointPopover';
import EndpointsList, { EndpointStoreWithType } from '../endpoints/EndpointsList';
import AssetGroupAddEndpoints from './AssetGroupAddEndpoints';

const useStyles = makeStyles()(theme => ({
  // Drawer Header
  header: {
    backgroundColor: theme.palette.background.nav,
    padding: '20px 20px 20px 60px',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 5,
    color: 'inherit',
  },
  title: {
    float: 'left',
    marginRight: 20,
  },
  parameters: {
    float: 'right',
    marginTop: -8,
  },
  tags: {
    float: 'right',
  },
  search: {
    float: 'right',
    width: 200,
    marginRight: 20,
  },
}));

interface Props {
  assetGroupId: string;
  handleClose: () => void;
  onUpdate?: (result: AssetGroup) => void;
  onRemoveEndpointFromAssetGroup?: (assetId: Endpoint['asset_id']) => void;
}

const AssetGroupManagement: FunctionComponent<Props> = ({
  assetGroupId,
  handleClose,
  onUpdate,
  onRemoveEndpointFromAssetGroup,
}) => {
  // Standard hooks
  const { classes } = useStyles();
  const dispatch = useAppDispatch();

  // Fetching data
  const { assetGroup, endpointsMap, userAdmin } = useHelper((helper: AssetGroupsHelper & EndpointHelper & UserHelper) => ({
    assetGroup: helper.getAssetGroup(assetGroupId),
    endpointsMap: helper.getEndpointsMap(),
    userAdmin: helper.getMe()?.user_admin ?? false,
  }));
  useDataLoader(() => {
    dispatch(fetchAssetGroup(assetGroupId));
    dispatch(fetchEndpoints());
  });

  // Assets

  const getAssetFromMap = (assets: string[]) => assets?.filter((endpointId: string) => !!endpointsMap[endpointId]).map((endpointId: string) => endpointsMap[endpointId]);

  const filteringAssets = useSearchAnFilter('asset', 'name', ['name']);
  const assets = getAssetFromMap(assetGroup?.asset_group_assets ?? [])?.map(a => ({ ...a, type: 'static' }))
    .concat(getAssetFromMap(assetGroup?.asset_group_dynamic_assets ?? [])?.map(a => ({ ...a, type: 'dynamic' })));
  const sortedAsset: EndpointStoreWithType[] = filteringAssets.filterAndSort(assets);

  return (
    <>
      <div className={classes.header}>
        <IconButton
          aria-label="Close"
          className={classes.closeButton}
          onClick={handleClose}
          size="large"
          color="primary"
        >
          <CloseRounded fontSize="small" color="primary" />
        </IconButton>
        <Typography variant="h6" classes={{ root: classes.title }}>
          {assetGroup?.asset_group_name}
        </Typography>
        <div className={classes.parameters}>
          <div className={classes.tags}>
            <TagsFilter
              onAddTag={filteringAssets.handleAddTag}
              onRemoveTag={filteringAssets.handleRemoveTag}
              currentTags={filteringAssets.tags}
              thin
            />
          </div>
          <div className={classes.search}>
            <SearchFilter
              fullWidth
              onChange={filteringAssets.handleSearch}
              keyword={filteringAssets.keyword}
            />
          </div>
        </div>
        <div className="clearfix" />
      </div>
      <EndpointsList
        endpoints={sortedAsset}
        actions={userAdmin
          ? (
              // @ts-expect-error: Endpoint property handle by EndpointsList
              <EndpointPopover
                inline
                assetGroupId={assetGroup?.asset_group_id}
                assetGroupEndpointIds={assetGroup?.asset_group_assets ?? []}
                onRemoveEndpointFromAssetGroup={onRemoveEndpointFromAssetGroup}
              />
            )
          : <span> &nbsp; </span>}
      />
      {userAdmin
      && (
        <AssetGroupAddEndpoints
          assetGroupId={assetGroup?.asset_group_id}
          assetGroupEndpointIds={assetGroup?.asset_group_assets ?? []}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default AssetGroupManagement;
