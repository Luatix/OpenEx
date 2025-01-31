import { AxiosError } from 'axios';
import { FORM_ERROR } from 'final-form';
import type { Schema } from 'normalizr';
import * as R from 'ramda';
import { ErrorInfo } from 'react';
import { createIntl, createIntlCache } from 'react-intl';
import { Dispatch } from 'redux';
import Immutable from 'seamless-immutable';

import { LANG } from '../components/AppIntlProvider';
import * as Constants from '../constants/ActionTypes';
import { DATA_FETCH_ERROR } from '../constants/ActionTypes';
import { api } from '../network';
import { store } from '../store';
import { MESSAGING$ } from './Environment';
import i18n from './Localization';

const isEmptyPath = R.isNil(window.BASE_PATH) || R.isEmpty(window.BASE_PATH);
const contextPath = isEmptyPath || window.BASE_PATH === '/' ? '' : window.BASE_PATH;
export const APP_BASE_PATH = isEmptyPath || contextPath.startsWith('/') ? contextPath : `/${contextPath}`;

const cache = createIntlCache();

export const buildUri = (uri: string) => `${APP_BASE_PATH}${uri}`;

const buildError = (data: AxiosError) => {
  const errorsExtractor = R.pipe(
    R.pathOr({}, ['errors', 'children']),
    R.toPairs(),
    R.map((elem: unknown) => {
      const extractErrorsPipe = R.pipe(
        R.tail(),
        R.head(),
        R.propOr([], 'errors'),
        R.head(),
      );
      return [R.head(elem), extractErrorsPipe(elem)];
    }),
    R.fromPairs(),
    R.set(R.lensProp(FORM_ERROR), data.message),
  );
  return errorsExtractor(data);
};

const notifyError = (error: AxiosError) => {
  const intl = createIntl({
    locale: LANG,
    messages: i18n.messages[LANG as keyof typeof i18n.messages],
  }, cache);
  if (error.status === 401 || error.status === 404) {
    // Do not notify the user, as a 401 error will already trigger a disconnection, as 404 already handle inside the app
  } else if (error.status === 409) {
    MESSAGING$.notifyError(intl.formatMessage({ id: 'The element already exists' }));
  } else if (error.status === 400) {
    if (error.message) {
      MESSAGING$.notifyError(intl.formatMessage({ id: error.message }));
    } else {
      MESSAGING$.notifyError(intl.formatMessage({ id: 'Bad request' }));
    }
  } else if (error.status === 500) {
    MESSAGING$.notifyError(intl.formatMessage({ id: 'Internal error' }));
  } else if (error.message) {
    MESSAGING$.notifyError(error.message);
  } else {
    MESSAGING$.notifyError(intl.formatMessage({ id: 'Something went wrong. Please refresh the page or try again later.' }));
  }
};

const notifySuccess = (message: string) => {
  const messages = i18n.messages[LANG as keyof typeof i18n.messages] as Record<string, string>;
  const intl = createIntl({
    locale: LANG,
    messages: i18n.messages[LANG as keyof typeof i18n.messages],
  }, cache);

  if (!messages[message]) {
    MESSAGING$.notifySuccess(message);
  } else {
    MESSAGING$.notifySuccess(intl.formatMessage({ id: message }));
  }
};

const checkUnauthorized = (error: AxiosError) => {
  if (error.status === 401) {
    store.dispatch({
      type: DATA_FETCH_ERROR,
      payload: error,
    });
  }
};

const simpleApi = api();

export const simpleCall = (uri: string, params?: unknown, defaultErrorBehavior: boolean = true) => simpleApi.get(buildUri(uri), { params }).catch((error) => {
  checkUnauthorized(error);
  if (defaultErrorBehavior) {
    notifyError(error);
  }
  throw error;
});
export const simplePostCall = (uri: string, data?: unknown, defaultNotifyErrorBehavior: boolean = true) => simpleApi.post(buildUri(uri), data)
  .catch((error) => {
    checkUnauthorized(error);
    if (defaultNotifyErrorBehavior) {
      notifyError(error);
    }
    throw error;
  });
