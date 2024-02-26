import React, { FunctionComponent, useContext, useState } from 'react';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { ControlPointOutlined } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { useFormatter } from '../../../../../components/i18n';
import type { Theme } from '../../../../../components/Theme';
import EndpointsDialogAdding from '../../../assets/endpoints/EndpointsDialogAdding';
import type { EndpointStore } from '../../../assets/endpoints/Endpoint';
import { PermissionsContext } from '../../../components/Context';

const useStyles = makeStyles((theme: Theme) => ({
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
  endpointIds: string[];
  onSubmit: (endpointIds: string[]) => void;
  filter: (endpoint: EndpointStore) => boolean;
}

const InjectAddEndpoints: FunctionComponent<Props> = ({
  endpointIds,
  onSubmit,
  filter,
}) => {
  // Standard hooks
  const classes = useStyles();
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
          primary={t('Add assets')}
          classes={{ primary: classes.text }}
        />
      </ListItemButton>
      <EndpointsDialogAdding initialState={endpointIds} open={openDialog}
        onClose={handleClose} onSubmit={onSubmit}
        title={t('Add assets in this inject')}
        filter={filter}
      />
    </>
  );
};

export default InjectAddEndpoints;
