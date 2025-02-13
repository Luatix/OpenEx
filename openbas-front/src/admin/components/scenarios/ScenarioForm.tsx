import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Button,
  Chip,
  Grid,
  MenuItem,
  TextField as MuiTextField,
  Typography,
} from '@mui/material';
import { type FunctionComponent, useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import SelectField from '../../../components/fields/SelectField';
import TagField from '../../../components/fields/TagField';
import TextField from '../../../components/fields/TextField';
import { useFormatter } from '../../../components/i18n';
import { type ScenarioInput } from '../../../utils/api-types';
import { zodImplement } from '../../../utils/Zod';
import { scenarioCategories } from './constants';

interface Props {
  onSubmit: SubmitHandler<ScenarioInput>;
  handleClose: () => void;
  editing?: boolean;
  disabled?: boolean;
  initialValues: ScenarioInput;
}

const ScenarioForm: FunctionComponent<Props> = ({
  onSubmit,
  handleClose,
  editing,
  initialValues,
  disabled,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const [inputValue, setInputValue] = useState('');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    setValue,
  } = useForm<ScenarioInput>({
    mode: 'onTouched',
    resolver: zodResolver(
      zodImplement<ScenarioInput>().with({
        scenario_name: z.string().min(1, { message: t('Should not be empty') }),
        scenario_category: z.string().optional(),
        scenario_main_focus: z.string().optional(),
        scenario_severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        scenario_subtitle: z.string().optional(),
        scenario_description: z.string().optional(),
        scenario_tags: z.string().array().optional(),
        scenario_external_reference: z.string().optional(),
        scenario_external_url: z.string().optional(),
        scenario_mail_from: z.string().email(t('Should be a valid email address')).optional(),
        scenario_mails_reply_to: z.array(z.string().email(t('Should be a valid email address'))).optional(),
        scenario_message_header: z.string().optional(),
        scenario_message_footer: z.string().optional(),
      }),
    ),
    defaultValues: initialValues,
  });
  return (
    <form id="scenarioForm" onSubmit={handleSubmit(onSubmit)}>
      <Typography
        variant="h2"
        gutterBottom
        style={{ marginTop: 20 }}
      >
        {t('General')}
      </Typography>
      <TextField
        variant="standard"
        fullWidth
        label={t('Name')}
        style={{ marginTop: editing ? 20 : 10 }}
        error={!!errors.scenario_name}
        helperText={errors.scenario_name?.message}
        inputProps={register('scenario_name')}
        InputLabelProps={{ required: true }}
        control={control}
        setValue={setValue}
        askAi={true}
      />
      <Grid container spacing={2}>
        <Grid item xs={7}>
          <SelectField
            variant="standard"
            fullWidth={true}
            name="scenario_category"
            label={t('Category')}
            style={{ marginTop: 20 }}
            error={!!errors.scenario_category}
            control={control}
            defaultValue={initialValues.scenario_category}
          >
            {Array.from(scenarioCategories).map(([key, value]) => (
              <MenuItem key={key} value={key}>
                {t(value)}
              </MenuItem>
            ))}
          </SelectField>
        </Grid>
        <Grid item xs={5}>
          <SelectField
            variant="standard"
            fullWidth={true}
            name="scenario_main_focus"
            label={t('Main focus')}
            style={{ marginTop: 20 }}
            error={!!errors.scenario_main_focus}
            control={control}
            defaultValue={initialValues.scenario_main_focus}
          >
            <MenuItem key="endpoint-protection" value="endpoint-protection">
              {t('Endpoint Protection')}
            </MenuItem>
            <MenuItem key="web-filtering" value="web-filtering">
              {t('Web Filtering')}
            </MenuItem>
            <MenuItem key="incident-response" value="incident-response">
              {t('Incident Response')}
            </MenuItem>
            <MenuItem key="standard-operating-procedure" value="standard-operating-procedure">
              {t('Standard Operating Procedures')}
            </MenuItem>
            <MenuItem key="crisis-communication" value="crisis-communication">
              {t('Crisis Communication')}
            </MenuItem>
            <MenuItem key="strategic-reaction" value="strategic-reaction">
              {t('Strategic Reaction')}
            </MenuItem>
          </SelectField>
        </Grid>
      </Grid>

      <SelectField
        variant="standard"
        fullWidth={true}
        name="scenario_severity"
        label={t('Severity')}
        style={{ marginTop: 20 }}
        error={!!errors.scenario_severity}
        control={control}
        defaultValue={initialValues.scenario_severity}
      >
        <MenuItem key="low" value="low">
          {t('Low')}
        </MenuItem>
        <MenuItem key="medium" value="medium">
          {t('Medium')}
        </MenuItem>
        <MenuItem key="high" value="high">
          {t('High')}
        </MenuItem>
        <MenuItem key="critical" value="critical">
          {t('Critical')}
        </MenuItem>
      </SelectField>
      <TextField
        variant="standard"
        fullWidth
        multiline
        rows={5}
        label={t('Description')}
        style={{ marginTop: 20 }}
        error={!!errors.scenario_description}
        helperText={errors.scenario_description?.message}
        inputProps={register('scenario_description')}
        control={control}
        setValue={setValue}
        askAi={true}
      />
      <Controller
        control={control}
        name="scenario_tags"
        render={({ field: { onChange, value } }) => (
          <TagField
            name="scenarios_tags"
            label={t('Tags')}
            fieldValue={value ?? []}
            fieldOnChange={onChange}
            errors={errors}
            style={{ marginTop: 20 }}
          />
        )}
      />
      <Typography
        variant="h2"
        gutterBottom
        style={{ marginTop: 40 }}
      >
        {t('Emails and SMS')}
      </Typography>

      <MuiTextField
        variant="standard"
        fullWidth
        label={t('Sender email address')}
        style={{ marginTop: 20 }}
        error={!!errors.scenario_mail_from}
        helperText={errors.scenario_mail_from && errors.scenario_mail_from?.message}
        inputProps={register('scenario_mail_from')}
        disabled={disabled}
      />

      <Controller
        control={control}
        name="scenario_mails_reply_to"
        render={({ field, fieldState }) => {
          return (
            <Autocomplete
              multiple
              id="email-reply-to-input"
              freeSolo
              open={false}
              options={[]}
              value={field.value}
              onChange={() => {
                if (undefined !== field.value && inputValue !== '' && !field.value.includes(inputValue)) {
                  field.onChange([...(field.value || []), inputValue.trim()]);
                }
              }}
              onBlur={field.onBlur}
              inputValue={inputValue}
              onInputChange={(_event, newInputValue) => {
                setInputValue(newInputValue);
              }}
              disableClearable={true}
              renderTags={(tags: string[], getTagProps) => tags.map((email: string, index: number) => {
                return (
                  <Chip
                    variant="outlined"
                    label={email}
                    {...getTagProps({ index })}
                    key={email}
                    style={{ borderRadius: 4 }}
                    onDelete={() => {
                      const newValue = [...(field.value || [])];
                      newValue.splice(index, 1);
                      field.onChange(newValue);
                    }}
                  />
                );
              })}
              renderInput={params => (
                <MuiTextField
                  {...params}
                  variant="standard"
                  label={t('Reply to')}
                  style={{ marginTop: 20 }}
                  error={!!fieldState.error}
                  helperText={errors.scenario_mails_reply_to?.find ? errors.scenario_mails_reply_to?.find(value => value != null)?.message ?? '' : ''}
                />
              )}
            />
          );
        }}
      />
      <Alert
        severity="warning"
        variant="outlined"
        style={{ position: 'relative', border: 'none' }}
      >
        <AlertTitle>
          {t('If you remove the default email address, the email reception for this simulation / scenario will be disabled.')}
        </AlertTitle>
      </Alert>
      <MuiTextField
        variant="standard"
        fullWidth
        label={t('Messages header')}
        style={{ marginTop: 20 }}
        error={!!errors.scenario_message_header}
        helperText={errors.scenario_message_header && errors.scenario_message_header?.message}
        inputProps={register('scenario_message_header')}
        disabled={disabled}
      />
      <MuiTextField
        variant="standard"
        fullWidth
        label={t('Messages footer')}
        style={{ marginTop: 20 }}
        error={!!errors.scenario_message_footer}
        helperText={errors.scenario_message_footer && errors.scenario_message_footer?.message}
        inputProps={register('scenario_message_footer')}
        disabled={disabled}
      />
      <div style={{ float: 'right', marginTop: 20 }}>
        <Button
          variant="contained"
          onClick={handleClose}
          style={{ marginRight: 10 }}
          disabled={isSubmitting}
        >
          {t('Cancel')}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          type="submit"
          disabled={!isDirty || isSubmitting}
        >
          {editing ? t('Update') : t('Create')}
        </Button>
      </div>

    </form>
  );
};

export default ScenarioForm;