export const simplePutCall = (uri: string, data?: unknown, defaultNotifyErrorBehavior: boolean = true, defaultSuccessBehavior: boolean = true) => simpleApi.put(buildUri(uri), data)
  .then((response) => {
    if (defaultSuccessBehavior) {
      notifySuccess('The element has been successfully updated');
    }
    return response;
  })
  .catch((error) => {
    checkUnauthorized(error);
    if (defaultNotifyErrorBehavior) {
      notifyError(error);
    }
    throw error;
  });
// eslint-disable-next-line max-len
export const simpleDelCall = (uri: string, data?: unknown, defaultNotifyErrorBehavior: boolean = true, defaultSuccessBehavior: boolean = true) => simpleApi.delete(buildUri(uri), data ? { data: data } : undefined)
  .then((response) => {
    if (defaultSuccessBehavior) {
      notifySuccess('The element has been successfully deleted.');
    }
    return response;
  })
  .catch((error) => {
    checkUnauthorized(error);
    if (defaultNotifyErrorBehavior) {
      notifyError(error);
    }
    throw error;
  });

export const getReferential = (schema: Schema, uri: string) => (dispatch: Dispatch) => {
  dispatch({ type: Constants.DATA_FETCH_SUBMITTED });
  return api(schema)
    .get(buildUri(uri))
    .then((response) => {
      dispatch({ type: Constants.DATA_FETCH_SUCCESS, payload: response.data });
      return response.data;
    })
    .catch((error) => {
      dispatch({ type: Constants.DATA_FETCH_ERROR, payload: error });
      notifyError(error);
      throw error;
    });
};

export const putReferential = (schema: Schema, uri: string, data: unknown) => (dispatch: Dispatch) => {
  dispatch({ type: Constants.DATA_FETCH_SUBMITTED });
  return api(schema)
    .put(buildUri(uri), data)
    .then((response) => {
      dispatch({ type: Constants.DATA_FETCH_SUCCESS, payload: response.data });
      dispatch({ type: Constants.DATA_UPDATE_SUCCESS, payload: response.data });
      notifySuccess('The element has been successfully updated');
      return response.data;
    })
    .catch((error: AxiosError) => {
      dispatch({ type: Constants.DATA_FETCH_ERROR, payload: error });
      notifyError(error);
      return buildError(error);
    });
};

export const postReferential = (schema: Schema | null, uri: string, data: unknown) => (dispatch: Dispatch) => {
  dispatch({ type: Constants.DATA_FETCH_SUBMITTED });
  return api(schema)
    .post(buildUri(uri), data)
    .then((response) => {
      dispatch({ type: Constants.DATA_FETCH_SUCCESS, payload: response.data });
      notifySuccess('The element has been successfully updated');
      return response.data;
    })
    .catch((error) => {
      dispatch({ type: Constants.DATA_FETCH_ERROR, payload: error });
      notifyError(error);
      return buildError(error);
    });
};

export const delReferential = (uri: string, type: string, id: string) => (dispatch: Dispatch) => {
  dispatch({ type: Constants.DATA_FETCH_SUBMITTED });
  return api()
    .delete(buildUri(uri))
    .then(() => {
      dispatch({
        type: Constants.DATA_DELETE_SUCCESS,
        payload: Immutable({ type, id }),
      });
      notifySuccess('The element has been successfully deleted');
    })
    .catch((error) => {
      dispatch({ type: Constants.DATA_FETCH_ERROR, payload: error });
      notifyError(error);
      throw error;
    });
};

export const bulkDeleteReferential = (uri: string, type: string, data: unknown) => (dispatch: Dispatch) => {
  dispatch({ type: Constants.DATA_FETCH_SUBMITTED });
  return api()
    .delete(buildUri(uri), { data })
    .then((response) => {
      dispatch({
        type: Constants.DATA_DELETE_SUCCESS,
        payload: Immutable({ type, data }),
      });
      return response.data;
    })
    .catch((error) => {
      dispatch({ type: Constants.DATA_FETCH_ERROR, payload: error });
      notifyError(error);
      throw error;
    });
};

export const sendErrorToBackend = async (error: Error, stack: ErrorInfo) => {
  const errorDetails = {
    message: error.message,
    stack: stack.componentStack,
    timestamp: new Date().toISOString(),
    level: 'ERROR',
  };
  simplePostCall('/api/logs', errorDetails);
};
