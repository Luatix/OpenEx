import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { Provider, connect } from 'react-redux';
import {
  Router, Route, IndexRoute, browserHistory,
} from 'react-router';
import {
  syncHistoryWithStore,
  routerActions,
  routerMiddleware,
} from 'react-router-redux';
import { connectedReduxRedirect } from 'redux-auth-wrapper/history3/redirect';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { normalize } from 'normalizr';
import { addLocaleData, IntlProvider } from 'react-intl';
import enLocaleData from 'react-intl/locale-data/en';
import frLocaleData from 'react-intl/locale-data/fr';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import * as R from 'ramda';
import Immutable from 'seamless-immutable';
import { createLogger } from 'redux-logger';
import rootReducer from './reducers';
import theme from './components/Theme';
import { locale } from './utils/BrowserLanguage';
import { i18n, debug } from './utils/Messages';
import { entitiesInitializer } from './reducers/Referential';
import * as Constants from './constants/ActionTypes';
import RootAnonymous from './containers/anonymous/Root';
import Login from './containers/anonymous/login/Login';
import IndexComcheck from './containers/anonymous/comcheck/Index';
import RootAuthenticated from './containers/authenticated/Root';
import IndexAuthenticated from './containers/authenticated/Index';
import RootAdmin from './containers/authenticated/admin/Root';
import IndexAdmin from './containers/authenticated/admin/Index';
import IndexAdminUsers from './containers/authenticated/admin/user/Index';
import IndexAdminGroups from './containers/authenticated/admin/group/Index';
import IndexAdminTests from './containers/authenticated/admin/tests/Index';
import RootUser from './containers/authenticated/user/Root';
import IndexUserProfile from './containers/authenticated/user/profile/Index';
import RootExercise from './containers/authenticated/exercise/Root';
import IndexExercise from './containers/authenticated/exercise/Index';
import IndexExerciseSettings from './containers/authenticated/exercise/settings/Index';
import IndexExerciseDocuments from './containers/authenticated/exercise/documents/Index';
import IndexExerciseObjectives from './containers/authenticated/exercise/objective/Index';
import IndexExerciseAudiences from './containers/authenticated/exercise/audiences/Index';
import IndexExerciseAudiencesAudience from './containers/authenticated/exercise/audiences/audience/Index';
import IndexExerciseScenario from './containers/authenticated/exercise/scenario/Index';
import IndexExerciseScenarioEvent from './containers/authenticated/exercise/scenario/event/Index';
import IndexExerciseExecution from './containers/authenticated/exercise/execution/Index';
import IndexExerciseChecks from './containers/authenticated/exercise/check/Index';
import IndexExerciseDryrun from './containers/authenticated/exercise/check/Dryrun';
import IndexExerciseComcheck from './containers/authenticated/exercise/check/Comcheck';
import IndexExerciseLessons from './containers/authenticated/exercise/lessons/Index';
import IndexExerciseStatistics from './containers/authenticated/exercise/statistics/Index';

// Default application state
const initialState = {
  app: Immutable({
    logged: JSON.parse(localStorage.getItem('logged')),
    worker: { status: 'RUNNING' },
  }),
  screen: Immutable({ navbar_left_open: false, navbar_right_open: true }),
  referential: entitiesInitializer,
};

// Console patch in dev temporary disable react intl failure
if (process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  if (console.error === originalConsoleError) {
    console.error = (...args) => {
      if (args && args[0].indexOf('[React Intl]') === 0) return;
      originalConsoleError.call(console, ...args);
    };
  }
}

let store;
const baseHistory = browserHistory;
const routingMiddleware = routerMiddleware(baseHistory);
const logger = createLogger({
  predicate: (getState, action) => !action.type.startsWith('DATA_FETCH')
    && !action.type.startsWith('@@redux-form'),
});
// Only compose the store if devTools are available
if (process.env.NODE_ENV === 'development' && window.devToolsExtension) {
  store = createStore(
    rootReducer,
    initialState,
    compose(
      applyMiddleware(routingMiddleware, thunk, logger),
      window.devToolsExtension && window.devToolsExtension(),
    ),
  );
} else {
  store = createStore(
    rootReducer,
    initialState,
    applyMiddleware(routingMiddleware, thunk),
  );
}

// Axios API
export const api = (schema) => {
  const token = R.path(['logged', 'auth'], store.getState().app);
  const instance = axios.create({
    withCredentials: true,
    headers: { 'X-Authorization-Token': token, responseType: 'json' },
  });
  // Intercept to apply schema and test unauthorized users
  instance.interceptors.response.use(
    (response) => {
      const toImmutable = response.config.responseType === undefined; //= == json
      const dataNormalize = schema
        ? normalize(response.data, schema)
        : response.data;
      debug('api', {
        from: response.request.responseURL,
        data: { raw: response.data, normalize: dataNormalize },
      });
      response.data = toImmutable ? Immutable(dataNormalize) : dataNormalize;
      return response;
    },
    (err) => {
      const res = err.response;
      console.error('api', res);
      if (res.status === 401) {
        // User is not logged anymore
        store.dispatch({ type: Constants.IDENTITY_LOGOUT_SUCCESS });
        return Promise.reject(res.data);
      } if (
        res.status === 503
        && err.config
        && !err.config.__isRetryRequest
      ) {
        err.config.__isRetryRequest = true;
        return axios(err.config);
      }
      return Promise.reject(res.data);
    },
  );
  return instance;
};

