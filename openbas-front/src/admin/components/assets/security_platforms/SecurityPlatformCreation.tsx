import { ControlPointOutlined } from '@mui/icons-material';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { type FunctionComponent, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { addSecurityPlatform } from '../../../../actions/assets/securityPlatform-actions';
import ButtonCreate from '../../../../components/common/ButtonCreate';
import Dialog from '../../../../components/common/Dialog';
import Drawer from '../../../../components/common/Drawer';
import { useFormatter } from '../../../../components/i18n';
import { type SecurityPlatform, type SecurityPlatformInput } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import SecurityPlatformForm from './SecurityPlatformForm';

const useStyles = makeStyles()(theme => ({
  text: {
    fontSize: theme.typography.h2.fontSize,
    color: theme.palette.primary.main,
    fontWeight: theme.typography.h2.fontWeight,
  },
}));

interface Props {
  inline?: boolean;
  onCreate?: (result: SecurityPlatform) => void;
}

const SecurityPlatformCreation: FunctionComponent<Props> = ({
  inline,
  onCreate,
}) => {
  // Standard hooks
  const { classes } = useStyles();
  const [open, setOpen] = useState(false);
  const { t } = useFormatter();

  const dispatch = useAppDispatch();
  const onSubmit = (data: SecurityPlatformInput) => {
    dispatch(addSecurityPlatform(data)).then(
      (result: { result: string; entities: { securityplatforms: Record<string, SecurityPlatform> } }) => {
        if (result.entities) {
          if (onCreate) {
            const securityPlatformCreated = result.entities.securityplatforms[result.result];
            onCreate(securityPlatformCreated);
          }
          setOpen(false);
        }
        return result;
      },
    );
  };

  return (
    <>
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
            primary={t('Create a new security platform')}
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
          title={t('Create a new security platform')}
        >
          <SecurityPlatformForm
            onSubmit={onSubmit}
            handleClose={() => setOpen(false)}
          />
        </Dialog>
      ) : (
        <Drawer
          open={open}
          handleClose={() => setOpen(false)}
          title={t('Create a new security platform')}
        >
          <SecurityPlatformForm
            onSubmit={onSubmit}
            handleClose={() => setOpen(false)}
          />
        </Drawer>
      )}
    </>
  );
};

export default SecurityPlatformCreation;
