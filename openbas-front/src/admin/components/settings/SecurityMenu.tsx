import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Drawer, ListItemIcon, ListItemText, MenuItem, MenuList } from '@mui/material';
import { GroupsOutlined, LocalPoliceOutlined, PermIdentityOutlined } from '@mui/icons-material';
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
      <div className={classes.toolbar}/>
      <MenuList component="nav">
        <MenuItem
          component={Link}
          to='/admin/settings/security/groups'
          selected={location.pathname === '/admin/settings/security/groups'}
          classes={{ root: classes.item }}
          dense={false}
        >
          <ListItemIcon>
            <GroupsOutlined fontSize="medium"/>
          </ListItemIcon>
          <ListItemText primary={t('Groups')}/>
        </MenuItem>
        <MenuItem
          component={Link}
          to='/admin/settings/security/users'
          selected={location.pathname === '/admin/settings/security/users'}
          classes={{ root: classes.item }}
          dense={false}
        >
          <ListItemIcon>
            <PermIdentityOutlined fontSize="medium"/>
          </ListItemIcon>
          <ListItemText primary={t('Users')}/>
        </MenuItem>
        <MenuItem
          component={Link}
          to='/admin/settings/security/policies'
          selected={location.pathname === '/admin/settings/security/policies'}
          classes={{ root: classes.item }}
          dense={false}
        >
          <ListItemIcon>
            <LocalPoliceOutlined fontSize="medium"/>
          </ListItemIcon>
          <ListItemText primary={t('Policies')}/>
        </MenuItem>
      </MenuList>
    </Drawer>
  );
};

export default DefinitionMenu;
