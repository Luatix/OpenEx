import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as R from 'ramda';
import { T } from '../../../../components/I18n';
import { i18nRegister } from '../../../../utils/Messages';
import * as Constants from '../../../../constants/ComponentTypes';
import { Popover } from '../../../../components/Popover';
import { Menu } from '../../../../components/Menu';
import { Dialog } from '../../../../components/Dialog';
import { IconButton, FlatButton } from '../../../../components/Button';
import { Icon } from '../../../../components/Icon';
import { MenuItemButton } from '../../../../components/menu/MenuItem';
/* eslint-disable */
import { redirectToChecks } from "../../../../actions/Application";
import { deleteComcheck } from "../../../../actions/Comcheck";
/* eslint-enable */

const style = {
  float: 'left',
  marginTop: '-14px',
};

i18nRegister({
  fr: {
    'Do you want to delete this comcheck?':
      'Souhaitez-vous supprimer ce test de communication ?',
  },
});

class ComcheckPopover extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openDelete: false,
      openPopover: false,
    };
  }

  handlePopoverOpen(event) {
    event.preventDefault();
    this.setState({ openPopover: true, anchorEl: event.currentTarget });
  }

  handlePopoverClose() {
    this.setState({ openPopover: false });
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
      .deleteComcheck(this.props.exerciseId, this.props.comcheck.comcheck_id)
      .then(() => this.props.redirectToChecks(this.props.exerciseId));
  }

  render() {
    const comcheckIsDeletable = R.propOr(
      true,
      'user_can_delete',
      this.props.comcheck,
    );

    const deleteActions = [
      <FlatButton
        key="cancel"
        label="Cancel"
        primary={true}
        onClick={this.handleCloseDelete.bind(this)}
      />,
      comcheckIsDeletable ? (
        <FlatButton
          key="delete"
          label="Delete"
          primary={true}
          onClick={this.submitDelete.bind(this)}
        />
      ) : (
        ''
      ),
    ];

    return (
      <div style={style}>
        <IconButton onClick={this.handlePopoverOpen.bind(this)}>
          <Icon name={Constants.ICON_NAME_NAVIGATION_MORE_VERT} />
        </IconButton>
        <Popover
          open={this.state.openPopover}
          anchorEl={this.state.anchorEl}
          onRequestClose={this.handlePopoverClose.bind(this)}
        >
          {comcheckIsDeletable ? (
            <Menu multiple={false}>
              <MenuItemButton
                label="Delete"
                onClick={this.handleOpenDelete.bind(this)}
              />
            </Menu>
          ) : (
            ''
          )}
        </Popover>
        <Dialog
          title="Confirmation"
          modal={false}
          open={this.state.openDelete}
          onRequestClose={this.handleCloseDelete.bind(this)}
          actions={deleteActions}
        >
          <T>Do you want to delete this comcheck?</T>
        </Dialog>
      </div>
    );
  }
}

ComcheckPopover.propTypes = {
  exerciseId: PropTypes.string,
  deleteComcheck: PropTypes.func,
  redirectToChecks: PropTypes.func,
  listenDeletionCall: PropTypes.func,
  comcheck: PropTypes.object,
};

export default connect(null, { deleteComcheck, redirectToChecks })(
  ComcheckPopover,
);
