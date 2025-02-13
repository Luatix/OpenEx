import { FormControlLabel, Switch } from '@mui/material';
import { type CSSProperties } from 'react';
import { type Control, Controller } from 'react-hook-form';

interface Props {
  label: string;
  control: Control;
  name: string;
  style?: CSSProperties;
  disabled?: boolean;
}

const SwitchField = ({ control, label, name, style = {}, disabled = false, ...extraProps }: Props) => {
  return (
    <div style={style}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <FormControlLabel
            control={<Switch {...field} checked={!!field?.value} disabled={disabled} {...extraProps} />}
            label={label}
          />
        )}
      />
    </div>
  );
};

export default SwitchField;
