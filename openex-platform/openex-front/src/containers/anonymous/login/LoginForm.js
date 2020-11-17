import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm } from 'redux-form';
import { FormField } from '../../../components/Field';
import { Button } from '../../../components/Button';
import { i18nRegister } from '../../../utils/Messages';

i18nRegister({
  fr: {
    'Email address': 'Adresse email',
    Password: 'Mot de passe',
    'Sign in': 'Se connecter',
  },
});

const style = {
  padding: '20px',
};

const validate = (values) => {
  const errors = {};
  const requiredFields = [];
  requiredFields.forEach((field) => {
    if (!values[field]) {
      errors[field] = 'Required';
    }
  });
  return errors;
};

const LoginForm = (props) => {
  const {
    error, onSubmit, handleSubmit, pristine, submitting,
  } = props;
  return (
    <form onSubmit={handleSubmit(onSubmit)} style={style}>
      {error && (
        <div>
          <strong>{error}</strong>
          <br />
        </div>
      )}
      <FormField
        name="username"
        type="text"
        hint="Email address"
        fullWidth={true}
      />
      <FormField
        name="password"
        type="password"
        hint="Password"
        fullWidth={true}
      />
      <Button type="submit" disabled={pristine || submitting} label="Sign in" />
    </form>
  );
};

LoginForm.propTypes = {
  error: PropTypes.string,
  pristine: PropTypes.bool,
  submitting: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func,
};

export default reduxForm({
  form: 'LoginForm',
  validate,
})(LoginForm);
