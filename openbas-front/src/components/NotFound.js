import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Alert, AlertTitle } from '@mui/material';
import inject18n from './i18n';

class NotFound extends Component {
  render() {
    const { t } = this.props;
    return (
      <div>
        <Alert severity="info">
          <AlertTitle>{t('Error')}</AlertTitle>
          {t('This page is not found on this OpenBAS application.')}
        </Alert>
      </div>
    );
  }
}

NotFound.propTypes = {
  t: PropTypes.func,
  demo: PropTypes.string,
  askToken: PropTypes.func,
  checkKerberos: PropTypes.func,
  classes: PropTypes.object,
};

export default inject18n(NotFound);
