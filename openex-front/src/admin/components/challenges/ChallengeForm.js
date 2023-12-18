import React, { useState } from 'react';
import { Form } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import { Button, ListItem, ListItemIcon, List, MenuItem, Grid, Typography, ListItemText, ListItemSecondaryAction, IconButton } from '@mui/material';
import { ArrowDropDownOutlined, ArrowDropUpOutlined, AttachmentOutlined, ControlPointOutlined, DeleteOutlined } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { useDispatch } from 'react-redux';
import TextField from '../../../components/TextField';
import { useFormatter } from '../../../components/i18n';
import Select from '../../../components/Select';
import MarkDownField from '../../../components/MarkDownField';
import DocumentType from '../documents/DocumentType';
import ItemTags from '../../../components/ItemTags';
import DocumentPopover from '../documents/DocumentPopover';
import { useHelper } from '../../../store';
import useDataLoader from '../../../utils/ServerSideEvent';
import { fetchExercises } from '../../../actions/Exercise';
import { fetchDocuments } from '../../../actions/Document';
import ChallengeAddDocuments from './ChallengeAddDocuments';
import TagField from '../../../components/TagField';

const useStyles = makeStyles(() => ({
  itemHead: {
    paddingLeft: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
  bodyItem: {
    height: '100%',
    fontSize: 13,
  },
  tuple: {
    marginTop: 5,
    paddingTop: 0,
    paddingLeft: 0,
  },
}));

const inlineStylesHeaders = {
  iconSort: {
    position: 'absolute',
    margin: '0 0 0 5px',
    padding: 0,
    top: '0px',
  },
  document_name: {
    float: 'left',
    width: '35%',
    fontSize: 12,
    fontWeight: '700',
  },
  document_type: {
    float: 'left',
    width: '20%',
    fontSize: 12,
    fontWeight: '700',
  },
  document_tags: {
    float: 'left',
    width: '30%',
    fontSize: 12,
    fontWeight: '700',
  },
};

const inlineStyles = {
  document_name: {
    float: 'left',
    width: '35%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  document_type: {
    float: 'left',
    width: '20%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  document_tags: {
    float: 'left',
    width: '30%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

const ChallengeForm = (props) => {
  const classes = useStyles();
  const { t } = useFormatter();
  const dispatch = useDispatch();
  const { onSubmit, handleClose, initialValues, editing, documentsIds } = props;
  const [documentsSortBy, setDocumentsSortBy] = useState('document_name');
  const [documentsOrderAsc, setDocumentsOrderAsc] = useState(true);
  const [documents, setDocuments] = useState(documentsIds || []);
  const handleAddDocuments = (docsIds) => setDocuments([...documents, ...docsIds]);
  const handleRemoveDocument = (docId) => setDocuments(documents.filter((n) => n !== docId));
  // Functions
  const validate = (values) => {
    const errors = {};
    const requiredFields = ['challenge_name'];
    requiredFields.forEach((field) => {
      if (!values[field]) {
        errors[field] = t('This field is required.');
      }
    });
    return errors;
  };
  const required = (value) => (value ? undefined : t('This field is required.'));
  const requiredArray = (value) => (value && value.length > 0 ? undefined : t('This field is required.'));
  const { exercisesMap, documentsMap, tagsMap } = useHelper((helper) => ({
    exercisesMap: helper.getExercisesMap(),
    documentsMap: helper.getDocumentsMap(),
    tagsMap: helper.getTagsMap(),
  }));
  useDataLoader(() => {
    dispatch(fetchExercises());
    dispatch(fetchDocuments());
  });
  const documentsReverseBy = (field) => {
    setDocumentsSortBy(field);
    setDocumentsOrderAsc(!documentsSortBy);
  };
  const documentsSortHeader = (field, label, isSortable) => {
    const sortComponent = documentsOrderAsc ? (
      <ArrowDropDownOutlined style={inlineStylesHeaders.iconSort} />
    ) : (
      <ArrowDropUpOutlined style={inlineStylesHeaders.iconSort} />
    );
    if (isSortable) {
      return (
        <div
          style={inlineStylesHeaders[field]}
          onClick={() => documentsReverseBy(field)}
        >
          <span>{t(label)}</span>
          {documentsSortBy === field ? sortComponent : ''}
        </div>
      );
    }
    return (
      <div style={inlineStylesHeaders[field]}>
        <span>{t(label)}</span>
      </div>
    );
  };
  const submitForm = (data) => {
    return onSubmit({ ...data, challenge_documents: documents });
  };
  // Rendering
  return (
    <Form
      keepDirtyOnReinitialize={true}
      initialValues={initialValues}
      onSubmit={submitForm}
      validate={validate}
      mutators={{
        ...arrayMutators,
        setValue: ([field, value], state, { changeValue }) => {
          changeValue(state, field, () => value);
        },
      }}
    >
      {({ form, handleSubmit, submitting, errors, values }) => (
        <form id="challengeForm" onSubmit={handleSubmit}>
          <TextField
            variant="standard"
            name="challenge_name"
            fullWidth={true}
            label={t('Name')}
          />
          <TextField
            variant="standard"
            name="challenge_category"
            fullWidth={true}
            label={t('Category')}
            style={{ marginTop: 20 }}
          />
          <MarkDownField
            name="challenge_content"
            label={t('Content')}
            fullWidth={true}
            style={{ marginTop: 20 }}
          />
          <Grid container={true} spacing={3} style={{ marginTop: 0 }}>
            <Grid item={true} xs={6}>
              <TextField
                variant="standard"
                name="challenge_score"
                fullWidth={true}
                type="number"
                label={t('Score')}
              />
            </Grid>
            <Grid item={true} xs={6}>
              <TextField
                variant="standard"
                name="challenge_max_attempts"
                fullWidth={true}
                type="number"
                label={t('Max number of attempts')}
              />
            </Grid>
          </Grid>
          <TagField
            name="challenge_tags"
            label={t('Tags')}
            values={values}
            setFieldValue={form.mutators.setValue}
            style={{ marginTop: 20 }}
          />
          <Typography variant="h2" style={{ marginTop: 30 }}>
            {t('Documents')}
          </Typography>
          <List>
            <ListItem
              classes={{ root: classes.itemHead }}
              divider={false}
              style={{ paddingTop: 0 }}
            >
              <ListItemIcon>
                <span
                  style={{
                    padding: '0 8px 0 8px',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  &nbsp;
                </span>
              </ListItemIcon>
              <ListItemText
                primary={
                  <div>
                    {documentsSortHeader('document_name', 'Name', true)}
                    {documentsSortHeader('document_type', 'Type', true)}
                    {documentsSortHeader('document_tags', 'Tags', true)}
                  </div>
                }
              />
              <ListItemSecondaryAction>&nbsp;</ListItemSecondaryAction>
            </ListItem>
            {documents.map((documentId) => {
              const document = documentsMap[documentId] || {};
              return (
                <ListItem
                  key={document.document_id}
                  classes={{ root: classes.item }}
                  divider={true}
                  button={true}
                  component="a"
                  href={`/api/documents/${document.document_id}/file`}
                >
                  <ListItemIcon>
                    <AttachmentOutlined />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.document_name}
                        >
                          {document.document_name}
                        </div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.document_type}
                        >
                          <DocumentType
                            type={document.document_type}
                            variant="list"
                          />
                        </div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.document_tags}
                        >
                          <ItemTags
                            variant="list"
                            tags={document.document_tags}
                          />
                        </div>
                      </div>
                    }
                  />
                  <ListItemSecondaryAction>
                    <DocumentPopover
                      document={document}
                      exercisesMap={exercisesMap}
                      tagsMap={tagsMap}
                      onRemoveDocument={handleRemoveDocument}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
            <ChallengeAddDocuments
              challengeDocumentsIds={documents}
              handleAddDocuments={handleAddDocuments}
            />
          </List>
          <FieldArray name="challenge_flags" validate={requiredArray}>
            {({ fields }) => (
              <div style={{ marginTop: 30 }}>
                <Typography variant="h2" style={{ float: 'left' }}>
                  {t('Flags')}
                </Typography>
                <IconButton
                  onClick={() => fields.push({ flag_type: 'VALUE', flag_value: '' })
                  }
                  size="small"
                  color="primary"
                  style={{ float: 'left', margin: '-8px 0 0 10px' }}
                >
                  <ControlPointOutlined />
                </IconButton>
                <div className="clearfix" />
                <List>
                  {fields.map((name, index) => (
                    <ListItem
                      key={`flag_index_${index}`}
                      classes={{ root: classes.tuple }}
                      divider={false}
                    >
                      <Select
                        variant="standard"
                        name={`${name}.flag_type`}
                        label={t('Flag type')}
                        fullWidth={true}
                        style={{ marginRight: 20 }}
                      >
                        <MenuItem key="VALUE" value="VALUE">
                          {t('Text')}
                        </MenuItem>
                        <MenuItem key="VALUE_CASE" value="VALUE_CASE">
                          {t('Text (case-sensitive)')}
                        </MenuItem>
                        <MenuItem key="REGEXP" value="REGEXP">
                          {t('Regular expression')}
                        </MenuItem>
                      </Select>
                      <TextField
                        variant="standard"
                        name={`${name}.flag_value`}
                        validate={required}
                        fullWidth={true}
                        label={t('Value')}
                        style={{ marginRight: 20 }}
                      />
                      <IconButton
                        onClick={() => fields.remove(index)}
                        aria-haspopup="true"
                        size="small"
                        color="primary"
                      >
                        <DeleteOutlined />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </div>
            )}
          </FieldArray>
          {errors.challenge_flags && errors.challenge_flags.length === 0 && (
            <Typography variant="body2">
              {t('At least one flag is required for a challenge.')}
            </Typography>
          )}
          <div style={{ float: 'right', marginTop: 20 }}>
            <Button
              onClick={handleClose}
              style={{ marginRight: 10 }}
              disabled={submitting}
            >
              {t('Cancel')}
            </Button>
            <Button
              color="secondary"
              type="submit"
              disabled={submitting || Object.keys(errors).length > 0}
            >
              {editing ? t('Update') : t('Create')}
            </Button>
          </div>
        </form>
      )}
    </Form>
  );
};

export default ChallengeForm;
