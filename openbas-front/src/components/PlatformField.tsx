import { Autocomplete, Box, TextField } from '@mui/material';
import { type FunctionComponent } from 'react';
import { type FieldError } from 'react-hook-form';
import { makeStyles } from 'tss-react/mui';

import { type Option } from '../utils/Option';
import { useFormatter } from './i18n';
import PlatformIcon from './PlatformIcon';

const useStyles = makeStyles()(() => ({
  icon: {
    paddingTop: 4,
    display: 'inline-block',
  },
  text: {
    display: 'inline-block',
    flexGrow: 1,
    marginLeft: 10,
  },
  autoCompleteIndicator: {
    display: 'none',
  },
}));

interface Props {
  label: string;
  onChange: (options: Option[]) => void;
  value: Option[] | undefined;
  error: FieldError | undefined;
}

const PlatformField: FunctionComponent<Props> = ({
  value,
  label,
  onChange,
  error,
}) => {
  // Standard hooks
  const { classes } = useStyles();
  const { t } = useFormatter();

  const platformsOptions: Option[] = [
    { id: 'Windows', label: 'Windows' },
    { id: 'Linux', label: 'Linux' },
    { id: 'MacOS', label: 'MacOS' },
  ];

  return (
    <Autocomplete
      size="small"
      multiple
      options={platformsOptions}
      openOnFocus
      autoHighlight
      noOptionsText={t('No available options')}
      renderInput={
        params => (
          <TextField
            {...params}
            label={t(label)}
            fullWidth
            style={{ marginTop: 20 }}
            variant="standard"
            size="small"
            InputLabelProps={{ required: true }}
            error={!!error}
            helperText={error?.message}
          />
        )
      }
      value={platformsOptions.filter(p => value?.map(v => v.id)?.includes(p.id)) ?? null}
      onChange={(_event, platform) => {
        onChange(platform);
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <div className={classes.icon}>
            <PlatformIcon platform={option.id} width={15} />
          </div>
          <div className={classes.text}>{option.label}</div>
        </Box>
      )}
      classes={{ clearIndicator: classes.autoCompleteIndicator }}
    />

  );
};

export default PlatformField;
