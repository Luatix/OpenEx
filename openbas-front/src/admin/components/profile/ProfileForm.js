import { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Form } from 'react-final-form';
import { Button } from '@mui/material';
import OldTextField from '../../../components/fields/OldTextField';
import inject18n from '../../../components/i18n';

class ProfileForm extends Component {
  render() {
    const { t, onSubmit, initialValues } = this.props;
    return (
      <Form
        keepDirtyOnReinitialize={true}
        onSubmit={onSubmit}
        initialValues={initialValues}
      >
        {({ handleSubmit, pristine, submitting }) => (
          <form id="profileForm" onSubmit={handleSubmit}>
            <OldTextField
              variant="standard"
              name="user_phone"
              fullWidth={true}
              label={t('Phone number (mobile)')}
            />
            <OldTextField
              variant="standard"
              name="user_phone2"
              fullWidth={true}
              label={t('Phone number (landline)')}
              style={{ marginTop: 20 }}
            />
            <OldTextField
              variant="standard"
              name="user_pgp_key"
              fullWidth={true}
              multiline={true}
              rows={5}
              label={t('PGP public key')}
              style={{ marginTop: 20 }}
            />
            <div style={{ marginTop: 20 }}>
              <Button
                variant="contained"
                color="secondary"
                type="submit"
                disabled={pristine || submitting}
              >
                {t('Update')}
              </Button>
            </div>
          </form>
        )}
      </Form>
    );
  }
}

ProfileForm.propTypes = {
  t: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
};

export default inject18n(ProfileForm);
