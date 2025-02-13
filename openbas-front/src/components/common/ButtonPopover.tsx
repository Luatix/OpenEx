import { MoreVert } from '@mui/icons-material';
import { IconButton, Menu, MenuItem, ToggleButton, type ToggleButtonProps } from '@mui/material';
import { type Dispatch, type FunctionComponent, type SetStateAction, useState } from 'react';

import { useFormatter } from '../i18n';

export interface PopoverEntry {
  label: string;
  action: () => void | Dispatch<SetStateAction<boolean>>;
  disabled?: boolean;
}

export type VariantButtonPopover = 'toggle' | 'icon';

interface Props {
  entries: PopoverEntry[];
  buttonProps?: ToggleButtonProps;
  variant?: VariantButtonPopover;
  disabled?: boolean;
}

const ButtonPopover: FunctionComponent<Props> = ({
  entries,
  buttonProps,
  variant = 'toggle',
  disabled = false,
}) => {
  // Standard hooks
  const { t } = useFormatter();

  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  return (
    <>
      {variant === 'toggle'
      && (
        <ToggleButton
          value="popover"
          size="small"
          color="primary"
          onClick={(ev) => {
            ev.stopPropagation();
            setAnchorEl(ev.currentTarget);
          }}
          style={{ ...buttonProps }}
          disabled={disabled}
        >
          <MoreVert fontSize="small" color={disabled ? 'disabled' : 'primary'} />
        </ToggleButton>
      )}
      {variant === 'icon'
      && (
        <IconButton
          value="popover"
          size="large"
          color="primary"
          onClick={(ev) => {
            ev.stopPropagation();
            setAnchorEl(ev.currentTarget);
          }}
          style={{ ...buttonProps }}
          disabled={disabled}
        >
          <MoreVert color={disabled ? 'disabled' : 'primary'} />
        </IconButton>
      )}
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

export default ButtonPopover;
