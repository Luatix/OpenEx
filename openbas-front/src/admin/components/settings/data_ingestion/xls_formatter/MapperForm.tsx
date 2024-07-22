import { Controller, SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import React, { useState } from 'react';
import { Button, IconButton, TextField, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ImportMapperAddInput } from '../../../../../utils/api-types';
import { useFormatter } from '../../../../../components/i18n';
import { zodImplement } from '../../../../../utils/Zod';
import RegexComponent from '../../../../../components/RegexComponent';
import RulesContractContent from './RulesContractContent';
import XlsMapperTestDialog from './XlsMapperTestDialog';

const useStyles = makeStyles(() => ({
  importerStyle: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 20,
  },
  importersErrorMessage: {
    fontSize: 13,
    color: '#f44336',
  },
}));

interface Props {
  onSubmit: SubmitHandler<ImportMapperAddInput>;
  editing?: boolean;
  initialValues?: ImportMapperAddInput;
}

const MapperForm: React.FC<Props> = ({
  onSubmit,
  editing,
  initialValues = {
    mapper_name: '',
    mapper_inject_type_column: '',
    mapper_inject_importers: [],
  },
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const classes = useStyles();

  const ruleAttributeZodObject = z.object({
    rule_attribute_name: z.string().min(1, { message: t('Should not be empty') }),
    rule_attribute_columns: z.string().optional().nullable(),
    rule_attribute_default_value: z.string().optional(),
    rule_attribute_additional_config: z.record(z.string(), z.string()).optional(),
  });

  const importerZodObject = z.object({
    inject_importer_type_value: z.string().min(1, { message: t('Should not be empty') }),
    inject_importer_injector_contract_id: z.string().min(1, { message: t('Should not be empty') }),
    inject_importer_rule_attributes: z.array(ruleAttributeZodObject).optional(),
  });

  const methods = useForm<ImportMapperAddInput>({
    mode: 'onTouched',
    resolver: zodResolver(
      zodImplement<ImportMapperAddInput>().with({
        mapper_name: z.string().min(1, { message: t('Should not be empty') }),
        mapper_inject_importers: z.array(importerZodObject)
          .min(1, { message: t('At least one inject type is required') }),
        mapper_inject_type_column: z.string()
          .min(1, { message: t('Should not be empty') }),
      }),
    ),
    defaultValues: initialValues,
  });

  const { control, getValues } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'mapper_inject_importers',
  });

  const [openTest, setOpenTest] = useState(false);

  return (
    <>
      <form id="mapperForm" onSubmit={methods.handleSubmit(onSubmit)}>
        <TextField
          variant="standard"
          fullWidth
          label={t('Mapper name')}
          style={{ marginTop: 10 }}
          error={!!methods.formState.errors.mapper_name}
          helperText={methods.formState.errors.mapper_name?.message}
          inputProps={methods.register('mapper_name')}
          InputLabelProps={{ required: true }}
        />
        <div style={{ marginTop: 20 }}>
          <Controller
            control={control}
            name={'mapper_inject_type_column'}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <RegexComponent
                label={t('Inject type column')}
                fieldValue={value}
                onChange={onChange}
                required={true}
                error={error}
              />
            )}
          />
        </div>
        <div className={classes.importerStyle}>
          <Typography variant="h3" sx={{ m: 0 }}>
            {t('Representation for inject type')}
          </Typography>
          <IconButton
            color="secondary"
            aria-label="Add"
            onClick={() => {
              append({ inject_importer_type_value: '', inject_importer_injector_contract_id: '', inject_importer_rule_attributes: [] });
            }}
            size="large"
          >
            <Add fontSize="small" />
          </IconButton>
          <div>
            <span className={classes.importersErrorMessage}>{methods.formState.errors.mapper_inject_importers?.message}</span>
          </div>
        </div>

        {fields.map((field, index) => (
          <RulesContractContent
            key={field.id}
            field={field}
            methods={methods}
            index={index}
            remove={remove}
          />
        ))}

        <div style={{ float: 'right', marginTop: 20 }}>
          <Button
            variant="contained"
            onClick={() => setOpenTest(true)}
            color="primary"
            style={{ marginRight: 10 }}
            // disabled={isSubmitting}
          >
            {t('Test')}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            type="submit"
            // disabled={!isDirty || isSubmitting}
          >
            {editing ? t('Update') : t('Create')}
          </Button>
        </div>
      </form>
      <XlsMapperTestDialog
        open={openTest}
        onClose={() => setOpenTest(false)}
        importMapperValues={getValues()}
      />
    </>
  );
};

export default MapperForm;
