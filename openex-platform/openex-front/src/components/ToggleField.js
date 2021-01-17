import React from 'react';
import * as PropTypes from 'prop-types';
import MUISwitch from '@material-ui/core/Switch';
import { Field } from 'react-final-form';

const renderToggleField = ({ input, label }) => (
  <MUISwitch
    label={label}
    toggled={input.value}
    {...input}
    onChange={(event) => {
      input.onChange(event.target.value);
    }}
  />
);

renderToggleField.propTypes = {
  input: PropTypes.object,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onToggle: PropTypes.func,
};

// eslint-disable-next-line import/prefer-default-export
export const ToggleField = (props) => (
  <Field label={props.label} component={renderToggleField} {...props} />
);

ToggleField.propTypes = {
  name: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};