// Hot reload reducers in dev
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./reducers', () => store.replaceReducer(rootReducer));
}

// Create an enhanced history that syncs navigation events with the store
const history = syncHistoryWithStore(baseHistory, store);

// region authentication
const authenticationToken = (state) => state.app.logged;
const UserIsAuthenticated = connectedReduxRedirect({
  redirectPath: '/login',
  authenticatedSelector: (state) => !(
    authenticationToken(state) === null
      || authenticationToken(state) === undefined
  ),
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'UserIsAuthenticated',
});

const UserIsAdmin = connectedReduxRedirect({
  authenticatedSelector: (state) => authenticationToken(state).admin === true,
  redirectPath: '/private',
  allowRedirectBack: false,
  wrapperDisplayName: 'UserIsAdmin',
});
const UserIsNotAuthenticated = connectedReduxRedirect({
  redirectPath: '/private',
  authenticatedSelector: (state) => authenticationToken(state) === null
    || authenticationToken(state) === undefined,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'UserIsNotAuthenticated',
  allowRedirectBack: false,
});

// endregion

class IntlWrapper extends Component {
  render() {
    const { children, lang } = this.props;
    return (
      <IntlProvider locale={lang} key={lang} messages={i18n.messages[lang]}>
        {children}
      </IntlProvider>
    );
  }
}

IntlWrapper.propTypes = {
  lang: PropTypes.string,
  children: PropTypes.node,
};

const select = (state) => {
  const lang = R.pathOr('auto', ['logged', 'lang'], state.app);
  return { lang: lang === 'auto' ? locale : lang };
};

const ConnectedIntl = connect(select)(IntlWrapper);

addLocaleData([...enLocaleData, ...frLocaleData]);

class App extends Component {
  render() {
    return (
      <ConnectedIntl store={store}>
        <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
          <Provider store={store}>
            <Router history={history}>
              <Route path="/" component={RootAnonymous}>
                <IndexRoute component={UserIsNotAuthenticated(Login)} />
                <Route
                  path="/login"
                  component={UserIsNotAuthenticated(Login)}
                />
                <Route path="/comcheck/:statusId" component={IndexComcheck} />
              </Route>
              <Route
                path="/private"
                component={UserIsAuthenticated(RootAuthenticated)}
              >
                <IndexRoute component={IndexAuthenticated} />
                <Route path="admin" component={UserIsAdmin(RootAdmin)}>
                  <Route path="index" component={IndexAdmin} />
                  <Route path="users" component={IndexAdminUsers} />
                  <Route path="groups" component={IndexAdminGroups} />
                  <Route path="tests" component={IndexAdminTests} />
                </Route>
                <Route path="user" component={RootUser}>
                  <Route path="profile" component={IndexUserProfile} />
                </Route>
                <Route path="exercise/:exerciseId" component={RootExercise}>
                  <IndexRoute component={IndexExercise} />
                  <Route path="world" component={IndexExercise} />
                  <Route path="execution" component={IndexExerciseExecution} />
                  <Route path="lessons" component={IndexExerciseLessons} />
                  <Route path="checks" component={IndexExerciseChecks} />
                  <Route
                    path="checks/dryrun/:dryrunId"
                    component={IndexExerciseDryrun}
                  />
                  <Route
                    path="checks/comcheck/:comcheckId"
                    component={IndexExerciseComcheck}
                  />
                  <Route
                    path="objectives"
                    component={IndexExerciseObjectives}
                  />
                  <Route path="scenario" component={IndexExerciseScenario} />
                  <Route
                    path="scenario/:eventId"
                    component={IndexExerciseScenarioEvent}
                  />
                  <Route path="audiences" component={IndexExerciseAudiences} />
                  <Route
                    path="audiences/:audienceId"
                    component={IndexExerciseAudiencesAudience}
                  />
                  <Route path="calendar" component={IndexExercise} />
                  <Route path="documents" component={IndexExerciseDocuments} />
                  <Route
                    path="statistics"
                    component={IndexExerciseStatistics}
                  />
                  <Route path="settings" component={IndexExerciseSettings} />
                  <Route path="profile" component={IndexUserProfile} />
                </Route>
              </Route>
            </Router>
          </Provider>
        </MuiThemeProvider>
      </ConnectedIntl>
    );
  }
}

export default App;
