import { Drawer, ListItemIcon, ListItemText, MenuItem, MenuList } from '@mui/material';
import { type FunctionComponent, type ReactElement } from 'react';
import { Link, useLocation } from 'react-router';
import { type CSSObject } from 'tss-react';
import { makeStyles } from 'tss-react/mui';

import { isNotEmptyField } from '../../../utils/utils';
import { useFormatter } from '../../i18n';

const useStyles = makeStyles()(theme => ({
  drawer: {
    minHeight: '100vh',
    width: 200,
    position: 'fixed',
    overflow: 'auto',
    padding: 0,
    backgroundColor: theme.palette.background.nav,
  },
  toolbar: theme.mixins.toolbar as CSSObject,
  item: {
    paddingTop: 10,
    paddingBottom: 10,
  },
}));

export interface RightMenuEntry {
  path: string;
  icon: () => ReactElement;
  label: string;
  number?: number;
}

const RightMenu: FunctionComponent<{ entries: RightMenuEntry[] }> = ({
  entries,
}) => {
  // Standard hooks
  const location = useLocation();
  const { classes } = useStyles();
  const { t } = useFormatter();
  return (
    <Drawer
      variant="permanent"
      anchor="right"
      classes={{ paper: classes.drawer }}
    >
      <div className={classes.toolbar} />
      <MenuList component="nav">
        {entries.map((entry, idx) => {
          const isCurrentTab = location.pathname === entry.path;
          return (
            <MenuItem
              key={idx}
              component={Link}
              to={entry.path}
              selected={isCurrentTab}
              classes={{ root: classes.item }}
            >
              <ListItemIcon>
                {entry.icon()}
              </ListItemIcon>
              <ListItemText primary={isNotEmptyField(entry.number) ? `${t(entry.label)} (${entry.number})` : t(entry.label)} />
            </MenuItem>
          );
        })}
      </MenuList>
    </Drawer>
  );
};

export default RightMenu;
