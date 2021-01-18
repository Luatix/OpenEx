import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as R from 'ramda';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Slide from '@material-ui/core/Slide';
import { withStyles } from '@material-ui/core/styles';
import { MoreVert } from '@material-ui/icons';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { T } from '../../../../../components/I18n';
import { i18nRegister } from '../../../../../utils/Messages';
import { redirectToChecks } from '../../../../../actions/Application';
import { deleteDryrun } from '../../../../../actions/Dryrun';

const styles = () => ({
  container: {
    float: 'left',
    marginTop: -8,
  },
});

i18nRegister({
  fr: {
    'Do you want to delete this dryrun?':
      'Souhaitez-vous supprimer cette simulation ?',
  },
});

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

class DryrunPopover extends Component {
  constructor(props) {
    super(props);
    this.state = { openDelete: false, openPopover: false };
  }

  handlePopoverOpen(event) {
    event.stopPropagation();
    this.setState({ anchorEl: event.currentTarget });
  }

  handlePopoverClose() {
    this.setState({ anchorEl: null });
  }

  handleOpenDelete() {
    this.setState({ openDelete: true });
    this.handlePopoverClose();
  }

  handleCloseDelete() {
    this.setState({ openDelete: false });
  }

  submitDelete() {
    if (this.props.listenDeletionCall) this.props.listenDeletionCall();
    this.props
      .deleteDryrun(this.props.exerciseId, this.props.dryrun.dryrun_id)
      .then(() => this.props.redirectToChecks(this.props.exerciseId));
  }

  render() {
    const { classes } = this.props;
    const dryrunIsDeletable = R.propOr(
      true,
      'user_can_update',
      this.props.dryrun,
    );
    return (
      <div className={classes.container}>
        <IconButton
          onClick={this.handlePopoverOpen.bind(this)}
          aria-haspopup="true"
        >
          <MoreVert />
        </IconButton>
        <Menu
          anchorEl={this.state.anchorEl}
          open={Boolean(this.state.anchorEl)}
          onClose={this.handlePopoverClose.bind(this)}
          style={{ marginTop: 50 }}
        >
          <MenuItem
            onClick={this.handleOpenDelete.bind(this)}
            disabled={!dryrunIsDeletable}
          >
            <T>Delete</T>
          </MenuItem>
        </Menu>
        <Dialog
          open={this.state.openDelete}
          TransitionComponent={Transition}
          onClose={this.handleCloseDelete.bind(this)}
        >
          <DialogContent>
            <DialogContentText>
              <T>Do you want to delete this dryrun?</T>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={this.handleCloseDelete.bind(this)}
            >
              <T>Cancel</T>
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={this.submitDelete.bind(this)}
            >
              <T>Delete</T>
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

DryrunPopover.propTypes = {
  exerciseId: PropTypes.string,
  deleteDryrun: PropTypes.func,
  redirectToChecks: PropTypes.func,
  listenDeletionCall: PropTypes.func,
  dryrun: PropTypes.object,
};

export default R.compose(
  connect(null, { deleteDryrun, redirectToChecks }),
  withStyles(styles),
)(DryrunPopover);
