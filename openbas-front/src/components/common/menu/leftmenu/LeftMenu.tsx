import { Divider, Drawer, MenuList, Toolbar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Fragment, FunctionComponent } from 'react';

import { computeBannerSettings } from '../../../../public/components/systembanners/utils';
import useAuth from '../../../../utils/hooks/useAuth';
import { hasHref, LeftMenuEntries } from './leftmenu-model';
import MenuItemGroup from './MenuItemGroup';
import MenuItemLogo from './MenuItemLogo';
import MenuItemSingle from './MenuItemSingle';
import MenuItemToggle from './MenuItemToggle';
import useLeftMenu from './useLeftMenu';

const LeftMenu: FunctionComponent<{ entries: LeftMenuEntries[] }> = ({
  entries = [],
}) => {
  // Standard hooks
  const theme = useTheme();
  const { settings } = useAuth();
  const { bannerHeightNumber } = computeBannerSettings(settings);

  const { state, helpers } = useLeftMenu(entries);

  return (
    <Drawer
      variant="permanent"
      sx={{
        'width': state.navOpen ? 180 : 55,
        'transition': theme.transitions.create('width', {
          easing: theme.transitions.easing.easeInOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: state.navOpen ? 180 : 55,
          minHeight: '100vh',
          backgroundColor: theme.palette.background.nav,
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar />
      {entries.map((entry, idxList) => {
        return (
          <Fragment key={idxList}>
            {idxList !== 0 && <Divider />}
            <MenuList component="nav" sx={{ marginTop: bannerHeightNumber }}>
              {(entry.userRight ?? true)
              && entry.items.map((item) => {
                if (hasHref(item)) {
                  return (
                    <MenuItemGroup
                      key={item.label}
                      item={item}
                      state={state}
                      helpers={helpers}
                    />
                  );
                }
                return (
                  <MenuItemSingle key={item.label} item={item} navOpen={state.navOpen} />
                );
              })}
            </MenuList>
          </Fragment>
        );
      })}
      <div style={{ marginTop: 'auto' }}>
        <MenuList
          component="nav"
          sx={{ marginBottom: bannerHeightNumber }}
        >
          <MenuItemLogo
            navOpen={state.navOpen}
            onClick={() => window.open('https://filigran.io/', '_blank')}
          />
          <MenuItemToggle
            navOpen={state.navOpen}
            onClick={helpers.handleToggleDrawer}
          />
        </MenuList>
      </div>
    </Drawer>
  );
};

export default LeftMenu;
