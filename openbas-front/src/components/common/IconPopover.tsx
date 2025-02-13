import { MoreVert } from '@mui/icons-material';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { type FunctionComponent, useState } from 'react';

import { useFormatter } from '../i18n';
import { type PopoverEntry } from './ButtonPopover';

interface Props {
  entries: PopoverEntry[];
}

const IconPopover: FunctionComponent<Props> = ({
  entries,
}) => {
  // Standard hooks
  const { t } = useFormatter();

  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  return (
    <>
      <IconButton
        color="primary"
        onClick={(ev) => {
          ev.stopPropagation();
          setAnchorEl(ev.currentTarget);
        }}
        aria-label="Xls mapper menu"
        aria-haspopup="true"
        size="large"
      >
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {entries.map((entry) => {
          return (
            <MenuItem
              key={entry.label}
              disabled={entry.disabled}
              onClick={() => {
                entry.action();
                setAnchorEl(null);
              }}
            >
              {t(entry.label)}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default IconPopover;
