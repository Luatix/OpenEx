import React, { CSSProperties, FunctionComponent } from 'react';
import { Autocomplete as MuiAutocomplete, Box, TextField } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { FieldErrors } from 'react-hook-form';
import { FileOutline } from 'mdi-material-ui';
import { useAppDispatch } from '../../utils/hooks';
import useDataLoader from '../../utils/hooks/useDataLoader';
import type { Document } from '../../utils/api-types';
import { useHelper } from '../../store';
import type { DocumentHelper } from '../../actions/helper';
import { fetchDocuments } from '../../actions/Document';

const useStyles = makeStyles(() => ({
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
  name: string;
  label: string;
  fieldValue: string;
  fieldOnChange: (value: string) => void;
  errors: FieldErrors;
  style: CSSProperties;
}

const DocumentField: FunctionComponent<Props> = ({
  name,
  label,
  fieldValue,
  fieldOnChange,
  errors,
  style,
}) => {
  const classes = useStyles();

  // Fetching data
  const { documents }: { documents: [Document] } = useHelper((helper: DocumentHelper) => ({
    documents: helper.getDocuments(),
  }));
  const dispatch = useAppDispatch();
  useDataLoader(() => {
    dispatch(fetchDocuments());
  });

  // Form
  const documentsOptions = documents.map(
    (n) => ({
      id: n.document_id,
      label: n.document_name,
    }),
  );
  const valueResolver = () => {
    return documentsOptions.filter((document) => fieldValue === document.id).at(0);
  };

  return (
    <div style={{ position: 'relative' }}>
      <MuiAutocomplete
        value={valueResolver()}
        size="small"
        multiple={false}
        selectOnFocus={true}
        autoHighlight={true}
        clearOnBlur={false}
        clearOnEscape={false}
        options={documentsOptions}
        onChange={(_, value) => {
          fieldOnChange(value?.id ?? '');
        }}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id}>
            <div className={classes.icon}>
              <FileOutline />
            </div>
            <div className={classes.text}>{option.label}</div>
          </Box>
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            variant="standard"
            fullWidth
            style={style}
            error={!!errors[name]}
          />
        )}
        classes={{ clearIndicator: classes.autoCompleteIndicator }}
      />
    </div>
  );
};

export default DocumentField;
