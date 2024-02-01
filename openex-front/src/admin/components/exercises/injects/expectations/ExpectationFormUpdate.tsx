import React, { FunctionComponent, SyntheticEvent } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Alert, Button, FormControlLabel, FormLabel, InputLabel, MenuItem, Radio, RadioGroup, Select as MUISelect, TextField as MuiTextField } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { formProps, infoMessage, isTechnicalExpectation } from './ExpectationFormUtils';
import type { ExpectationInput } from './Expectation';
import { useFormatter } from '../../../../../components/i18n';
import type { Theme } from '../../../../../components/Theme';

const useStyles = makeStyles((theme: Theme) => ({
  marginTop_2: {
    marginTop: theme.spacing(2),
  },
  buttons: {
    display: 'flex',
    placeContent: 'end',
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
}));

interface Props {
  onSubmit: SubmitHandler<ExpectationInput>;
  handleClose: () => void;
  initialValues: ExpectationInput;
}

const ExpectationFormUpdate: FunctionComponent<Props> = ({
  onSubmit,
  handleClose,
  initialValues,
}) => {
  const { t } = useFormatter();
  const classes = useStyles();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    getValues,
    control,
  } = useForm<ExpectationInput>(formProps(initialValues, t));

  const handleSubmitWithoutPropagation = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  return (
    <form id="expectationForm" onSubmit={handleSubmitWithoutPropagation}>
      <div>
        <InputLabel id="input-type">{t('Type')}</InputLabel>
        <MUISelect
          disabled
          labelId="input-type"
          value={getValues().expectation_type}
          variant="standard"
          fullWidth
          error={!!errors.expectation_type}
          inputProps={register('expectation_type')}
        >
          <MenuItem value={getValues().expectation_type}>{t(getValues().expectation_type)}</MenuItem>
        </MUISelect>
      </div>
      {getValues().expectation_type === 'ARTICLE'
        && <Alert
          severity="info"
          className={classes.marginTop_2}
           >
          {infoMessage(getValues().expectation_type, t)}
        </Alert>
      }
      <MuiTextField
        variant="standard"
        fullWidth
        label={t('Name')}
        className={classes.marginTop_2}
        error={!!errors.expectation_name}
        helperText={
          errors.expectation_name && errors.expectation_name?.message
        }
        inputProps={register('expectation_name')}
      />
      <MuiTextField
        variant="standard"
        fullWidth
        label={t('Description')}
        className={classes.marginTop_2}
        multiline
        error={!!errors.expectation_description}
        helperText={
          errors.expectation_description && errors.expectation_description?.message
        }
        inputProps={register('expectation_description')}
      />
      <MuiTextField
        variant="standard"
        fullWidth
        label={t('Score')}
        type="number"
        className={classes.marginTop_2}
        error={!!errors.expectation_score}
        helperText={
          errors.expectation_score && errors.expectation_score?.message
        }
        inputProps={register('expectation_score')}
      />

      {isTechnicalExpectation(initialValues)
        && <Controller
          control={control}
          name="expectation_expectation_group"
          render={({ field: { onChange, value } }) => (
            <div className={classes.marginTop_2}>
              <FormLabel>{t('Validation type')}</FormLabel>
              <RadioGroup
                defaultValue={false}
                value={value}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  onChange((event.target as HTMLInputElement).value === 'true');
                }}
              >
                <FormControlLabel value={false} control={<Radio />} label="All assets must validate the expectation" />
                <FormControlLabel value={true} control={<Radio />} label="At least one asset must validate the expectation" />
              </RadioGroup>
            </div>
          )}
           />
      }

      <div className={classes.buttons}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
        >
          {t('Cancel')}
        </Button>
        <Button
          color="secondary"
          type="submit"
          disabled={!isValid || isSubmitting}
        >
          {t('Update')}
        </Button>
      </div>
    </form>
  );
};

export default ExpectationFormUpdate;
