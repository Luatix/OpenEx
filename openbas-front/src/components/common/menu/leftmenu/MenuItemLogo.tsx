import { ListItemIcon, MenuItem, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { type FunctionComponent } from 'react';

import logoFiligranDark from '../../../../static/images/logo_filigran_dark.png';
import logoFiligranLight from '../../../../static/images/logo_filigran_light.png';
import logoFiligranTextDark from '../../../../static/images/logo_filigran_text_dark.png';
import logoFiligranTextLight from '../../../../static/images/logo_filigran_text_light.png';
import { fileUri } from '../../../../utils/Environment';

interface Props {
  navOpen: boolean;
  onClick: () => void;
}

const MenuItemLogo: FunctionComponent<Props> = ({
  navOpen,
  onClick,
}) => {
  // Standard hooks
  const theme = useTheme();
  const { palette } = theme;
  const isDarkMode = palette.mode === 'dark';

  return (
    <MenuItem
      dense
      onClick={onClick}
      aria-label="Filigran logo menu item"
    >
      <Tooltip title="By Filigran">
        <ListItemIcon style={{ minWidth: 20 }}>
          <img
            src={fileUri(isDarkMode ? logoFiligranDark : logoFiligranLight)}
            alt="logo"
            width={20}
          />
        </ListItemIcon>
      </Tooltip>
      {navOpen && (
        <ListItemIcon
          style={{ padding: '4px 0 0 15px' }}
        >
          <img
            src={fileUri(isDarkMode ? logoFiligranTextDark : logoFiligranTextLight)}
            alt="logo"
            width={50}
          />
        </ListItemIcon>
      )}
    </MenuItem>
  );
};

export default MenuItemLogo;
