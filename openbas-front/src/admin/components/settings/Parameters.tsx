import { Button, Grid, List, ListItem, ListItemText, Paper, Switch, TextField, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import {
  fetchPlatformParameters,
  updatePlatformDarkParameters,
  updatePlatformEnterpriseEditionParameters,
  updatePlatformLightParameters,
  updatePlatformParameters,
  updatePlatformWhitemarkParameters,
} from '../../../actions/Application';
import { type LoggedHelper } from '../../../actions/helper';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { useFormatter } from '../../../components/i18n';
import ItemBoolean from '../../../components/ItemBoolean';
import { useHelper } from '../../../store';
import { type PlatformSettings, type SettingsEnterpriseEditionUpdateInput, type SettingsPlatformWhitemarkUpdateInput, type SettingsUpdateInput, type ThemeInput } from '../../../utils/api-types';
import { useAppDispatch } from '../../../utils/hooks';
import useDataLoader from '../../../utils/hooks/useDataLoader';
import EnterpriseEditionButton from '../common/entreprise_edition/EnterpriseEditionButton';
import ParametersForm from './ParametersForm';
import ThemeForm from './ThemeForm';

const useStyles = makeStyles()(() => ({
  container: {
    margin: '0 0 60px 0',
  },
  paper: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: 20,
    borderRadius: 4,
  },
  button: {
    float: 'right',
    marginTop: -12,
  },
}));

