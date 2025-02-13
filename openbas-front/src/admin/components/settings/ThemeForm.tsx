import { zodResolver } from '@hookform/resolvers/zod';
import { Button, TextField as MuiTextField } from '@mui/material';
import { type FunctionComponent, useEffect } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { makeStyles } from 'tss-react/mui';
import { z } from 'zod';

import ColorPickerField from '../../../components/ColorPickerField';
import { useFormatter } from '../../../components/i18n';
import { type ThemeInput } from '../../../utils/api-types';
import { zodImplement } from '../../../utils/Zod';

interface Props {
  onSubmit: SubmitHandler<ThemeInput>;
  initialValues?: ThemeInput;
}

const useStyles = makeStyles()(() => ({
  field: {
    marginBottom: 20,
  },
}));

const ThemeForm: FunctionComponent<Props> = ({
  onSubmit,
  initialValues = {
    accent_color: '',
    background_color: '',
    logo_login_url: '',
    logo_url: '',
    logo_url_collapsed: '',
    navigation_color: '',
    paper_color: '',
    primary_color: '',
    secondary_color: '',
  },
}) => {
  // Standard hooks
  const { classes } = useStyles();
  const { t } = useFormatter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<ThemeInput>({
    mode: 'onTouched',
    resolver: zodResolver(
      zodImplement<ThemeInput>().with({
        accent_color: z.string().optional(),
        background_color: z.string().optional(),
        logo_login_url: z.string().optional(),
        logo_url: z.string().optional(),
        logo_url_collapsed: z.string().optional(),
        navigation_color: z.string().optional(),
        paper_color: z.string().optional(),
        primary_color: z.string().optional(),
        secondary_color: z.string().optional(),
      }),
    ),
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <form id="themeForm" onSubmit={handleSubmit(onSubmit)}>

      <ColorPickerField
        className={classes.field}
        variant="standard"
        fullWidth
        label={t('Background color')}
        placeholder={t('Default')}
        error={!!errors.background_color}
        helperText={errors.background_color && errors.background_color?.message}
        control={control}
        name="background_color"
      />
      <ColorPickerField
        className={classes.field}
        variant="standard"
        fullWidth
        label={t('Paper color')}
        placeholder={t('Default')}
        error={!!errors.paper_color}
        helperText={errors.paper_color && errors.paper_color?.message}
        control={control}
        name="paper_color"
      />
      <ColorPickerField
        className={classes.field}
        variant="standard"
        fullWidth
        label={t('Navigation color')}
        placeholder={t('Default')}
        error={!!errors.navigation_color}
        helperText={errors.navigation_color && errors.navigation_color?.message}
        control={control}
        name="navigation_color"
      />
      <ColorPickerField
        className={classes.field}
        variant="standard"
        fullWidth
        label={t('Primary color')}
        placeholder={t('Default')}
        error={!!errors.primary_color}
        helperText={errors.primary_color && errors.primary_color?.message}
        control={control}
        name="primary_color"
      />
      <ColorPickerField
        className={classes.field}
        variant="standard"
        fullWidth
        label={t('Secondary color')}
        placeholder={t('Default')}
        error={!!errors.secondary_color}
        helperText={errors.secondary_color && errors.secondary_color?.message}
        control={control}
        name="secondary_color"
      />
      <ColorPickerField
        className={classes.field}
        variant="standard"
        fullWidth
        label={t('Accent color')}
        placeholder={t('Default')}
        error={!!errors.accent_color}
        helperText={errors.accent_color && errors.accent_color?.message}
        control={control}
        name="accent_color"
      />
      <MuiTextField
        className={classes.field}
        variant="standard"
        fullWidth
        label={t('Logo URL')}
        placeholder={t('Default')}
        error={!!errors.logo_url}
        helperText={errors.logo_url && errors.logo_url?.message}
        inputProps={register('logo_url')}
      />
      <MuiTextField
        className={classes.field}
        variant="standard"
        fullWidth
        label={t('Logo URL (collapsed)')}
        placeholder={t('Default')}
        error={!!errors.logo_url_collapsed}
        helperText={errors.logo_url_collapsed && errors.logo_url_collapsed?.message}
        inputProps={register('logo_url_collapsed')}
      />
      <MuiTextField
        variant="standard"
        fullWidth
        label={t('Logo URL (login)')}
        placeholder={t('Default')}
        error={!!errors.logo_login_url}
        helperText={errors.logo_login_url && errors.logo_login_url?.message}
        inputProps={register('logo_login_url')}
      />

      <div style={{ float: 'right', marginTop: 20 }}>
        <Button
          variant="contained"
          color="secondary"
          type="submit"
          disabled={!isDirty || isSubmitting}
        >
          {t('Update')}
        </Button>
      </div>
    </form>
  );
};

export default ThemeForm;
