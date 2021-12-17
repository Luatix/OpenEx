import React from 'react';
import * as PropTypes from 'prop-types';
import MUIAvatar from '@material-ui/core/Avatar';
import * as Constants from '../constants/ComponentTypes';

const avatarStyle = {
  [Constants.AVATAR_TYPE_TOPBAR]: {
    marginRight: '10px',
    marginTop: '5px',
    cursor: 'pointer',
  },
  [Constants.AVATAR_TYPE_LIST]: {
    position: 'absolute',
    top: '8px',
    left: '16px',
  },
  [Constants.AVATAR_TYPE_MAINLIST]: {
    position: 'absolute',
    top: '12px',
    left: '16px',
  },
  [Constants.AVATAR_TYPE_CHIP]: {
    float: 'left',
    margin: '0 5px 0 -12px',
  },
};

// eslint-disable-next-line import/prefer-default-export
export const Avatar = (props) => (
  <MUIAvatar
    src={props.src}
    icon={props.icon}
    size={props.size}
    onClick={props.onClick}
    style={avatarStyle[props.type]}
  />
);

Avatar.propTypes = {
  src: PropTypes.string,
  icon: PropTypes.node,
  onClick: PropTypes.func,
  size: PropTypes.number,
  type: PropTypes.string,
};
