import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Form } from 'react-final-form';
import { TextField } from '../../../../components/TextField';
import { T } from '../../../../components/I18n';
import { i18nRegister } from '../../../../utils/Messages';

i18nRegister({
  fr: {
    Title: 'Titre',
    Content: 'Contenu',
  },
});

const validate = (values) => {
  const errors = {};
  const requiredFields = ['log_title', 'log_content'];
  requiredFields.forEach((field) => {
    if (!values[field]) {
      errors[field] = 'Required';
    }
  });
  return errors;
};

class LogForm extends Component {
  render() {
    const { onSubmit, initialValues } = this.props;
    return (
      <Form
        initialValues={initialValues}
        onSubmit={onSubmit}
        validate={validate}
      >
        {({ handleSubmit }) => (
          <form id="logForm" onSubmit={handleSubmit}>
            <TextField name="log_title" fullWidth={true} label={<T>Title</T>} />
            <TextField
              name="log_content"
              fullWidth={true}
              multiline={true}
              rows={4}
              label={<T>Content</T>}
              style={{ marginTop: 20 }}
            />
          </form>
        )}
      </Form>
    );
  }
}

LogForm.propTypes = {
  error: PropTypes.string,
  pristine: PropTypes.bool,
  submitting: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func,
  change: PropTypes.func,
  audiences: PropTypes.array,
};

export default LogForm;
