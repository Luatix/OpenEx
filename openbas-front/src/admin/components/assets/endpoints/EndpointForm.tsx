import { zodResolver } from '@hookform/resolvers/zod';
import { Button, TextField } from '@mui/material';
import { type FunctionComponent, type SyntheticEvent } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import TagField from '../../../../components/fields/TagField';
import { useFormatter } from '../../../../components/i18n';
import { type EndpointUpdateInput } from '../../../../utils/api-types';
import { zodImplement } from '../../../../utils/Zod';

interface Props {
  onSubmit: SubmitHandler<EndpointUpdateInput>;
  handleClose: () => void;
  editing?: boolean;
  initialValues?: EndpointUpdateInput;
}

const EndpointForm: FunctionComponent<Props> = ({
  onSubmit,
  handleClose,
  editing,
  initialValues = {
    asset_name: '',
    asset_description: '',
    asset_tags: [],
  },
}) => {
  // Standard hooks
  const { t } = useFormatter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EndpointUpdateInput>({
    mode: 'onTouched',
    resolver: zodResolver(
      zodImplement<EndpointUpdateInput>().with({
        asset_name: z.string().min(1, { message: t('Should not be empty') }),
        asset_description: z.string().optional(),
        asset_tags: z.string().array().optional(),
      }),
    ),
    defaultValues: initialValues,
  });

  const handleSubmitWithoutPropagation = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  return (
    <form id="endpointForm" onSubmit={handleSubmitWithoutPropagation}>
      <TextField
        variant="standard"
        fullWidth
        label={t('Name')}
        style={{ marginTop: 10 }}
        error={!!errors.asset_name}
        helperText={errors.asset_name?.message}
        inputProps={register('asset_name')}
        InputLabelProps={{ required: true }}
      />
      <TextField
        variant="standard"
        fullWidth
        multiline
        rows={2}
        label={t('Description')}
        style={{ marginTop: 20 }}
        error={!!errors.asset_description}
        helperText={errors.asset_description?.message}
        inputProps={register('asset_description')}
      />
      <Controller
        control={control}
        name="asset_tags"
        render={({ field: { onChange, value } }) => (
          <TagField
            name="asset_tags"
            label={t('Tags')}
            fieldValue={value ?? []}
            fieldOnChange={onChange}
            errors={errors}
            style={{ marginTop: 20 }}
          />
        )}
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

export default EndpointForm;
