import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as R from 'ramda';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import { T } from '../../../../components/I18n';
import { i18nRegister } from '../../../../utils/Messages';
import * as Constants from '../../../../constants/ComponentTypes';
import { Popover } from '../../../../components/Popover';
import { Menu } from '../../../../components/Menu';
import { Dialog, DialogTitleElement } from '../../../../components/Dialog';
import { IconButton, FlatButton } from '../../../../components/Button';
import { Icon } from '../../../../components/Icon';
import {
  MenuItemLink,
  MenuItemButton,
} from '../../../../components/menu/MenuItem';
import { SimpleTextField } from '../../../../components/SimpleTextField';
import { Checkbox } from '../../../../components/Checkbox';
import { Chip } from '../../../../components/Chip';
import { Avatar } from '../../../../components/Avatar';
import { List } from '../../../../components/List';
import { MainSmallListItem } from '../../../../components/list/ListItem';
import {
  fetchGroup,
  updateGroup,
  deleteGroup,
} from '../../../../actions/Group';
import { addGrant, deleteGrant } from '../../../../actions/Grant';
import GroupForm from './GroupForm';

i18nRegister({
  fr: {
    'Manage users': 'Gérer les utilisateurs',
    'Manage grants': 'Gérer les permissions',
    'Do you want to delete this group?': 'Souhaitez-vous supprimer ce groupe ?',
    Exercise: 'Exercice',
    Planner: 'Planificateur',
    Observer: 'Observateur',
    'Update the group': 'Mettre à jour le groupe',
    'Search for a user': 'Rechercher un utilisateur',
    'Read/Write': 'Lecture/Ecriture',
    'Read only': 'Lecture seule',
  },
});

const styles = {
  main: {
    position: 'absolute',
    top: '7px',
    right: 0,
  },
  name: {
    float: 'left',
    width: '30%',
    padding: '5px 0 0 0',
  },
  mail: {
    float: 'left',
    width: '40%',
    padding: '5px 0 0 0',
  },
  org: {
    float: 'left',
    padding: '5px 0 0 0',
  },
};