const Parameters = () => {
  const { classes } = useStyles();
  const dispatch = useAppDispatch();
  const { t } = useFormatter();
  const { settings }: { settings: PlatformSettings } = useHelper((helper: LoggedHelper) => ({
    settings: helper.getPlatformSettings(),
  }));
  const isEnterpriseEdition = settings.platform_enterprise_edition === 'true';
  useDataLoader(() => {
    dispatch(fetchPlatformParameters());
  });

  const initialValuesDark = {
    accent_color: settings.platform_dark_theme?.accent_color ?? '',
    background_color: settings.platform_dark_theme?.background_color ?? '',
    logo_login_url: settings.platform_dark_theme?.logo_login_url ?? '',
    logo_url: settings.platform_dark_theme?.logo_url ?? '',
    logo_url_collapsed: settings.platform_dark_theme?.logo_url_collapsed ?? '',
    navigation_color: settings.platform_dark_theme?.navigation_color ?? '',
    paper_color: settings.platform_dark_theme?.paper_color ?? '',
    primary_color: settings.platform_dark_theme?.primary_color ?? '',
    secondary_color: settings.platform_dark_theme?.secondary_color ?? '',
  };

  const initialValuesLight = {
    accent_color: settings.platform_light_theme?.accent_color ?? '',
    background_color: settings.platform_light_theme?.background_color ?? '',
    logo_login_url: settings.platform_light_theme?.logo_login_url ?? '',
    logo_url: settings.platform_light_theme?.logo_url ?? '',
    logo_url_collapsed: settings.platform_light_theme?.logo_url_collapsed ?? '',
    navigation_color: settings.platform_light_theme?.navigation_color ?? '',
    paper_color: settings.platform_light_theme?.paper_color ?? '',
    primary_color: settings.platform_light_theme?.primary_color ?? '',
    secondary_color: settings.platform_light_theme?.secondary_color ?? '',
  };

  const onUpdate = (data: SettingsUpdateInput) => dispatch(updatePlatformParameters(data));
  const onUpdateLigthParameters = (data: ThemeInput) => dispatch(updatePlatformLightParameters(data));
  const onUpdateDarkParameters = (data: ThemeInput) => dispatch(updatePlatformDarkParameters(data));
  const updateEnterpriseEdition = (data: SettingsEnterpriseEditionUpdateInput) => dispatch(updatePlatformEnterpriseEditionParameters(data));
  const updatePlatformWhitemark = (data: SettingsPlatformWhitemarkUpdateInput) => dispatch(updatePlatformWhitemarkParameters(data));
  return (
    <div className={classes.container}>
      <Breadcrumbs variant="object" elements={[{ label: t('Settings') }, { label: t('Parameters'), current: true }]} />
      <Grid container={true} spacing={3}>
        <Grid item={true} xs={6}>
          <Typography variant="h4" gutterBottom={true}>{t('Configuration')}</Typography>
          <Paper variant="outlined" classes={{ root: classes.paper }} style={{ marginTop: 15 }}>
            <ParametersForm
              onSubmit={onUpdate}
              initialValues={{
                platform_name: settings?.platform_name,
                platform_theme: settings?.platform_theme,
                platform_lang: settings?.platform_lang,
              }}
            />
          </Paper>
        </Grid>
        <Grid item={true} xs={6}>
          <Typography variant="h4" gutterBottom={true} style={{ float: 'left' }}>
            {t('OpenBAS platform')}
          </Typography>
          {!isEnterpriseEdition ? (
            <EnterpriseEditionButton inLine />
          ) : (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => updateEnterpriseEdition({ platform_enterprise_edition: 'false' })}
              classes={{ root: classes.button }}
            >
              {t('Disable Enterprise Edition')}
            </Button>
          )}
          <div className="clearfix" />
          <Paper variant="outlined" classes={{ root: classes.paper }}>
            <List style={{ marginTop: -20 }}>
              <ListItem divider={true}>
                <ListItemText primary={t('Version')} />
                <ItemBoolean variant="large" status={null} neutralLabel={settings?.platform_version?.replace('-SNAPSHOT', '')} />
              </ListItem>
              <ListItem divider={true}>
                <ListItemText primary={t('Edition')} />
                <ItemBoolean
                  variant="large"
                  neutralLabel={
                    isEnterpriseEdition
                      ? t('Enterprise')
                      : t('Community')
                  }
                  status={null}
                />
              </ListItem>
              <ListItem divider={true}>
                <ListItemText
                  primary={t('AI Powered')}
                />
                <ItemBoolean
                  variant="large"
                  label={
                    // eslint-disable-next-line no-nested-ternary
                    !settings.platform_ai_enabled ? t('Disabled') : settings.platform_ai_has_token
                      ? settings.platform_ai_type
                      : `${settings.platform_ai_type} - ${t('Missing token')}`
                  }
                  status={(settings.platform_ai_enabled) && (settings.platform_ai_has_token)}
                  tooltip={settings.platform_ai_has_token ? `${settings.platform_ai_type} - ${settings.platform_ai_model}` : t('The token is missing in your platform configuration, please ask your Filigran representative to provide you with it or with on-premise deployment instructions. Your can open a support ticket to do so.')}
                />
              </ListItem>
              <ListItem divider={true}>
                <TextField fullWidth={true} label={t('Filigran support key')} variant="standard" disabled={true} />
              </ListItem>
              <ListItem divider={true}>
                <ListItemText primary={t('Remove Filigran logos')} />
                <Switch
                  disabled={settings.platform_enterprise_edition === 'false'}
                  checked={settings.platform_whitemark === 'true'}
                  onChange={(_event, checked) => updatePlatformWhitemark({ platform_whitemark: checked.toString() })}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        <Grid item={true} xs={4} style={{ marginTop: 25 }}>
          <Typography variant="h4">{t('Dark theme')}</Typography>
          <Paper variant="outlined" classes={{ root: classes.paper }}>
            <ThemeForm
              onSubmit={onUpdateDarkParameters}
              initialValues={initialValuesDark}
            />
          </Paper>
        </Grid>
        <Grid item={true} xs={4} style={{ marginTop: 25 }}>
          <Typography variant="h4">{t('Light theme')}</Typography>
          <Paper variant="outlined" classes={{ root: classes.paper }}>
            <ThemeForm
              onSubmit={onUpdateLigthParameters}
              initialValues={initialValuesLight}
            />
          </Paper>
        </Grid>
        <Grid item={true} xs={4} style={{ marginTop: 25 }}>
          <Typography variant="h4">{t('Tools')}</Typography>
          <Paper variant="outlined" classes={{ root: classes.paper }}>
            <List style={{ paddingTop: 0 }}>
              <ListItem divider={true}>
                <ListItemText primary={t('JAVA Virtual Machine')} />
                <ItemBoolean status={null} variant="large" neutralLabel={settings?.java_version} />
              </ListItem>
              <ListItem divider={true}>
                <ListItemText primary={t('PostgreSQL')} />
                <ItemBoolean status={null} variant="large" neutralLabel={settings?.postgre_version} />
              </ListItem>
              <ListItem divider={true}>
                <ListItemText primary={t('RabbitMQ')} />
                <ItemBoolean status={null} variant="large" neutralLabel={settings?.rabbitmq_version} />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Parameters;
