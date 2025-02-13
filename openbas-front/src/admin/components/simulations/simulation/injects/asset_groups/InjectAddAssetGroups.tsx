import { ControlPointOutlined } from '@mui/icons-material';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { type FunctionComponent, useContext, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { useFormatter } from '../../../../../../components/i18n';
import AssetGroupDialogAdding from '../../../../assets/asset_groups/AssetGroupDialogAdding';
import { PermissionsContext } from '../../../../common/Context';

const useStyles = makeStyles()(theme => ({
  item: {
    paddingLeft: 10,
    height: 50,
  },
  text: {
    fontSize: theme.typography.h2.fontSize,
    color: theme.palette.primary.main,
    fontWeight: theme.typography.h2.fontWeight,
  },
}));

interface Props {
  assetGroupIds: string[];
  onSubmit: (assetGroupIds: string[]) => void;
}

const InjectAddAssetGroups: FunctionComponent<Props> = ({
  assetGroupIds,
  onSubmit,
}) => {
  // Standard hooks
  const { classes } = useStyles();
  const { t } = useFormatter();
  const { permissions } = useContext(PermissionsContext);

  // Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const handleOpen = () => setOpenDialog(true);
  const handleClose = () => setOpenDialog(false);

  return (
    <>
      <ListItemButton
        classes={{ root: classes.item }}
        divider={true}
        onClick={handleOpen}
        color="primary"
        disabled={permissions.readOnly}
      >
        <ListItemIcon color="primary">
          <ControlPointOutlined color="primary" />
        </ListItemIcon>
        <ListItemText
          primary={t('Modify target asset groups')}
          classes={{ primary: classes.text }}
        />
      </ListItemButton>
      <AssetGroupDialogAdding
        initialState={assetGroupIds}
        open={openDialog}
        onClose={handleClose}
        onSubmit={onSubmit}
      />
    </>
  );
};

export default InjectAddAssetGroups;
