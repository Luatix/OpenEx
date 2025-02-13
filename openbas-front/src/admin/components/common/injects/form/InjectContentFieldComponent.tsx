import { ControlPointOutlined, DeleteOutlined } from '@mui/icons-material';
import { Alert, IconButton, InputLabel, List, ListItem, ListItemText, MenuItem } from '@mui/material';
import { useEffect, useState } from 'react';
import { type Control, type FieldValues, type UseFormRegisterReturn, useWatch } from 'react-hook-form';

import FieldArray from '../../../../../components/fields/FieldArray';
import RichTextField from '../../../../../components/fields/RichTextField';
import SelectField from '../../../../../components/fields/SelectField';
import SwitchField from '../../../../../components/fields/SwitchField';
import TextField from '../../../../../components/fields/TextField';
import { useFormatter } from '../../../../../components/i18n';
import { type Document } from '../../../../../utils/api-types';

type choiceItem = {
  label: string;
  value: string;
  information: string;
};
type InjectField = {
  key: string;
  richText: boolean;
  cardinality?: string;
  mandatory: boolean;
  defaultValue: string | string[];
  choices: Record<string, string> | choiceItem[];
  label: string;
  contractAttachment: { key: string; label: string }[];
  type: 'textarea' | 'text' | 'select' | 'number' | 'tuple' | 'checkbox' | 'dependency-select' | 'choice';
  dependencyField: string;
};

interface Props {
  control: Control;
  attachedDocs: Document[];
  field: InjectField;
  register: (name: string) => UseFormRegisterReturn;
  values: FieldValues;
  readOnly: boolean;
  onSelectOrCheckboxFieldChange: () => void;
}

