import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as PropTypes from 'prop-types';
import { Route, Switch } from 'react-router';
import { i18nRegister } from '../../../utils/Messages';
import { T } from '../../../components/I18n';
import { redirectToAdmin } from '../../../actions/Application';
import * as Constants from '../../../constants/ComponentTypes';
import AppBar from '../../../components/AppBar';
import LeftBar from './nav/LeftBar';
import UserPopover from '../UserPopover';
import IndexAdmin from './Index';
import IndexAdminUsers from './user/Index';
import IndexAdminGroups from './group/Index';

i18nRegister({
  fr: {
    Administratinon: 'Administration',
  },
});

const styles = {
  root: {
    padding: '80px 20px 0 85px',
  },
  title: {
    fontVariant: 'small-caps',
    display: 'block',
    float: 'left',
  },
};

class RootAuthenticated extends Component {
  toggleLeftBar() {
    this.props.toggleLeftBar();
  }

  redirectToHome() {
    this.props.redirectToAdmin();
  }

  render() {
    return (
      <div>
        <AppBar
          title={
            <div>
              <span style={styles.title}>
                <T>Administration</T>
              </span>
            </div>
          }
          type={Constants.APPBAR_TYPE_TOPBAR}
          onTitleTouchTap={this.redirectToHome.bind(this)}
          onLeftIconButtonTouchTap={this.toggleLeftBar.bind(this)}
          iconElementRight={<UserPopover />}
          showMenuIconButton={false}
        />
        <LeftBar pathname={this.props.pathname} />

        <Switch>
          <Route path="index" component={IndexAdmin} />
          <Route path="users" component={IndexAdminUsers} />
          <Route path="groups" component={IndexAdminGroups} />
        </Switch>
      </div>
    );
  }
}

RootAuthenticated.propTypes = {
  pathname: PropTypes.string,
  leftBarOpen: PropTypes.bool,
  toggleLeftBar: PropTypes.func,
  logout: PropTypes.func,
  redirectToAdmin: PropTypes.func,
  children: PropTypes.node,
  params: PropTypes.object,
};

const select = (state, ownProps) => {
  const { pathname } = ownProps.location;
  return {
    pathname,
  };
};

export default connect(select, { redirectToAdmin })(RootAuthenticated);
