import React from 'react';
import * as PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

// eslint-disable-next-line import/prefer-default-export
export const T = (props) => {
  const id = props.children && props.children.replace(/(:(\w+))/g, '{$2}');
  if (id) {
    return <FormattedMessage id={id} defaultMessage={id} values={props} />;
  }
  return '';
};

T.propTypes = {
  children: PropTypes.string,
  values: PropTypes.object,
};
