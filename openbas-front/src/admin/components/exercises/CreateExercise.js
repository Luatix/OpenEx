import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as R from 'ramda';
import withStyles from '@mui/styles/withStyles';
import { Fab, Dialog, DialogTitle, DialogContent, Slide } from '@mui/material';
import { Add } from '@mui/icons-material';
import ExerciseForm from './ExerciseForm';
import { addExercise, importingExercise } from '../../../actions/Exercise';
import inject18n from '../../../components/i18n';

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

const styles = () => ({
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 30,
  },
});

class CreateExercise extends Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
  }

  handleOpen() {
    this.setState({ open: true });
  }

  handleOpenImport() {
    this.setState({ open: false });
  }

  handleClose() {
    this.setState({ open: false });
  }

  onSubmit(data) {
    const inputValues = R.pipe(
      R.assoc('exercise_tags', R.pluck('id', data.exercise_tags)),
    )(data);
    return this.props
      .addExercise(inputValues)
      .then((result) => (result.result ? this.handleClose() : result));
  }

  render() {
    const { classes, t } = this.props;
    return (
      <div>
        <Fab
          onClick={this.handleOpen.bind(this)}
          color="primary"
          aria-label="Add"
          className={classes.createButton}
        >
          <Add />
        </Fab>
        <Dialog
          open={this.state.open}
          TransitionComponent={Transition}
          onClose={this.handleClose.bind(this)}
          fullWidth={true}
          maxWidth="md"
          PaperProps={{ elevation: 1 }}
        >
          <DialogTitle>{t('Create a new exercise')}</DialogTitle>
          <DialogContent>
            <ExerciseForm
              onSubmit={this.onSubmit.bind(this)}
              initialValues={{ exercise_tags: [] }}
              handleClose={this.handleClose.bind(this)}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }
}

CreateExercise.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  addExercise: PropTypes.func,
  importingExercise: PropTypes.func,
};

export default R.compose(
  connect(null, { addExercise, importingExercise }),
  inject18n,
  withStyles(styles),
)(CreateExercise);
