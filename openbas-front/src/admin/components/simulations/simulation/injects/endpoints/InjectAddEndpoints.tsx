import { ControlPointOutlined } from '@mui/icons-material';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { type FunctionComponent, useContext, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { useFormatter } from '../../../../../../components/i18n';
import EndpointsDialogAdding from '../../../../assets/endpoints/EndpointsDialogAdding';
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
  disabled: boolean;
  endpointIds: string[];
  onSubmit: (endpointIds: string[]) => void;
  platforms?: string[];
  payloadArch?: string;
}

const InjectAddEndpoints: FunctionComponent<Props> = ({
  disabled,
  endpointIds,
  onSubmit,
  platforms,
  payloadArch,
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
        disabled={permissions.readOnly || disabled}
      >
        <ListItemIcon color="primary">
          <ControlPointOutlined color="primary" />
        </ListItemIcon>
        <ListItemText
          primary={t('Modify target assets')}
          classes={{ primary: classes.text }}
        />
      </ListItemButton>
      <EndpointsDialogAdding
        initialState={endpointIds}
        open={openDialog}
        platforms={platforms}
        payloadArch={payloadArch}
        onClose={handleClose}
        onSubmit={onSubmit}
        title={t('Modify assets in this inject')}
      />
    </>
  );
};

export default InjectAddEndpoints;
