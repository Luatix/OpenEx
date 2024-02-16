import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Drawer, MenuList, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { LockPattern } from 'mdi-material-ui';
import { StyleOutlined, RouteOutlined } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { useFormatter } from '../../../components/i18n';
import type { Theme } from '../../../components/Theme';

const useStyles = makeStyles((theme: Theme) => ({
  drawer: {
    minHeight: '100vh',
    width: 200,
    position: 'fixed',
    overflow: 'auto',
    padding: 0,
    backgroundColor: theme.palette.background.nav,
  },
  toolbar: theme.mixins.toolbar,
  item: {
    paddingTop: 10,
    paddingBottom: 10,
  },
}));

const DefinitionMenu: React.FC = () => {
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
          to='/admin/settings/taxonomies/tags'
          selected={location.pathname === '/admin/settings/taxonomies/tags'}
          classes={{ root: classes.item }}
          dense={true}
        >
          <ListItemIcon>
            <StyleOutlined />
          </ListItemIcon>
          <ListItemText primary={t('Tags')} />
        </MenuItem>
        <MenuItem
          component={Link}
          to='/admin/settings/taxonomies/attack_patterns'
          selected={location.pathname === '/admin/settings/taxonomies/attack_patterns'}
          classes={{ root: classes.item }}
          dense={true}
        >
          <ListItemIcon>
            <LockPattern />
          </ListItemIcon>
          <ListItemText primary={t('Attack patterns')} />
        </MenuItem>
        <MenuItem
          component={Link}
          to='/admin/settings/taxonomies/kill_chain_phases'
          selected={location.pathname === '/admin/settings/taxonomies/kill_chain_phases'}
          classes={{ root: classes.item }}
          dense={true}
        >
          <ListItemIcon>
            <RouteOutlined />
          </ListItemIcon>
          <ListItemText primary={t('Kill chain phases')} />
        </MenuItem>
      </MenuList>
    </Drawer>
  );
};

export default DefinitionMenu;
