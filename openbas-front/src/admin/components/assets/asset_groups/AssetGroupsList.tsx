import { List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText } from '@mui/material';
import { SelectGroup } from 'mdi-material-ui';
import { cloneElement, CSSProperties, FunctionComponent, ReactElement, useEffect, useMemo, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { findAssetGroups } from '../../../../actions/asset_groups/assetgroup-action';
import ListLoader from '../../../../components/common/loader/ListLoader';
import { Header } from '../../../../components/common/SortHeadersList';
import ItemTags from '../../../../components/ItemTags';
import type { AssetGroupOutput } from '../../../../utils/api-types';
import { AssetGroupPopoverProps } from './AssetGroupPopover';

const useStyles = makeStyles()(() => ({
  item: {
    height: 50,
  },
  bodyItem: {
    fontSize: 13,
    float: 'left',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));

const inlineStyles: Record<string, CSSProperties> = {
  asset_group_name: {
    width: '50%',
  },
  asset_group_tags: {
    width: '50%',
  },
};

interface Props {
  assetGroupIds: string[];
  actions: ReactElement<AssetGroupPopoverProps>;
}

const AssetGroupsList: FunctionComponent<Props> = ({
  assetGroupIds = [],
  actions,
}) => {
  // Standard hooks
  const { classes } = useStyles();

  const component = (assetGroup: AssetGroupOutput) => {
    return cloneElement(actions, { assetGroup });
  };

  const [loading, setLoading] = useState<boolean>(true);
  const [assetGroupValues, setAssetGroupValues] = useState<AssetGroupOutput[]>([]);
  useEffect(() => {
    setLoading(true);
    findAssetGroups(assetGroupIds).then((result) => {
      setAssetGroupValues(result.data);
      setLoading(false);
    });
  }, [assetGroupIds]);

  // Headers
  const headers: Header[] = useMemo(() => [
    {
      field: 'asset_group_name',
      label: 'Asset Group Name',
      isSortable: false,
      value: (assetGroup: AssetGroupOutput) => assetGroup.asset_group_name,
    },
    {
      field: 'asset_group_tags',
      label: 'tags',
      isSortable: false,
      value: (assetGroup: AssetGroupOutput) => <ItemTags variant="reduced-view" tags={assetGroup.asset_group_tags} />,
    },
  ], []);

  const isLoading = loading && assetGroupIds.length > 0;

  return (
    <>
      {
        isLoading
          ? <ListLoader Icon={SelectGroup} headers={[]} headerStyles={inlineStyles} />
          : (
              <List>
                {assetGroupValues?.map((assetGroup) => {
                  return (
                    <ListItem
                      key={assetGroup.asset_group_id}
                      classes={{ root: classes.item }}
                      divider
                    >
                      <ListItemIcon>
                        <SelectGroup color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={(
                          <>
                            {headers.map(header => (
                              <div
                                key={header.field}
                                className={classes.bodyItem}
                                style={inlineStyles[header.field]}
                              >
                                {header.value?.(assetGroup)}
                              </div>
                            ))}
                          </>
                        )}
                      />
                      <ListItemSecondaryAction>
                        {component(assetGroup)}
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            )
      }
    </>
  );
};

export default AssetGroupsList;
