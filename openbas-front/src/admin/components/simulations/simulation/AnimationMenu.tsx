import { FactCheckOutlined, MailOutlined, NoteAltOutlined, TheatersOutlined } from '@mui/icons-material';
import { Drawer, ListItemIcon, ListItemText, MenuItem, MenuList } from '@mui/material';
import { makeStyles } from '@mui/styles';
import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useFormatter } from '../../../../components/i18n';
import type { Theme } from '../../../../components/Theme';
import type { Exercise } from '../../../../utils/api-types';

const useStyles = makeStyles<Theme>(theme => ({
  drawer: {
    minHeight: '100vh',
    width: 200,
    position: 'fixed',
    overflow: 'auto',
    padding: 0,
  },
  toolbar: theme.mixins.toolbar,
  item: {
    paddingTop: 10,
    paddingBottom: 10,
  },
}));

interface Props {
  exerciseId: Exercise['exercise_id'];
}

const AnimationMenu: React.FC<Props> = ({ exerciseId }) => {
  const location = useLocation();
  const classes = useStyles();
  const { t } = useFormatter();

  return (
    <Drawer
      variant="permanent"
      anchor="right"
      classes={{ paper: classes.drawer }}
    >
      <div className={classes.toolbar} />
      <MenuList component="nav">
        <MenuItem
          component={Link}
          to={`/admin/exercises/${exerciseId}/animation/timeline`}
          selected={
            location.pathname
            === `/admin/exercises/${exerciseId}/animation/timeline`
          }
          classes={{ root: classes.item }}
        >
          <ListItemIcon>
            <TheatersOutlined />
          </ListItemIcon>
          <ListItemText primary={t('Timeline')} />
        </MenuItem>
        <MenuItem
          component={Link}
          to={`/admin/exercises/${exerciseId}/animation/mails`}
          selected={location.pathname.includes(
            `/admin/exercises/${exerciseId}/animation/mails`,
          )}
          classes={{ root: classes.item }}
        >
          <ListItemIcon>
            <MailOutlined />
          </ListItemIcon>
          <ListItemText primary={t('Mails')} />
        </MenuItem>
        <MenuItem
          component={Link}
          to={`/admin/exercises/${exerciseId}/animation/validations`}
          selected={
            location.pathname
            === `/admin/exercises/${exerciseId}/animation/validations`
          }
          classes={{ root: classes.item }}
        >
          <ListItemIcon>
            <FactCheckOutlined />
          </ListItemIcon>
          <ListItemText primary={t('Validations')} />
        </MenuItem>
        <MenuItem
          component={Link}
          to={`/admin/exercises/${exerciseId}/animation/logs`}
          selected={
            location.pathname
            === `/admin/exercises/${exerciseId}/animation/logs`
          }
          classes={{ root: classes.item }}
        >
          <ListItemIcon>
            <NoteAltOutlined />
          </ListItemIcon>
          <ListItemText primary={t('Simulation logs')} />
        </MenuItem>
      </MenuList>
    </Drawer>
  );
};

export default AnimationMenu;
