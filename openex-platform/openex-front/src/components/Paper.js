import React from 'react';
import * as PropTypes from 'prop-types';
import MUIPaper from '@material-ui/core/Paper';
import * as Constants from '../constants/ComponentTypes';

const paperStyle = {
  [Constants.PAPER_TYPE_EXERCISE]: {},
  [Constants.PAPER_TYPE_EVENT]: {
    display: 'inline-block',
    margin: '20px 20px 20px 20px',
    verticalAlign: 'top',
    width: '400px',
    height: '120px',
    cursor: 'pointer',
  },
  [Constants.PAPER_TYPE_SETTINGS]: {
    margin: '0 auto',
    marginBottom: '30px',
    maxWidth: '600px',
    minWidth: '400px',
  },
};

// eslint-disable-next-line import/prefer-default-export
export const Paper = (props) => (
  <MUIPaper
    rounded={true}
    zDepth={props.zDepth}
    style={paperStyle[props.type]}
    className={props.className}
  >
    {props.children}
  </MUIPaper>
);

Paper.propTypes = {
  type: PropTypes.string,
  className: PropTypes.string,
  zDepth: PropTypes.number,
  children: PropTypes.node,
};
