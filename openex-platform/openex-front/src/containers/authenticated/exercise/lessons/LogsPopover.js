import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { i18nRegister } from '../../../../utils/Messages';
import * as Constants from '../../../../constants/ComponentTypes';
import { Popover } from '../../../../components/Popover';
import { Menu } from '../../../../components/Menu';
import { Icon } from '../../../../components/Icon';
import { MenuItemLink } from '../../../../components/menu/MenuItem';
import { addLog } from '../../../../actions/Log';
import LogForm from './LogForm';

const style = {
  float: 'left',
  marginTop: '-14px',
};

i18nRegister({
  fr: {
    'Add an entry': 'Ajouter une entrée',
  },
});

class LogsPopover extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openCreate: false,
      openPopover: false,
    };
  }

  handlePopoverOpen(event) {
    event.stopPropagation();
    this.setState({
      openPopover: true,
      anchorEl: event.currentTarget,
    });
  }

  handlePopoverClose() {
    this.setState({ anchorEl: null });
  }

  handleOpenCreate() {
    this.setState({ openCreate: true });
    this.handlePopoverClose();
  }

  handleCloseCreate() {
    this.setState({ openCreate: false });
  }

  onSubmitCreate(data) {
    return this.props.addLog(this.props.exerciseId, data);
  }

  submitFormCreate() {
    this.refs.logForm.submit();
  }

  render() {
    const createActions = [
      <Button
        key="cancel"
        label="Cancel"
        primary={true}
        onClick={this.handleCloseCreate.bind(this)}
      />,
      <Button
        key="create"
        label="Create"
        primary={true}
        onClick={this.submitFormCreate.bind(this)}
      />,
    ];

    return (
      <div style={style}>
        <IconButton onClick={this.handlePopoverOpen.bind(this)}>
          <Icon name={Constants.ICON_NAME_NAVIGATION_MORE_VERT} />
        </IconButton>
        <Popover
          open={this.state.openPopover}
          anchorEl={this.state.anchorEl}
          onClose={this.handlePopoverClose.bind(this)}
        >
          <Menu multiple={false}>
            <MenuItemLink
              label="Add an entry"
              onClick={this.handleOpenCreate.bind(this)}
            />
          </Menu>
        </Popover>
        <Dialog
          title="Add an entry"
          modal={false}
          open={this.state.openCreate}
          onClose={this.handleCloseCreate.bind(this)}
          actions={createActions}
        >
          <LogForm
            ref="logForm"
            onSubmit={this.onSubmitCreate.bind(this)}
            onSubmitSuccess={this.handleCloseCreate.bind(this)}
          />
        </Dialog>
      </div>
    );
  }
}

LogsPopover.propTypes = {
  exerciseId: PropTypes.string,
  addLog: PropTypes.func,
};

export default connect(null, { addLog })(LogsPopover);