class GroupPopover extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openDelete: false,
      openEdit: false,
      openUsers: false,
      openGrants: false,
      openPopover: false,
      searchTerm: '',
      usersIds: this.props.groupUsersIds,
      grantsToAdd: [],
      grantsToRemove: [],
    };
  }

  handlePopoverOpen(event) {
    event.preventDefault();
    this.setState({
      openPopover: true,
      anchorEl: event.currentTarget,
    });
  }

  handlePopoverClose() {
    this.setState({ openPopover: false });
  }

  handleOpenEdit() {
    this.setState({ openEdit: true });
    this.handlePopoverClose();
  }

  handleCloseEdit() {
    this.setState({ openEdit: false });
  }

  onSubmitEdit(data) {
    return this.props.updateGroup(this.props.group.group_id, data);
  }

  submitFormEdit() {
    this.refs.groupForm.submit();
  }

  handleOpenUsers() {
    this.setState({ openUsers: true, usersIds: this.props.groupUsersIds });
    this.handlePopoverClose();
  }

  handleSearchUsers(event, value) {
    this.setState({ searchTerm: value });
  }

  addUser(userId) {
    this.setState({ usersIds: R.append(userId, this.state.usersIds) });
  }

  removeUser(userId) {
    this.setState({
      usersIds: R.filter((u) => u !== userId, this.state.usersIds),
    });
  }

  handleCloseUsers() {
    this.setState({ openUsers: false, searchTerm: '' });
  }

  submitAddUsers() {
    this.props.updateGroup(this.props.group.group_id, {
      group_users: this.state.usersIds,
    });
    this.handleCloseUsers();
  }

  handleOpenGrants() {
    this.setState({ openGrants: true });
    this.handlePopoverClose();
  }

  handleCloseGrants() {
    this.setState({ openGrants: false });
  }

  handleGrantCheck(exerciseId, grantId, grantName, event, isChecked) {
    // the grant already exists
    if (grantId !== null && isChecked) {
      return;
      // the grant does not exist yet
    } if (isChecked) {
      const { grantsToAdd } = this.state;
      grantsToAdd.push({ exercise_id: exerciseId, grant_name: grantName });
      this.setState({ grantsToAdd });
    }

    // the grand does not exist
    if (grantId === null && !isChecked) {

    } else if (!isChecked) {
      const { grantsToRemove } = this.state;
      grantsToRemove.push({ exercise_id: exerciseId, grant_id: grantId });
      this.setState({ grantsToRemove });
    }
  }

  submitGrants() {
    const { grantsToAdd } = this.state;
    const addGrant = (n) => this.props
      .addGrant(this.props.group.group_id, {
        grant_name: n.grant_name,
        grant_exercise: n.exercise_id,
      })
      .then(() => {
        this.props.fetchGroup(this.props.group.group_id);
      });
    R.forEach(addGrant, grantsToAdd);
    this.setState({ grantsToAdd: [] });

    const { grantsToRemove } = this.state;
    const deleteGrant = (n) => this.props.deleteGrant(this.props.group.group_id, n.grant_id).then(() => {
      this.props.fetchGroup(this.props.group.group_id);
    });
    R.forEach(deleteGrant, grantsToRemove);
    this.setState({ grantsToRemove: [] });

    this.handleCloseGrants();
  }

  handleOpenDelete() {
    this.setState({ openDelete: true });
    this.handlePopoverClose();
  }

  handleCloseDelete() {
    this.setState({ openDelete: false });
  }

  submitDelete() {
    this.props.deleteGroup(this.props.group.group_id);
    this.handleCloseDelete();
  }

  render() {
    const grantsActions = [
      <FlatButton
        key="cancel"
        label="Cancel"
        primary={true}
        onClick={this.handleCloseGrants.bind(this)}
      />,
      <FlatButton
        key="update"
        label="Update"
        primary={true}
        onClick={this.submitGrants.bind(this)}
      />,
    ];
    const usersActions = [
      <FlatButton
        key="cancel"
        label="Cancel"
        primary={true}
        onClick={this.handleCloseUsers.bind(this)}
      />,
      <FlatButton
        key="update"
        label="Update"
        primary={true}
        onClick={this.submitAddUsers.bind(this)}
      />,
    ];
    const editActions = [
      <FlatButton
        key="cancel"
        label="Cancel"
        primary={true}
        onClick={this.handleCloseEdit.bind(this)}
      />,
      <FlatButton
        key="update"
        label="Update"
        primary={true}
        onClick={this.submitFormEdit.bind(this)}
      />,
    ];
    const deleteActions = [
      <FlatButton
        key="cancel"
        label="Cancel"
        primary={true}
        onClick={this.handleCloseDelete.bind(this)}
      />,
      <FlatButton
        key="delete"
        label="Delete"
        primary={true}
        onClick={this.submitDelete.bind(this)}
      />,
    ];

    const initialValues = R.pick(['group_name'], this.props.group); // Pickup only needed fields

    // region filter users by active keyword
    const keyword = this.state.searchTerm;
    const filterByKeyword = (n) => keyword === ''
      || n.user_email.toLowerCase().indexOf(keyword.toLowerCase()) !== -1
      || n.user_firstname.toLowerCase().indexOf(keyword.toLowerCase()) !== -1
      || n.user_lastname.toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
    const filteredUsers = R.filter(filterByKeyword, R.values(this.props.users));
    // endregion

    return (
      <div style={styles.main}>
        <IconButton onClick={this.handlePopoverOpen.bind(this)}>
          <Icon name={Constants.ICON_NAME_NAVIGATION_MORE_VERT} />
        </IconButton>
        <Popover
          open={this.state.openPopover}
          anchorEl={this.state.anchorEl}
          onRequestClose={this.handlePopoverClose.bind(this)}
        >
          <Menu multiple={false}>
            <MenuItemLink
              label="Edit"
              onClick={this.handleOpenEdit.bind(this)}
            />
            <MenuItemLink
              label="Manage users"
              onClick={this.handleOpenUsers.bind(this)}
            />
            <MenuItemLink
              label="Manage grants"
              onClick={this.handleOpenGrants.bind(this)}
            />
            <MenuItemButton
              label="Delete"
              onClick={this.handleOpenDelete.bind(this)}
            />
          </Menu>
        </Popover>
        <Dialog
          title="Confirmation"
          modal={false}
          open={this.state.openDelete}
          onRequestClose={this.handleCloseDelete.bind(this)}
          actions={deleteActions}
        >
          <T>Do you want to delete this group?</T>
        </Dialog>
        <Dialog
          title="Update the group"
          modal={false}
          open={this.state.openEdit}
          onRequestClose={this.handleCloseEdit.bind(this)}
          actions={editActions}
        >
          <GroupForm
            ref="groupForm"
            initialValues={initialValues}
            onSubmit={this.onSubmitEdit.bind(this)}
            onSubmitSuccess={this.handleCloseEdit.bind(this)}
          />
        </Dialog>
        <DialogTitleElement
          title={
            <SimpleTextField
              name="keyword"
              fullWidth={true}
              type="text"
              hintText="Search for a user"
              onChange={this.handleSearchUsers.bind(this)}
              styletype={Constants.FIELD_TYPE_INTITLE}
            />
          }
          modal={false}
          open={this.state.openUsers}
          onRequestClose={this.handleCloseUsers.bind(this)}
          autoScrollBodyContent={true}
          actions={usersActions}
        >
          <div>
            {this.state.usersIds.map((userId) => {
              const user = R.propOr({}, userId, this.props.users);
              const user_firstname = R.propOr('-', 'user_firstname', user);
              const user_lastname = R.propOr('-', 'user_lastname', user);
              const user_gravatar = R.propOr('-', 'user_gravatar', user);
              return (
                <Chip
                  key={userId}
                  onRequestDelete={this.removeUser.bind(this, userId)}
                  type={Constants.CHIP_TYPE_LIST}
                >
                  <Avatar
                    src={user_gravatar}
                    size={32}
                    type={Constants.AVATAR_TYPE_CHIP}
                  />
                  {user_firstname} {user_lastname}
                </Chip>
              );
            })}
            <div className="clearfix"></div>
          </div>
          <div>
            <List>
              {filteredUsers.map((user) => {
                const disabled = R.find(
                  (user_id) => user_id === user.user_id,
                  this.state.usersIds,
                ) !== undefined;
                const user_organization = R.propOr(
                  {},
                  user.user_organization,
                  this.props.organizations,
                );
                const organizationName = R.propOr(
                  '-',
                  'organization_name',
                  user_organization,
                );
                return (
                  <MainSmallListItem
                    key={user.user_id}
                    disabled={disabled}
                    onClick={this.addUser.bind(this, user.user_id)}
                    primaryText={
                      <div>
                        <div style={styles.name}>
                          {user.user_firstname} {user.user_lastname}
                        </div>
                        <div style={styles.mail}>{user.user_email}</div>
                        <div style={styles.org}>{organizationName}</div>
                        <div className="clearfix"></div>
                      </div>
                    }
                    leftAvatar={
                      <Avatar
                        type={Constants.AVATAR_TYPE_LIST}
                        src={user.user_gravatar}
                      />
                    }
                  />
                );
              })}
            </List>
          </div>
        </DialogTitleElement>
        <Dialog
          title="Manage grants"
          modal={false}
          open={this.state.openGrants}
          onRequestClose={this.handleCloseGrants.bind(this)}
          actions={grantsActions}
        >
          <Table selectable={false} style={{ marginTop: '5px' }}>
            <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
              <TableRow>
                <TableHeaderColumn>
                  <T>Exercise</T>
                </TableHeaderColumn>
                <TableHeaderColumn>
                  <T>Read/Write</T>
                </TableHeaderColumn>
                <TableHeaderColumn>
                  <T>Read only</T>
                </TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody displayRowCheckbox={false}>
              {R.values(this.props.exercises).map((exercise) => {
                const grantPlanner = R.find(
                  (g) => g.grant_exercise.exercise_id === exercise.exercise_id
                    && g.grant_name === 'PLANNER',
                )(this.props.group.group_grants);
                const grantObserver = R.find(
                  (g) => g.grant_exercise.exercise_id === exercise.exercise_id
                    && g.grant_name === 'OBSERVER',
                )(this.props.group.group_grants);
                const grantPlannerId = R.propOr(null, 'grant_id', grantPlanner);
                const grantObserverId = R.propOr(null, 'grant_id', grantObserver);

                return (
                  <TableRow key={exercise.exercise_id}>
                    <TableRowColumn>{exercise.exercise_name}</TableRowColumn>
                    <TableRowColumn>
                      <Checkbox
                        defaultChecked={grantPlannerId !== null}
                        onCheck={this.handleGrantCheck.bind(
                          this,
                          exercise.exercise_id,
                          grantPlannerId,
                          'PLANNER',
                        )}
                      />
                    </TableRowColumn>
                    <TableRowColumn>
                      <Checkbox
                        defaultChecked={grantObserverId !== null}
                        onCheck={this.handleGrantCheck.bind(
                          this,
                          exercise.exercise_id,
                          grantObserverId,
                          'OBSERVER',
                        )}
                      />
                    </TableRowColumn>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Dialog>
      </div>
    );
  }
}

const select = (state) => ({
  users: state.referential.entities.users,
  organizations: state.referential.entities.organizations,
  exercises: state.referential.entities.exercises,
});

GroupPopover.propTypes = {
  group: PropTypes.object,
  fetchGroup: PropTypes.func,
  updateGroup: PropTypes.func,
  deleteGroup: PropTypes.func,
  addGrant: PropTypes.func,
  deleteGrant: PropTypes.func,
  organizations: PropTypes.object,
  exercises: PropTypes.object,
  users: PropTypes.object,
  groupUsersIds: PropTypes.array,
  children: PropTypes.node,
};

export default connect(select, {
  fetchGroup,
  updateGroup,
  deleteGroup,
  addGrant,
  deleteGrant,
})(GroupPopover);