const InjectContentFieldComponent = ({
  control,
  register,
  field,
  values,
  attachedDocs,
  readOnly,
  onSelectOrCheckboxFieldChange,
}: Props) => {
  const { t } = useFormatter();
  const selectedValue = useWatch({ control, name: field.key });
  const [informationToDisplay, setInformationToDisplay] = useState<string>('');
  let fieldType: InjectField['type'] | 'richText' = field.type;
  if (field.type == 'textarea' && field.richText) {
    fieldType = 'richText';
  }

  useEffect(() => {
    const findInformation = (value: string) => (field.choices as choiceItem[]).find(c => c.value === value)?.information || '';
    if (!selectedValue && field.type === 'choice') {
      setInformationToDisplay(findInformation(values[field.key]) ?? findInformation(field.defaultValue[0]));
    }
    if (selectedValue && field.type === 'choice') {
      setInformationToDisplay(findInformation(selectedValue));
    }
    if (fieldType === 'checkbox' || fieldType === 'select') {
      onSelectOrCheckboxFieldChange();
    }
  }, [selectedValue]);

  const fieldComponent = () => {
    switch (fieldType) {
      case 'richText':
        return (
          <RichTextField
            key={field.key}
            name={field.key}
            label={`${t(field.label)}${field.mandatory ? '*' : ''}`}
            style={{ marginTop: 20, height: 250 }}
            disabled={readOnly}
            askAi={true}
            inInject={true}
            control={control}
          />
        );
      case 'number':
        return (
          <TextField
            variant="standard"
            key={field.key}
            inputProps={register(field.key)}
            fullWidth={true}
            type="number"
            label={`${t(field.label)}${field.mandatory ? '*' : ''}`}
            style={{ marginTop: 20 }}
            disabled={readOnly}
            control={control}
          />
        );
      case 'checkbox':
        return (
          <SwitchField
            key={field.key}
            name={field.key}
            label={`${t(field.label)}${field.mandatory ? '*' : ''}`}
            style={{ marginTop: 20 }}
            disabled={readOnly}
            control={control}
          />
        );
      case 'tuple': {
        return (
          <div key={field.key}>
            <FieldArray
              name={field.key}
              control={control}
              renderLabel={(append) => {
                return (
                  <div style={{ marginTop: 20 }}>
                    <InputLabel
                      variant="standard"
                      shrink={true}
                      disabled={readOnly}
                    >
                      {`${t(field.label)}${field.mandatory ? '*' : ''}`}
                      {field.cardinality === 'n' && (
                        <IconButton
                          onClick={() => append({
                            type: 'text',
                            key: '',
                            value: '',
                          })}
                          aria-haspopup="true"
                          size="medium"
                          style={{ marginTop: -2 }}
                          disabled={readOnly}
                          color="primary"
                        >
                          <ControlPointOutlined />
                        </IconButton>
                      )}
                    </InputLabel>
                  </div>
                );
              }}
              renderField={(name, index, remove) => {
                return (
                  <List key={name.id} style={{ marginTop: -20 }}>
                    <ListItem
                      key={`${field.key}_list_${index}`}
                      sx={{ marginTop: '5px', paddingTop: 0, paddingLeft: 0 }}
                      divider={false}
                    >
                      <SelectField
                        variant="standard"
                        name={`${field.key}.${index}.type`}
                        fullWidth={true}
                        label={t('Type')}
                        style={{ marginRight: 20 }}
                        disabled={readOnly}
                        control={control}
                      >
                        <MenuItem key="text" value="text">
                          <ListItemText>{t('Text')}</ListItemText>
                        </MenuItem>
                        {field.contractAttachment && (
                          <MenuItem
                            key="attachment"
                            value="attachment"
                          >
                            <ListItemText>
                              {t('Attachment')}
                            </ListItemText>
                          </MenuItem>
                        )}
                      </SelectField>
                      <TextField
                        variant="standard"
                        fullWidth={true}
                        label={t('Key')}
                        style={{ marginRight: 20 }}
                        disabled={readOnly}
                        inputProps={register(`${field.key}.${index}.key`)}
                        control={control}
                      />
                      {values
                      && values[field.key]
                      && values[field.key][index]
                      && values[field.key][index].type === 'attachment' ? (
                            <TextField
                              variant="standard"
                              fullWidth={true}
                              label={t('Value')}
                              style={{ marginRight: 20 }}
                              disabled={readOnly}
                              inputProps={register(`${field.key}.${index}.value`)}
                              control={control}
                            >
                              {attachedDocs.map(doc => (
                                <MenuItem
                                  key={doc.document_id}
                                  value={doc.document_id}
                                >
                                  <ListItemText>
                                    {doc.document_name}
                                  </ListItemText>
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : (
                            <TextField
                              variant="standard"
                              fullWidth={true}
                              label={t('Value')}
                              style={{ marginRight: 20 }}
                              disabled={readOnly}
                              inputProps={register(`${field.key}.${index}.value`)}
                              control={control}
                            />
                          )}
                      {field.cardinality === 'n' && (
                        <IconButton
                          onClick={() => remove(index)}
                          aria-haspopup="true"
                          size="small"
                          disabled={readOnly}
                          color="primary"
                        >
                          <DeleteOutlined />
                        </IconButton>
                      )}
                    </ListItem>
                  </List>
                );
              }}
            />
          </div>
        );
      }
      case 'select': {
        const choices = field.choices as Record<string, string>;
        const renderMultipleValuesFct = (v: string[]) => v.map(a => (choices[a])).join(', ');
        const renderSingleValueFct = (v: string) => (t(choices[v] || 'Unknown'));
        const renderValueFct = (v: string | string[]) =>
          Array.isArray(v) ? renderMultipleValuesFct(v) : renderSingleValueFct(v);

        return (
          <SelectField
            variant="standard"
            label={`${t(field.label)}${field.mandatory ? '*' : ''}`}
            key={field.key}
            multiple={field.cardinality === 'n'}
            renderValue={(v: string | string[]) => renderValueFct(v)}
            name={field.key}
            fullWidth={true}
            style={{ marginTop: 20 }}
            control={control}
            disabled={readOnly}
            defaultValue={field.defaultValue}
          >
            {Object.entries(choices)
              .sort((a, b) => a[1].localeCompare(b[1]))
              .map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  <ListItemText>
                    {t(v || 'Unknown')}
                  </ListItemText>
                </MenuItem>
              ))}
          </SelectField>
        );
      }
      case 'choice': {
        const choices = field.choices as choiceItem[];
        const renderMultipleValuesFct = (v: string[]) => choices.filter(c => v.includes(c.value)).map(c => c.label).join(', ');
        const renderSingleValueFct = (v: string) => (t(choices.find(c => c.value === v)?.label || 'Unknown'));
        const renderValueFct = (v: string | string[]) =>
          Array.isArray(v) ? renderMultipleValuesFct(v) : renderSingleValueFct(v);

        return (
          <SelectField
            variant="standard"
            label={`${t(field.label)}${field.mandatory ? '*' : ''}`}
            key={field.key}
            multiple={field.cardinality === 'n'}
            renderValue={(v: string | string[]) => renderValueFct(v)}
            name={field.key}
            fullWidth={true}
            style={{ marginTop: 20 }}
            control={control}
            disabled={readOnly}
            defaultValue={field.defaultValue}
          >
            {choices.map(choice => (
              <MenuItem key={choice.value} value={choice.value}>{choice.label}</MenuItem>
            ))}

          </SelectField>
        );
      }
      case 'dependency-select': {
        const depValue = values[field.dependencyField];
        const choices = ((field.choices as Record<string, string>)[depValue]) as unknown as Record<string, string> ?? {};
        const renderMultipleValuesFct = (v: string[]) => v.map(a => choices[a]).join(', ');
        const renderSingleValueFct = (v: string) => (t(choices[v] || 'Unknown'));
        const renderValueFct = (v: string | string[]) =>
          Array.isArray(v) ? renderMultipleValuesFct(v) : renderSingleValueFct(v);

        return (
          <SelectField
            variant="standard"
            label={`${t(field.label)}${field.mandatory ? '*' : ''}`}
            key={field.key}
            multiple={field.cardinality === 'n'}
            renderValue={(v: string | string[]) => renderValueFct(v)}
            disabled={readOnly}
            name={field.key}
            fullWidth={true}
            control={control}
            style={{ marginTop: 20 }}
          >
            {Object.entries(choices)
              .sort((a, b) => a[1].localeCompare(b[1]))
              .map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  <ListItemText>
                    {t(v || 'Unknown')}
                  </ListItemText>
                </MenuItem>
              ))}
          </SelectField>
        );
      }
      default:
        return (
          <TextField
            variant="standard"
            key={field.key}
            inputProps={register(field.key)}
            fullWidth={true}
            multiline={field.type == 'textarea'}
            rows={field.type == 'textarea' ? 10 : 1}
            label={`${t(field.label)}${field.mandatory ? '*' : ''}`}
            style={{ marginTop: 20 }}
            disabled={readOnly}
            control={control}
          />
        );
    }
  };

  return (
    <>
      { fieldComponent() }
      { informationToDisplay && <Alert sx={{ marginTop: '10px' }} severity="warning">{informationToDisplay}</Alert>}
    </>
  );
};

export default InjectContentFieldComponent;
