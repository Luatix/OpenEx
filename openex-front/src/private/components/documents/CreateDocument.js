import React, { useState } from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as R from 'ramda';
import withStyles from '@mui/styles/withStyles';
import Fab from '@mui/material/Fab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { Add, ControlPointOutlined } from '@mui/icons-material';
import ListItem from '@mui/material/ListItem';
import { ListItemIcon } from '@mui/material';
import ListItemText from '@mui/material/ListItemText';
import DocumentForm from './DocumentForm';
import { addDocument, fetchDocument } from '../../../actions/Document';
import inject18n from '../../../components/i18n';
import { Transition } from '../../../utils/Environment';

const styles = (theme) => ({
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 30,
  },
  text: {
    fontSize: 15,
    color: theme.palette.primary.main,
    fontWeight: 500,
  },
});

const CreateDocument = (props) => {
  const {
    classes, t, inline, exerciseId,
  } = props;
  const [open, setOpen] = useState(false);
  const onSubmit = (data) => {
    const inputValues = R.pipe(
      R.assoc('document_tags', R.pluck('id', data.document_tags)),
      R.assoc('document_exercises', R.pluck('id', data.document_exercises)),
    )(data);
    const formData = new FormData();
    formData.append('file', data.document_file[0]);
    const blob = new Blob([JSON.stringify(inputValues)], {
      type: 'application/json',
    });
    formData.append('input', blob);
    return props.addDocument(formData).then((result) => {
      if (result.result) {
        if (props.onCreate) {
          props.onCreate(result.result);
        }
        return setOpen(false);
      }
      return result;
    });
  };
  return (
    <div>
      {inline === true ? (
        <ListItem
          button={true}
          divider={true}
          onClick={() => setOpen(true)}
          color="primary"
        >
          <ListItemIcon color="primary">
            <ControlPointOutlined color="primary" />
          </ListItemIcon>
          <ListItemText
            primary={t('Create a new document')}
            classes={{ primary: classes.text }}
          />
        </ListItem>
      ) : (
        <Fab
          onClick={() => setOpen(true)}
          color="primary"
          aria-label="Add"
          className={classes.createButton}
        >
          <Add />
        </Fab>
      )}
      <Dialog
        open={open}
        TransitionComponent={Transition}
        fullWidth={true}
        maxWidth="md"
        onClose={() => setOpen(false)}
      >
        <DialogTitle>{t('Create a new document')}</DialogTitle>
        <DialogContent>
          <DocumentForm
            onSubmit={onSubmit}
            initialValues={{
              document_tags: [],
              document_exercises: exerciseId ? [exerciseId] : [],
            }}
            handleClose={() => setOpen(false)}
            hideExercises={!!exerciseId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

CreateDocument.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  addDocument: PropTypes.func,
  fetchDocument: PropTypes.func,
  inline: PropTypes.bool,
  exerciseId: PropTypes.string,
};

export default R.compose(
  connect(null, { addDocument, fetchDocument }),
  inject18n,
  withStyles(styles),
)(CreateDocument);
