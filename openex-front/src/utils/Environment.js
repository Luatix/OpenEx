import { Subject, timer } from 'rxjs';
import { debounce } from 'rxjs/operators';
import * as R from 'ramda';
import React from 'react';
import Slide from '@mui/material/Slide';

// Service bus
const MESSENGER$ = new Subject().pipe(debounce(() => timer(500)));
export const MESSAGING$ = {
  messages: MESSENGER$,
  notifyError: (text) => MESSENGER$.next([{ type: 'error', text }]),
  notifySuccess: (text) => MESSENGER$.next([{ type: 'message', text }]),
  redirect: new Subject(),
};

// Default application exception.
export class ApplicationError extends Error {
  constructor(errors) {
    super();
    this.data = errors;
  }
}

// Network
const isEmptyPath = R.isNil(window.BASE_PATH) || R.isEmpty(window.BASE_PATH);
const contextPath = isEmptyPath || window.BASE_PATH === '/' ? '' : window.BASE_PATH;
export const APP_BASE_PATH = isEmptyPath || contextPath.startsWith('/') ? contextPath : `/${contextPath}`;

// Transition
export const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';
