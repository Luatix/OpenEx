import { ControlPointOutlined } from '@mui/icons-material';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { type FunctionComponent, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { addAssetGroup } from '../../../../actions/asset_groups/assetgroup-action';
import ButtonCreate from '../../../../components/common/ButtonCreate';
import Dialog from '../../../../components/common/Dialog';
import Drawer from '../../../../components/common/Drawer';
import { useFormatter } from '../../../../components/i18n';
import { type AssetGroup, type AssetGroupInput } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import { type UserStore } from '../../teams/players/Player';
import AssetGroupForm from './AssetGroupForm';

const useStyles = makeStyles()(theme => ({
  text: {
    fontSize: theme.typography.h2.fontSize,
    color: theme.palette.primary.main,
    fontWeight: theme.typography.h2.fontWeight,
  },
}));

interface Props {
  inline?: boolean;
  onCreate?: (result: AssetGroup) => void;
}

const AssetGroupCreation: FunctionComponent<Props> = ({
  inline,
  onCreate,
}) => {
  // Standard hooks
  const { classes } = useStyles();
  const [open, setOpen] = useState(false);
  const { t } = useFormatter();

  const dispatch = useAppDispatch();
  const onSubmit = (data: AssetGroupInput) => {
    dispatch(addAssetGroup(data)).then(
      (result: { result: string; entities: { asset_groups: Record<string, UserStore> } }) => {
        if (result.result) {
          if (onCreate) {
            const created = result.entities.asset_groups[result.result];
            onCreate(created);
          }
          setOpen(false);
        }
        return result;
      },
    );
  };

  return (
    <div>
      {inline ? (
        <ListItemButton
          divider
          onClick={() => setOpen(true)}
          color="primary"
        >
          <ListItemIcon color="primary">
            <ControlPointOutlined color="primary" />
          </ListItemIcon>
          <ListItemText
            primary={t('Create a new asset group')}
            classes={{ primary: classes.text }}
          />
        </ListItemButton>
      ) : (
        <ButtonCreate onClick={() => setOpen(true)} />
      )}

      {inline ? (
        <Dialog
          open={open}
          handleClose={() => setOpen(false)}
          title={t('Create a new asset group')}
        >
          <AssetGroupForm
            onSubmit={onSubmit}
            handleClose={() => setOpen(false)}
          />
        </Dialog>
      ) : (
        <Drawer
          open={open}
          handleClose={() => setOpen(false)}
          title={t('Create a new asset group')}
        >
          <AssetGroupForm
            onSubmit={onSubmit}
            handleClose={() => setOpen(false)}
          />
        </Drawer>
      )}
    </div>
  );
};

export default AssetGroupCreation;
