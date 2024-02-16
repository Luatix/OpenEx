import React, { Component } from 'react';
import * as R from 'ramda';
import { PersonOutlined } from '@mui/icons-material';
import { Box, Dialog, DialogTitle, DialogContent } from '@mui/material';
import withStyles from '@mui/styles/withStyles';
import { connect } from 'react-redux';
import PlayerForm from '../admin/components/teams/players/PlayerForm';
import { fetchUsers, addUser } from '../actions/User';
import { fetchOrganizations } from '../actions/Organization';
import Autocomplete from './Autocomplete';
import inject18n from './i18n';
import { storeHelper } from '../actions/Schema';
import { resolveUserName } from '../utils/String';

const styles = () => ({
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
});

class UserField extends Component {
  constructor(props) {
    super(props);
    this.state = { userCreation: false, userInput: '' };
  }

  componentDidMount() {
    this.props.fetchUsers();
    this.props.fetchOrganizations();
  }

  handleOpenUserCreation() {
    this.setState({ userCreation: true });
  }

  handleCloseUserCreation() {
    this.setState({ userCreation: false });
  }

  onSubmit(data) {
    const { name, setFieldValue, values } = this.props;
    this.props.addUser(data).then((result) => {
      if (result.result) {
        const newUser = result.entities.users[result.result];
        const users = R.append(
          {
            id: newUser.user_id,
            label: resolveUserName(newUser),
          },
          values[name],
        );
        setFieldValue(name, users);
        return this.handleCloseUserCreation();
      }
      return result;
    });
  }

  render() {
    const {
      t,
      name,
      users,
      classes,
      onKeyDown,
      style,
      label,
      placeholder,
      noMargin,
    } = this.props;
    const usersOptions = R.map(
      (n) => ({
        id: n.user_id,
        label: resolveUserName(n),
      }),
      users,
    );
    return (
      <div>
        <Autocomplete
          variant="standard"
          size="small"
          name={name}
          noMargin={noMargin}
          fullWidth={true}
          multiple={true}
          label={label}
          placeholder={placeholder}
          options={usersOptions}
          style={style}
          openCreate={this.handleOpenUserCreation.bind(this)}
          onKeyDown={onKeyDown}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <div className={classes.icon}>
                <PersonOutlined />
              </div>
              <div className={classes.text}>{option.label}</div>
            </Box>
          )}
          classes={{ clearIndicator: classes.autoCompleteIndicator }}
        />
        <Dialog
          open={this.state.userCreation}
          onClose={this.handleCloseUserCreation.bind(this)}
        >
          <DialogTitle>{t('Create a new user')}</DialogTitle>
          <DialogContent>
            <PlayerForm
              initialValues={{ user_tags: [] }}
              handleClose={this.handleCloseUserCreation.bind(this)}
              onSubmit={this.onSubmit.bind(this)}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }
}

const select = (state) => {
  const helper = storeHelper(state);
  return {
    users: helper.getUsers(),
    organizations: helper.getOrganizations(),
  };
};

export default R.compose(
  connect(select, { fetchUsers, fetchOrganizations, addUser }),
  inject18n,
  withStyles(styles),
)(UserField);
