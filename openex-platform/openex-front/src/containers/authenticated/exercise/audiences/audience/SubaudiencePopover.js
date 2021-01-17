import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as R from 'ramda';
import { injectIntl } from 'react-intl';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { MoreVert } from '@material-ui/icons';
import Slide from '@material-ui/core/Slide';
import { T } from '../../../../../components/I18n';
import { i18nRegister } from '../../../../../utils/Messages';
import {
  updateSubaudience,
  selectSubaudience,
  downloadExportSubaudience,
  deleteSubaudience,
} from '../../../../../actions/Subaudience';
import SubaudienceForm from './SubaudienceForm';
import { submitForm } from '../../../../../utils/Action';

i18nRegister({
  fr: {
    'Update the sub-audience': 'Modifier la sous-audience',
    'Do you want to delete this sub-audience?':
      'Souhaitez-vous supprimer cette sous-audience ?',
    'Do you want to disable this sub-audience?':
      'Souhaitez-vous désactiver cette sous-audience ?',
    'Do you want to enable this sub-audience?':
      'Souhaitez-vous activer cette sous-audience ?',
    Disable: 'Désactiver',
    Enable: 'Activer',
  },
});

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

class SubaudiencePopover extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openDelete: false,
      openEdit: false,
      openEnable: false,
      openDisable: false,
      openPopover: false,
    };
  }

  handlePopoverOpen(event) {
    event.stopPropagation();
    this.setState({ anchorEl: event.currentTarget });
  }

  handlePopoverClose() {
    this.setState({ anchorEl: null });
  }

  handleOpenEdit() {
    this.setState({ openEdit: true });
    this.handlePopoverClose();
  }

  handleCloseEdit() {
    this.setState({ openEdit: false });
  }

  onSubmitEdit(data) {
    return this.props
      .updateSubaudience(
        this.props.exerciseId,
        this.props.audienceId,
        this.props.subaudience.subaudience_id,
        data,
      )
      .then(() => this.handleCloseEdit());
  }

  handleOpenDelete() {
    this.setState({ openDelete: true });
    this.handlePopoverClose();
  }

  handleCloseDelete() {
    this.setState({ openDelete: false });
  }

  submitDelete() {
    this.props
      .deleteSubaudience(
        this.props.exerciseId,
        this.props.audienceId,
        this.props.subaudience.subaudience_id,
      )
      .then(() => {
        this.props.selectSubaudience(
          this.props.exerciseId,
          this.props.audienceId,
          undefined,
        );
      });
    this.handleCloseDelete();
  }

  handleOpenDisable() {
    this.setState({ openDisable: true });
    this.handlePopoverClose();
  }

  handleCloseDisable() {
    this.setState({ openDisable: false });
  }

  submitDisable() {
    this.props.updateSubaudience(
      this.props.exerciseId,
      this.props.audienceId,
      this.props.subaudience.subaudience_id,
      { subaudience_enabled: false },
    );
    this.handleCloseDisable();
  }

  handleOpenEnable() {
    this.setState({ openEnable: true });
    this.handlePopoverClose();
  }

  handleCloseEnable() {
    this.setState({ openEnable: false });
  }

  submitEnable() {
    this.props.updateSubaudience(
      this.props.exerciseId,
      this.props.audienceId,
      this.props.subaudience.subaudience_id,
      { subaudience_enabled: true },
    );
    this.handleCloseEnable();
  }

  t(id) {
    return this.props.intl.formatMessage({ id });
  }

  handleDownloadAudience() {
    this.props.downloadExportSubaudience(
      this.props.exerciseId,
      this.props.audienceId,
      this.props.subaudience.subaudience_id,
    );
    this.handlePopoverClose();
  }

  render() {
    const subaudienceEnabled = R.propOr(
      true,
      'subaudience_enabled',
      this.props.subaudience,
    );
    const subaudienceIsUpdatable = R.propOr(
      true,
      'user_can_update',
      this.props.subaudience,
    );
    const subaudienceIsDeletable = R.propOr(
      true,
      'user_can_delete',
      this.props.subaudience,
    );
    return (
      <div>
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
            onClick={this.handleOpenEdit.bind(this)}
            disabled={!subaudienceIsUpdatable}
          >
            <T>Edit</T>
          </MenuItem>
          {subaudienceEnabled ? (
            <MenuItem
              onClick={this.handleOpenDisable.bind(this)}
              disabled={!subaudienceIsUpdatable}
            >
              <T>Disable</T>
            </MenuItem>
          ) : (
            <MenuItem
              onClick={this.handleOpenEnable.bind(this)}
              disabled={!subaudienceIsUpdatable}
            >
              <T>Enable</T>
            </MenuItem>
          )}
          <MenuItem onClick={this.handleDownloadAudience.bind(this)}>
            <T>Export to XLS</T>
          </MenuItem>
          <MenuItem
            onClick={this.handleOpenDelete.bind(this)}
            disabled={!subaudienceIsDeletable}
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
              <T>Do you want to delete this sub-audience?</T>
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
        <Dialog
          open={this.state.openEdit}
          TransitionComponent={Transition}
          onClose={this.handleCloseEdit.bind(this)}
        >
          <DialogTitle>
            <T>Update the sub-audience</T>
          </DialogTitle>
          <DialogContent>
            <SubaudienceForm
              initialValues={R.pick(
                ['subaudience_name'],
                this.props.subaudience,
              )}
              onSubmit={this.onSubmitEdit.bind(this)}
            />
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={this.handleCloseEdit.bind(this)}
            >
              <T>Cancel</T>
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => submitForm('subaudienceForm')}
            >
              <T>Update</T>
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={this.state.openDisable}
          TransitionComponent={Transition}
          onClose={this.handleCloseDisable.bind(this)}
        >
          <DialogContent>
            <DialogContentText>
              <T>Do you want to disable this sub-audience?</T>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={this.handleCloseDisable.bind(this)}
            >
              <T>Cancel</T>
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={this.submitDisable.bind(this)}
            >
              <T>Disable</T>
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={this.state.openEnable}
          TransitionComponent={Transition}
          onClose={this.handleCloseEnable.bind(this)}
        >
          <DialogContent>
            <DialogContentText>
              <T>Do you want to enable this sub-audience?</T>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={this.handleCloseEnable.bind(this)}
            >
              <T>Cancel</T>
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={this.submitEnable.bind(this)}
            >
              <T>Enable</T>
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

SubaudiencePopover.propTypes = {
  exerciseId: PropTypes.string,
  audienceId: PropTypes.string,
  deleteSubaudience: PropTypes.func,
  updateSubaudience: PropTypes.func,
  selectSubaudience: PropTypes.func,
  downloadExportSubaudience: PropTypes.func,
  audience: PropTypes.object,
  subaudience: PropTypes.object,
  subaudiences: PropTypes.array,
  children: PropTypes.node,
  intl: PropTypes.object,
};

export default connect(null, {
  updateSubaudience,
  selectSubaudience,
  downloadExportSubaudience,
  deleteSubaudience,
})(injectIntl(SubaudiencePopover));
