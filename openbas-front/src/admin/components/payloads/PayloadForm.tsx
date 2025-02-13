import { zodResolver } from '@hookform/resolvers/zod';
import { ControlPointOutlined, DeleteOutlined } from '@mui/icons-material';
import { Button, IconButton, InputLabel, List, ListItem, ListItemText, MenuItem, TextField } from '@mui/material';
import { type FormEvent, type FunctionComponent } from 'react';
import { Controller, type SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { makeStyles } from 'tss-react/mui';
import { z } from 'zod';

import AttackPatternField from '../../../components/AttackPatternField';
import FileLoader from '../../../components/fields/FileLoader';
import SelectField from '../../../components/fields/SelectField';
import TagField from '../../../components/fields/TagField';
import { useFormatter } from '../../../components/i18n';
import PlatformField from '../../../components/PlatformField';
import { type PayloadCreateInput } from '../../../utils/api-types';
import { type Option } from '../../../utils/Option';

const useStyles = makeStyles()(() => ({
  errorColor: {
    color: '#f44336',
  },
  tuple: {
    marginTop: 5,
    paddingTop: 0,
    paddingLeft: 0,
  },
}));

type PayloadCreateInputForm = Omit<PayloadCreateInput, 'payload_type' | 'payload_source' | 'payload_status' | 'payload_platforms' | 'executable_file'> & {
  payload_platforms: Option[];
  executable_file: Option | undefined;
};

interface Props {
  onSubmit: SubmitHandler<PayloadCreateInputForm>;
  handleClose: () => void;
  editing: boolean;
  type: string;
  initialValues?: PayloadCreateInputForm;
}

const PayloadForm: FunctionComponent<Props> = ({
  onSubmit,
  handleClose,
  editing,
  type,
  initialValues = {
    payload_name: '',
    payload_platforms: [],
    payload_description: '',
    command_executor: '',
    command_content: '',
    payload_attack_patterns: [],
    payload_cleanup_command: '',
    payload_cleanup_executor: '',
    executable_file: undefined,
    file_drop_file: '',
    dns_resolution_hostname: '',
    payload_tags: [],
    payload_arguments: [],
    payload_prerequisites: [],
  },
}) => {
  const { classes } = useStyles();
  const { t } = useFormatter();

  const payloadPrerequisiteZodObject = z.object({
    executor: z.string().min(1, { message: t('Should not be empty') }),
    get_command: z.string().min(1, { message: t('Should not be empty') }),
    description: z.string().nullish(),
    check_command: z.string().optional(),
  });

  const payloadArgumentZodObject = z.object({
    default_value: z.string().min(1, { message: t('Should not be empty') }),
    key: z.string().min(1, { message: t('Should not be empty') }),
    type: z.string().min(1, { message: t('Should not be empty') }),
    description: z.string().nullish(),
  });

  const baseSchema = z.object({
    payload_name: z.string().min(1, { message: t('Should not be empty') }),
    payload_description: z.string().optional(),
    payload_platforms: z.object({
      id: z.string(),
      label: z.string(),
    }).array().min(1, { message: t('Should not be empty') }),
    payload_attack_patterns: z.string().array().optional(),
    payload_cleanup_command: z.string().optional(),
    payload_cleanup_executor: z.string().optional(),
    payload_tags: z.string().array().optional(),
    payload_arguments: z.array(payloadArgumentZodObject).optional(),
    payload_prerequisites: z.array(payloadPrerequisiteZodObject).optional(),
  });

  let extendedSchema;

  switch (type) {
    case 'Command':
      extendedSchema = baseSchema.extend({
        command_executor: z.string().min(1, { message: t('Should not be empty') }),
        command_content: z.string().min(1, { message: t('Should not be empty') }),
        payload_execution_arch: z.enum(['x86_64', 'arm64', 'ALL_ARCHITECTURES'], { message: t('Should not be empty') }),
      });
      break;
    case 'Executable':
      extendedSchema = baseSchema.extend({
        executable_file: z.object({
          id: z.string().min(1, { message: t('Should not be empty') }),
          label: z.string().min(1, { message: t('Should not be empty') }),
        }),
        payload_execution_arch: z.enum(['x86_64', 'arm64'], { message: t('Should not be empty') }),
      });
      break;
    case 'FileDrop':
      extendedSchema = baseSchema.extend({
        file_drop_file: z.string().min(1, { message: t('Should not be empty') }),
      });
      break;
    case 'DnsResolution':
      extendedSchema = baseSchema.extend({
        dns_resolution_hostname: z.string().min(1, { message: t('Should not be empty') }),
      });
      break;
    default:
      extendedSchema = baseSchema;
      break;
  }

  extendedSchema = extendedSchema.refine(input =>
    !(input.payload_cleanup_command && !input.payload_cleanup_executor), {
    message: t('Cleanup command and executor must be defined together or none at all'),
    path: ['payload_cleanup_executor'],
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PayloadCreateInputForm>({
    mode: 'onTouched',
    resolver: zodResolver(extendedSchema),
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'payload_arguments',
  });

  const { fields: prerequisitesFields, append: prerequisitesAppend, remove: prerequisitesRemove } = useFieldArray({
    control,
    name: 'payload_prerequisites',
  });

  const handleSubmitWithoutDefault = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };

  const updateArchitecture = (type === 'Executable') || (type === 'Command');

  return (
    <form id="payloadForm" onSubmit={handleSubmitWithoutDefault}>
      <TextField
        name="payload_name"
        fullWidth
        label={t('Name')}
        style={{ marginTop: 10 }}
        error={!!errors.payload_name}
        helperText={errors.payload_name?.message}
        inputProps={register('payload_name')}
        InputLabelProps={{ required: true }}
      />

      <Controller
        control={control}
        name="payload_platforms"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <PlatformField
            label={t('Platforms')}
            onChange={onChange}
            value={value}
            error={error}
          />
        )}
      />

      <Controller
        control={control}
        name="payload_execution_arch"
        render={({ field }) => (
          <>
            {updateArchitecture ? (
              <TextField
                select
                variant="standard"
                fullWidth
                value={field.value}
                label={t('Architecture')}
                style={{ marginTop: 20 }}
                error={!!errors.payload_execution_arch}
                helperText={errors.payload_execution_arch?.message}
                inputProps={register('payload_execution_arch')}
                InputLabelProps={{ required: true }}
              >
                <MenuItem value="x86_64">{t('x86_64')}</MenuItem>
                <MenuItem value="arm64">{t('arm64')}</MenuItem>
                {type === 'Command' && (
                  <MenuItem value="ALL_ARCHITECTURES">{t('ALL_ARCHITECTURES')}</MenuItem>
                )}
              </TextField>
            ) : (
              field.value != null && (
                <TextField
                  select
                  disabled
                  variant="standard"
                  fullWidth
                  value={field.value}
                  label={t('Architecture')}
                  style={{ marginTop: 20 }}
                  error={!!errors.payload_execution_arch}
                  helperText={errors.payload_execution_arch?.message}
                  inputProps={register('payload_execution_arch')}
                  InputLabelProps={{ required: true }}
                >
                  <MenuItem value="ALL_ARCHITECTURES">{t('ALL_ARCHITECTURES')}</MenuItem>
                </TextField>
              )
            )}
          </>
        )}
      />

      <TextField
        name="payload_description"
        multiline
        fullWidth
        rows={3}
        label={t('Description')}
        style={{ marginTop: 20 }}
        error={!!errors.payload_description}
        helperText={errors.payload_description?.message}
        inputProps={register('payload_description')}
      />

      {
        type === 'Command' && (
          <>
            <SelectField
              variant="standard"
              label={t('Command executor')}
              name="command_executor"
              control={control}
              fullWidth={true}
              style={{ marginTop: 20 }}
              error={!!errors.command_executor}
              helperText={t('Should not be empty')}
              InputLabelProps={{ required: true }}
            >
              <MenuItem value="psh">
                {t('PowerShell')}
              </MenuItem>
              <MenuItem value="cmd">
                {t('Command Prompt')}
              </MenuItem>
              <MenuItem value="bash">
                {t('Bash')}
              </MenuItem>
              <MenuItem value="sh">
                {t('Sh')}
              </MenuItem>
            </SelectField>
            <TextField
              name="command_content"
              multiline
              fullWidth
              rows={3}
              label={t('Command')}
              style={{ marginTop: 20 }}
              error={!!errors.command_content}
              helperText={t('To put arguments in the command line, use #{argument_key}')}
              InputLabelProps={{ required: true }}
              inputProps={register('command_content')}
            />
          </>
        )
      }
      {
        type === 'Executable' && (
          <Controller
            control={control}
            name="executable_file"
            render={({ field: { onChange } }) => (
              <FileLoader
                name="executable_file"
                label={t('Executable file')}
                setFieldValue={(_name, document) => {
                  onChange(document);
                }}
                initialValue={{ id: initialValues.executable_file?.id }}
                InputLabelProps={{ required: true }}
                error={!!errors.executable_file}
              />
            )}
          />

        )
      }
      {type === 'FileDrop' && (
        <Controller
          control={control}
          name="file_drop_file"
          render={({ field: { onChange } }) => (
            <FileLoader
              name="file_drop_file"
              label={t('File to drop')}
              setFieldValue={(_name, document) => {
                onChange(document?.id);
              }}
              initialValue={{ id: initialValues.file_drop_file }}
              InputLabelProps={{ required: true }}
              error={!!errors.file_drop_file}
            />

          )}
        />
      )}
      {type === 'DnsResolution' && (
        <>
          <TextField
            name="dns_resolution_hostname"
            label={t('Hostname')}
            style={{ marginTop: 20 }}
            multiline
            fullWidth
            rows={3}
            error={!!errors.dns_resolution_hostname}
            helperText={t('One hostname by line')}
            InputLabelProps={{ required: true }}
            inputProps={register('dns_resolution_hostname')}
          />
        </>
      )}
      <div style={{ marginTop: 20 }}>
        <InputLabel
          variant="standard"
          shrink={true}
        >
          {t('Arguments')}
          <IconButton
            onClick={() => {
              append({ type: 'text', key: '', default_value: '' });
            }}
            aria-haspopup="true"
            size="medium"
            style={{ marginTop: -2 }}
            color="primary"
          >
            <ControlPointOutlined />
          </IconButton>
          {errors.payload_arguments && (
            <div className={classes.errorColor}>
              {errors.payload_arguments?.message}
            </div>
          )}
        </InputLabel>
      </div>
      <List style={{ marginTop: -20 }}>
        {fields.map((field, index) => {
          return (
            <ListItem
              key={`payload_arguments_list_${index}`}
              classes={{ root: classes.tuple }}
              divider={false}
            >
              <SelectField
                variant="standard"
                name={`payload_arguments.${index}.type` as const}
                control={control}
                fullWidth={true}
                label={t('Type')}
                style={{ marginRight: 20 }}
              >
                <MenuItem key="text" value="text">
                  <ListItemText>{t('Text')}</ListItemText>
                </MenuItem>
              </SelectField>
              <TextField
                variant="standard"
                fullWidth={true}
                label={t('Key')}
                style={{ marginRight: 20 }}
                inputProps={register(`payload_arguments.${index}.key` as const)}
                error={!!errors.payload_arguments?.[index]?.key}
              />
              <TextField
                variant="standard"
                fullWidth={true}
                label={t('Default Value')}
                style={{ marginRight: 20 }}
                inputProps={register(`payload_arguments.${index}.default_value` as const)}
                error={!!errors.payload_arguments?.[index]?.default_value}
              />
              <IconButton
                onClick={() => remove(index)}
                aria-haspopup="true"
                size="small"
                color="primary"
              >
                <DeleteOutlined />
              </IconButton>
            </ListItem>
          );
        })}
      </List>

      <div style={{ marginTop: 20 }}>
        <InputLabel
          variant="standard"
          shrink={true}
        >
          {t('Prerequisites')}
          <IconButton
            onClick={() => {
              prerequisitesAppend({
                executor: 'psh',
                get_command: '',
                check_command: '',
              });
            }}
            aria-haspopup="true"
            size="medium"
            style={{ marginTop: -2 }}
            color="primary"
          >
            <ControlPointOutlined />
          </IconButton>
          {errors.payload_prerequisites && (
            <div className={classes.errorColor}>
              {errors.payload_prerequisites?.message}
            </div>
          )}
        </InputLabel>
      </div>
      <List style={{ marginTop: -20 }}>
        {prerequisitesFields.map((_prerequisitesField, prerequisitesIndex) => {
          return (
            <ListItem
              key={`payload_prerequisites_${prerequisitesIndex}`}
              classes={{ root: classes.tuple }}
              divider={false}
            >
              <SelectField
                variant="standard"
                label={t('Command executor')}
                name={`payload_prerequisites.${prerequisitesIndex}.executor` as const}
                control={control}
                fullWidth={true}
                style={{ marginRight: 20 }}
              >
                <MenuItem value="psh">
                  {t('PowerShell')}
                </MenuItem>
                <MenuItem value="cmd">
                  {t('Command Prompt')}
                </MenuItem>
                <MenuItem value="bash">
                  {t('Bash')}
                </MenuItem>
                <MenuItem value="sh">
                  {t('Sh')}
                </MenuItem>
              </SelectField>
              <TextField
                variant="standard"
                fullWidth={true}
                label={t('Get command')}
                style={{ marginRight: 20 }}
                inputProps={register(`payload_prerequisites.${prerequisitesIndex}.get_command` as const)}
                error={!!errors.payload_prerequisites?.[prerequisitesIndex]?.get_command}
              />
              <TextField
                variant="standard"
                fullWidth={true}
                label={t('Check command')}
                style={{ marginRight: 20 }}
                inputProps={register(`payload_prerequisites.${prerequisitesIndex}.check_command` as const)}
                error={!!errors.payload_prerequisites?.[prerequisitesIndex]?.check_command}
              />
              <IconButton
                onClick={() => prerequisitesRemove(prerequisitesIndex)}
                aria-haspopup="true"
                size="small"
                color="primary"
              >
                <DeleteOutlined />
              </IconButton>
            </ListItem>
          );
        })}
      </List>

      <SelectField
        variant="standard"
        label={t('Cleanup executor')}
        name="payload_cleanup_executor"
        control={control}
        fullWidth={true}
        style={{ marginTop: 10 }}
        error={!!errors.payload_cleanup_executor}
        helperText={errors.payload_cleanup_executor?.message}
      >
        <MenuItem value="psh">
          {t('PowerShell')}
        </MenuItem>
        <MenuItem value="cmd">
          {t('Command Prompt')}
        </MenuItem>
        <MenuItem value="bash">
          {t('Bash')}
        </MenuItem>
        <MenuItem value="sh">
          {t('Sh')}
        </MenuItem>
      </SelectField>
      <TextField
        multiline
        fullWidth
        rows={3}
        label={t('Cleanup command')}
        style={{ marginTop: 20 }}
        error={!!errors.payload_cleanup_command}
        helperText={errors.payload_cleanup_command?.message}
        inputProps={register('payload_cleanup_command')}
      />
      <Controller
        control={control}
        name="payload_attack_patterns"
        render={({ field: { onChange, value } }) => (
          <AttackPatternField
            label={t('Attack patterns')}
            fieldValues={value ?? []}
            onChange={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="payload_tags"
        render={({ field: { onChange, value } }) => (
          <TagField
            name="payload_tags"
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
          disabled={isSubmitting || !isDirty}
        >
          {editing ? t('Update') : t('Create')}
        </Button>
      </div>

    </form>
  );
};

export default PayloadForm;
