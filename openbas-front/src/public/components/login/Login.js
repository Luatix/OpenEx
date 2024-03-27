import React, { useEffect, useState } from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withStyles, useTheme } from '@mui/styles';
import { Paper, Box } from '@mui/material';
import * as R from 'ramda';
import logoDark from '../../../static/images/logo_text_dark.png';
import logoLight from '../../../static/images/logo_text_light.png';
import byFiligranDark from '../../../static/images/by_filigran_dark.png';
import byFiligranLight from '../../../static/images/by_filigran_light.png';
import { askToken, checkKerberos, fetchParameters } from '../../../actions/Application';
import LoginForm from './LoginForm';
import inject18n from '../../../components/i18n';
import { storeHelper } from '../../../actions/Schema';
import Reset from './Reset';
import LoginError from './LoginError';
import LoginSSOButton from './LoginSSOButton';
import { fileUri } from '../../../utils/Environment';

const styles = () => ({
  container: {
    textAlign: 'center',
    margin: '0 auto',
    width: '80%',
    paddingBottom: 50,
  },
  appBar: {
    borderTopLeftRadius: '10px',
    borderTopRightRadius: '10px',
  },
  login: {
    textAlign: 'center',
    margin: '0 auto',
    maxWidth: 500,
  },
  logo: {
    width: 400,
    margin: 0,
  },
  byFiligranLogo: {
    width: 100,
    margin: '-10px 0 0 295px',
  },
});

const Login = (props) => {
  const theme = useTheme();
  const { classes, parameters, t } = props;
  const {
    auth_openid_enable: isOpenId,
    auth_saml2_enable: isSaml2,
    auth_local_enable: isLocal,
  } = parameters;
  const {
    platform_openid_providers: openidProviders,
    platform_saml2_providers: saml2Providers,
  } = parameters;
  const [reset, setReset] = useState(false);
  const [dimension, setDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const updateWindowDimensions = () => setDimension({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    window.addEventListener('resize', updateWindowDimensions);
    return () => window.removeEventListener('resize', updateWindowDimensions);
  });
  useEffect(() => {
    props.fetchParameters();
    props.checkKerberos();
  }, []);
  const onSubmit = (data) => props.askToken(data.username, data.password);
  let loginHeight = 320;
  if ((isOpenId || isSaml2) && isLocal) {
    loginHeight = 440;
  } else if (isOpenId || isSaml2) {
    loginHeight = 190;
  }
  const marginTop = dimension.height / 2 - loginHeight / 2 - 100;
  return (
    <div data-testid="login-page" className={classes.container} style={{ marginTop }}>
      <img src={fileUri(theme.palette.mode === 'dark' ? parameters.platform_dark_theme.logo_login_url : parameters.platform_light_theme.logo_login_url)} alt="logo"
        className={classes.logo}
      />
      <div className={classes.byFiligran} style={{ marginBottom: 20 }}>
        <img
          src={fileUri(theme.palette.mode === 'dark' ? byFiligranDark : byFiligranLight)}
          className={classes.byFiligranLogo}
        />
      </div>
      {isLocal && !reset && (
        <Paper variant="outlined" classes={{ root: classes.login }}>
          <LoginForm onSubmit={onSubmit} />
          <div style={{ marginBottom: 10, cursor: 'pointer' }}>
            <a onClick={() => setReset(true)}>{t('I forgot my password')}</a>
          </div>
        </Paper>
      )}
      {isLocal && reset && <Reset onCancel={() => setReset(false)} />}
      <Box
        sx={{
          marginTop: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2.5,
        }}
      >
        {(isOpenId || isSaml2) && [...(openidProviders ?? []), ...(saml2Providers ?? [])].map(
          (provider) => (
            <LoginSSOButton
              key={provider.provider_name}
              providerName={provider.provider_login}
              providerUri={provider.provider_uri}
            />
          ),
        )}
        <LoginError />
      </Box>
    </div>
  );
};

Login.propTypes = {
  t: PropTypes.func,
  demo: PropTypes.string,
  askToken: PropTypes.func,
  checkKerberos: PropTypes.func,
  classes: PropTypes.object,
  parameters: PropTypes.object,
};

const select = (state) => {
  const helper = storeHelper(state);
  const parameters = helper.getPlatformSettings() ?? {};
  return { parameters };
};

export default R.compose(
  connect(select, { askToken, checkKerberos, fetchParameters }),
  inject18n,
  withStyles(styles),
)(Login);
