import { FormControlLabel, FormLabel, Radio, RadioGroup, Tooltip } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import React, { FunctionComponent } from 'react';
import { Control, Controller } from 'react-hook-form';
import { makeStyles } from '@mui/styles';
import type { Theme } from '../../../../../../components/Theme';
import { useFormatter } from '../../../../../../components/i18n';
import { ExpectationInput } from '../Expectation';

const useStyles = makeStyles((theme: Theme) => ({
  marginTop_2: {
    marginTop: theme.spacing(2),
  },
  container: {
    display: 'flex',
    alignItems: 'end',
    gap: 5,
  },
}));

interface Props {
  control: Control<ExpectationInput>;
}

const ExpectationGroupField: FunctionComponent<Props> = ({
  control,
}) => {
  const { t } = useFormatter();
  const classes = useStyles();

  return (
    <Controller
      control={control}
      name="expectation_expectation_group"
      render={({ field: { onChange, value } }) => (
        <div className={classes.marginTop_2}>
          <FormLabel className={classes.container}>
            {t('Validation mode')}
            <Tooltip
              title={t(
                'An isolated asset is considered as a group of one asset',
              )}
            >
              <InfoOutlined
                fontSize="small"
                color="primary"
                style={{ marginTop: 8 }}
              />
            </Tooltip>
          </FormLabel>
          <RadioGroup
            defaultValue={false}
            value={value}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onChange((event.target as HTMLInputElement).value === 'true');
            }}
          >
            <FormControlLabel value={false} control={<Radio />} label={t('All assets (per group) must validate the expectation')} />
            <FormControlLabel value={true} control={<Radio />} label={t('At least one asset (per group) must validate the expectation')} />
          </RadioGroup>
        </div>
      )}
    />
  );
};

export default ExpectationGroupField;
