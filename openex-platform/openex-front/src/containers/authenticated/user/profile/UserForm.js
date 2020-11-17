import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { reduxForm, change } from 'redux-form';
import * as R from 'ramda';
import MenuItem from 'material-ui/MenuItem';
import AutoComplete from 'material-ui/AutoComplete';
import { FormField } from '../../../../components/Field';
import { T } from '../../../../components/I18n';
import { SelectField } from '../../../../components/SelectField';
import { i18nRegister } from '../../../../utils/Messages';
import { AutoCompleteField } from '../../../../components/AutoComplete';

i18nRegister({
  fr: {
    'Email address': 'Adresse email',
    'Email address (secondary)': 'Adresse email (secondaire)',
    Firstname: 'Prénom',
    Lastname: 'Nom',
    Organization: 'Organisation',
    Language: 'Langue',
    Automatic: 'Automatique',
  },
});

class UserForm extends Component {
  render() {
    const dataSource = R.map(
      (val) => val.organization_name,
      R.values(this.props.organizations),
    );
    return (
      <form onSubmit={this.props.handleSubmit(this.props.onSubmit)}>
        {this.props.error && (
          <div>
            <strong>{this.props.error}</strong>
            <br />
          </div>
        )}
        <FormField
          name="user_email"
          fullWidth={true}
          type="text"
          label="Email address"
        />
        <FormField
          name="user_email2"
          fullWidth={true}
          type="text"
          label="Email address (secondary)"
        />
        <FormField
          name="user_firstname"
          fullWidth={true}
          type="text"
          label="Firstname"
        />
        <FormField
          name="user_lastname"
          fullWidth={true}
          type="text"
          label="Lastname"
        />
        <AutoCompleteField
          filter={AutoComplete.caseInsensitiveFilter}
          name="user_organization"
          fullWidth={true}
          type="text"
          label="Organization"
          dataSource={dataSource}
        />
        <SelectField label={<T>Language</T>} name="user_lang" fullWidth={true}>
          <MenuItem key="auto" value="auto" primaryText={<T>Automatic</T>} />
          <MenuItem key="en" value="en" primaryText="English" />
          <MenuItem key="fr" value="fr" primaryText="Français" />
        </SelectField>
      </form>
    );
  }
}

UserForm.propTypes = {
  error: PropTypes.string,
  pristine: PropTypes.bool,
  submitting: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func,
  change: PropTypes.func,
  organizations: PropTypes.object,
};

export default reduxForm({ form: 'UserForm' }, null, { change })(UserForm);
