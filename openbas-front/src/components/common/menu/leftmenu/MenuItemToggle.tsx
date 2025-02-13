import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import { type FunctionComponent } from 'react';

import { useFormatter } from '../../../i18n';

interface Props {
  navOpen: boolean;
  onClick: () => void;
}

const MenuItemToggle: FunctionComponent<Props> = ({ navOpen, onClick }) => {
  // Standard hooks
  const { t } = useFormatter();

  return (
    <MenuItem
      aria-label={navOpen ? 'Collapse menu' : 'Expand menu'}
      dense
      onClick={onClick}
    >
      <ListItemIcon style={{ minWidth: 20 }}>
        {navOpen ? <ChevronLeft /> : <ChevronRight />}
      </ListItemIcon>
      {navOpen && (
        <ListItemText
          primary={t('Collapse')}
          slotProps={{
            primary: {
              padding: '1px 0 0 15px',
              fontWeight: 500,
              fontSize: 14,
            },
          }}
        />
      )}
    </MenuItem>
  );
};

export default MenuItemToggle;
