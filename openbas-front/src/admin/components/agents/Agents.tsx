import React, { useState } from 'react';
import { makeStyles, useTheme } from '@mui/styles';
import {
  Alert,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { ArticleOutlined, ContentCopyOutlined, DownloadingOutlined, TerminalOutlined } from '@mui/icons-material';
import { Bash, DownloadCircleOutline, Powershell } from 'mdi-material-ui';
import { useFormatter } from '../../../components/i18n';
import { useHelper } from '../../../store';
import useDataLoader from '../../../utils/hooks/useDataLoader';
import { useAppDispatch } from '../../../utils/hooks';
import type { Executor } from '../../../utils/api-types';
import type { ExecutorHelper } from '../../../actions/executors/executor-helper';
import { fetchExecutors } from '../../../actions/Executor';
import useSearchAnFilter from '../../../utils/SortingFiltering';
import type { Theme } from '../../../components/Theme';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Transition from '../../../components/common/Transition';
import { copyToClipboard, download } from '../../../utils/utils';
import useAuth from '../../../utils/hooks/useAuth';
import PlatformIcon from '../../../components/PlatformIcon';

const useStyles = makeStyles(() => ({
  card: {
    overflow: 'hidden',
    height: 250,
  },
  area: {
    width: '100%',
    height: '100%',
  },
  content: {
    position: 'relative',
    padding: 20,
    textAlign: 'center',
  },
  icon: {
    padding: 0,
  },
  chip: {
    height: 30,
    fontSize: 12,
    borderRadius: 4,
    marginBottom: 10,
  },
}));

const Executors = () => {
  // Standard hooks
  const theme = useTheme<Theme>();
  const { t } = useFormatter();
  const [platform, setPlatform] = useState<null | string>(null);
  const [selectedExecutors, setSelectedExecutors] = useState<null | Executor[]>(null);
  const [activeTab, setActiveTab] = useState<null | string>(null);
  const [agentFolder, setAgentFolder] = useState<null | string>(null);
  const [arch, setArch] = useState<string>('amd64');
  const classes = useStyles();
  const dispatch = useAppDispatch();

  // Filter and sort hook
  const searchColumns = ['name', 'description'];
  const filtering = useSearchAnFilter(
    'executor',
    'name',
    searchColumns,
  );

  // Fetching data
  const { settings } = useAuth();
  const { executors } = useHelper((helper: ExecutorHelper) => ({
    executors: helper.getExecutors(),
  }));
  useDataLoader(() => {
    dispatch(fetchExecutors());
  });
  const sortedExecutors = filtering.filterAndSort(executors);
  const windowsExecutors = sortedExecutors.filter((executor: Executor) => executor.executor_platforms?.includes('Windows'));
  const linuxExecutors = sortedExecutors.filter((executor: Executor) => executor.executor_platforms?.includes('Linux'));
  const macOsExecutors = sortedExecutors.filter((executor: Executor) => executor.executor_platforms?.includes('MacOS'));
  const browserExecutors = sortedExecutors.filter((executor: Executor) => executor.executor_platforms?.some((n) => ['Chrome', 'Firefox', 'Edge', 'Safari'].includes(n)));

  // Selection
  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };
  const openInstall = (selectedPlatform: string, openExecutors: Executor[]) => {
    setPlatform(selectedPlatform);
    setSelectedExecutors(openExecutors);
    setActiveTab((openExecutors ?? []).at(0)?.executor_type ?? null);
  };
  const closeInstall = () => {
    setPlatform(null);
    setSelectedExecutors(null);
    setActiveTab(null);
    setAgentFolder(null);
    setArch('amd64');
  };
  const currentSelectedExecutor = (selectedExecutors ?? []).filter((executor) => executor.executor_type === activeTab).at(0);
  const platformSelector = () => {
    switch (platform) {
      case 'windows':
        return {
          icon: <Powershell />,
          label: 'powershell',
          defaultAgentFolder: 'C:\\Program Files\\OpenBAS',
          exclusions: `${agentFolder ?? 'C:\\Program Files\\OpenBAS'}
${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe
MD5: 68c1795fb45cb9b522d6cf48443fdc37
SHA1: 5f87d06f818ff8cba9e11e8cd1c6f9d990eca0f8
SHA256: 6b180913acb8cdac3fb8d3154a2f6a0bed13c056a477f4f94c4679414ec13b9f
SHA512: 6185b7253eedfa6253f26cd85c4bcfaf05195219b6ab06b43d9b07279d7d0cdd3c957bd58d36058d7cde405bc8c5084f3ac060a6080bfc18a843738d3bee87fd`,
          displayedCode: `$server="${settings.executor_caldera_public_url}";
$url="${settings.platform_base_url}/api/agent/windows";
$wc=New-Object System.Net.WebClient;
$data=$wc.DownloadData($url);
get-process | ? {$_.modules.filename -like '${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe'} | stop-process -f;
rm -force '${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe' -ea ignore;
New-Item -ItemType Directory -Force -Path '${agentFolder ?? 'C:\\Program Files\\OpenBAS'}' | Out-Null;
[io.file]::WriteAllBytes('${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe',$data) | Out-Null;
New-NetFirewallRule -DisplayName "Allow OpenBAS" -Direction Inbound -Program '${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe' -Action Allow | Out-Null;
New-NetFirewallRule -DisplayName "Allow OpenBAS" -Direction Outbound -Program '${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe' -Action Allow | Out-Null;
Start-Process -FilePath '${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe' -ArgumentList "-server $server -group red" -WindowStyle hidden;
schtasks /create /tn OpenBAS /sc onstart /ru system /tr "Powershell -NoProfile -ExecutionPolicy Bypass -Command \\\`"Start-Process -FilePath \\\\\\\`"${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe\\\\\\\`" -ArgumentList \\\\\\\`"-server $server -group red\\\\\\\`" -WindowStyle hidden; \\\`"";`,
          code: `$server="${settings.executor_caldera_public_url}";$url="${settings.platform_base_url}/api/agent/windows";$wc=New-Object System.Net.WebClient;$data=$wc.DownloadData($url);get-process | ? {$_.modules.filename -like '${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe'} | stop-process -f;rm -force '${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe' -ea ignore;New-Item -ItemType Directory -Force -Path '${agentFolder ?? 'C:\\Program Files\\OpenBAS'}' | Out-Null;[io.file]::WriteAllBytes('${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe',$data) | Out-Null;New-NetFirewallRule -DisplayName "Allow OpenBAS" -Direction Inbound -Program '${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe' -Action Allow | Out-Null;New-NetFirewallRule -DisplayName "Allow OpenBAS" -Direction Outbound -Program '${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe' -Action Allow | Out-Null;Start-Process -FilePath '${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe' -ArgumentList "-server $server -group red" -WindowStyle hidden;schtasks /create /tn OpenBAS /sc onstart /ru system /tr "Powershell -NoProfile -ExecutionPolicy Bypass -Command \\\`"Start-Process -FilePath \\\\\\\`"${agentFolder ?? 'C:\\Program Files\\OpenBAS'}\\obas.exe\\\\\\\`" -ArgumentList \\\\\\\`"-server $server -group red\\\\\\\`" -WindowStyle hidden; \\\`"";`,
        };
      case 'linux':
        return {
          icon: <Bash />,
          label: 'sh',
          defaultAgentFolder: '/opt/openbas',
          exclusions: `${agentFolder ?? '/opt/openbas'}
${agentFolder ?? '/opt/openbas/obas'}
MD5: d604c952bb3c6d96621594d39992c499
SHA1: 5b6087f87f5f2ae129f888bba799611836eb39a2
SHA256: 98d1e64445bbef46a36d4724699a386646de78881a1b6f2b346122c76d696c12
SHA512: ca07dc1d0a5297e29327e483f4f35dadb254d96a16a5c33da5ad048e6965a3863d621518a2be40f1a42226c68cbf5e779382a37ee5baa7dd7c538ec73ce059e8`,
          displayedCode: `server="${settings.executor_caldera_public_url}";
mkdir -p ${agentFolder ?? '/opt/openbas'};
curl -s -X GET ${settings.platform_base_url}/api/agent/linux > ${agentFolder ?? '/opt/openbas'}/obas;
chmod +x ${agentFolder ?? '/opt/openbas'}/obas;
nohup ${agentFolder ?? '/opt/openbas'}/obas -server $server -group red &`,
          code: `server="${settings.executor_caldera_public_url}";mkdir -p ${agentFolder ?? '/opt/openbas'};curl -s -X GET ${settings.platform_base_url}/api/agent/linux > ${agentFolder ?? '/opt/openbas'}/obas;chmod +x ${agentFolder ?? '/opt/openbas'}/obas;nohup ${agentFolder ?? '/opt/openbas'}/obas -server $server -group red &`,
        };
      case 'macos':
        return {
          icon: <TerminalOutlined />,
          label: 'sh',
          defaultAgentFolder: '/opt/openbas',
          exclusions: `${agentFolder ?? '/opt/openbas'}
${agentFolder ?? '/opt/openbas/obas'}
MD5: 1132906cc40001f51673108847b88d0c
SHA1: 3177df4a8fa13a2e13ce63670c579955ad55df3f
SHA256: 2b4397160925bf6b9dcca0949073fd9b2fc590ab641ea1d1c3d7d36048ed674a
SHA512: f1c8cf0c41c7d193bcb2aad21d7a739c785902c3231e15986b2eb37f911824a802f50cb2dbb509deba1c7a2a535fb7b34cf100303c61a6087102948628133747`,
          displayedCode: `server="${settings.executor_caldera_public_url}";
mkdir -p ${agentFolder ?? '/opt/openbas'};
curl -s -X GET ${settings.platform_base_url}/api/agent/macos > ${agentFolder ?? '/opt/openbas'}/obas;
chmod +x ${agentFolder ?? '/opt/openbas'}/obas;
nohup ${agentFolder ?? '/opt/openbas'}/obas -server $server -group red &`,
          code: `server="${settings.executor_caldera_public_url}";mkdir -p ${agentFolder ?? '/opt/openbas'};curl -s -X GET ${settings.platform_base_url}/api/agent/macos > ${agentFolder ?? '/opt/openbas'}/obas;chmod +x ${agentFolder ?? '/opt/openbas'}/obas;nohup ${agentFolder ?? '/opt/openbas'}/obas -server $server -group red &`,
        };
      default:
        return {
          icon: <Bash />,
          label: 'sh',
          defaultAgentFolder: '/opt/openbas',
          exclusions: `${agentFolder ?? '/opt/openbas'}
${agentFolder ?? '/opt/openbas/obas'}`,
          displayedCode: `server="${settings.executor_caldera_public_url}";
mkdir -p ${agentFolder ?? '/opt/openbas'};
curl -s -X GET ${settings.platform_base_url}/api/agent/linux > ${agentFolder ?? '/opt/openbas'}/obas;
chmod +x ${agentFolder ?? '/opt/openbas'}/obas;
nohup ${agentFolder ?? '/opt/openbas'}/obas -server $server -group red &`,
          code: `server="${settings.executor_caldera_public_url}";mkdir -p ${agentFolder ?? '/opt/openbas'};curl -s -X GET ${settings.platform_base_url}/api/agent/linux > ${agentFolder ?? '/opt/openbas'}/obas;chmod +x ${agentFolder ?? '/opt/openbas'}/obas;nohup ${agentFolder ?? '/opt/openbas'}/obas -server $server -group red &`,
        };
    }
  };
  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Agents'), current: true }]} />
      <Alert variant="outlined" severity="info" style={{ marginBottom: 30 }}>
        {t('Here, you can download and install simulation agents available in your executors. Depending on the integrations you have enabled, some of them may be unavailable. In the near future, we will release the XTM agent with a proper packaging and certificates.')}<br /><br />
        {t('Learn more information about how to setup simulation agents')} <a href="https://docs.openbas.io" target="_blank" rel="noreferrer">{t('in the documentation')}</a>.
      </Alert>
      <Grid container={true} spacing={3}>
        <Grid item={true} xs={3}>
          <Card classes={{ root: classes.card }} variant="outlined">
            <CardActionArea classes={{ root: classes.area }} onClick={() => openInstall('windows', windowsExecutors)} disabled={windowsExecutors.length === 0}>
              <CardContent className={classes.content}>
                <div className={classes.icon}>
                  <PlatformIcon platform='Windows' width={40} />
                </div>
                <Typography
                  variant="h6"
                  style={{
                    fontSize: 15,
                    margin: '20px 0 40px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: windowsExecutors.length === 0 ? theme.palette.text?.disabled : theme.palette.text?.primary,
                  }}
                >
                  <DownloadingOutlined style={{ marginRight: 10 }} /> Install Windows Agent
                </Typography>
                <div style={{ position: 'absolute', width: '100%', right: 0, bottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {windowsExecutors.map((executor: Executor) => {
                    return (
                      <img
                        key={executor.executor_id}
                        src={`/api/images/executors/${executor.executor_type}`}
                        alt={executor.executor_type}
                        style={{ width: 30, height: 30, borderRadius: 4, margin: '0 10px 0 10px' }}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item={true} xs={3}>
          <Card classes={{ root: classes.card }} variant="outlined">
            <CardActionArea classes={{ root: classes.area }} onClick={() => openInstall('linux', linuxExecutors)} disabled={linuxExecutors.length === 0}>
              <CardContent className={classes.content}>
                <div className={classes.icon}>
                  <PlatformIcon platform="Linux" width={40} />
                </div>
                <Typography
                  variant="h6"
                  style={{
                    fontSize: 15,
                    margin: '20px 0 40px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: linuxExecutors.length === 0 ? theme.palette.text?.disabled : theme.palette.text?.primary,
                  }}
                >
                  <DownloadingOutlined style={{ marginRight: 10 }} /> Install Linux Agent
                </Typography>
                <div style={{ position: 'absolute', width: '100%', right: 0, bottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {linuxExecutors.map((executor: Executor) => {
                    return (
                      <img
                        key={executor.executor_id}
                        src={`/api/images/executors/${executor.executor_type}`}
                        alt={executor.executor_type}
                        style={{ width: 30, height: 30, borderRadius: 4, margin: '0 10px 0 10px' }}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item={true} xs={3}>
          <Card classes={{ root: classes.card }} variant="outlined">
            <CardActionArea classes={{ root: classes.area }} onClick={() => openInstall('macos', macOsExecutors)} disabled={macOsExecutors.length === 0}>
              <CardContent className={classes.content}>
                <div className={classes.icon}>
                  <PlatformIcon platform="MacOS" width={40} />
                </div>
                <Typography
                  variant="h6"
                  style={{
                    fontSize: 15,
                    margin: '20px 0 40px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: macOsExecutors.length === 0 ? theme.palette.text?.disabled : theme.palette.text?.primary,
                  }}
                >
                  <DownloadingOutlined style={{ marginRight: 10 }} /> Install MacOS Agent
                </Typography>
                <div style={{ position: 'absolute', width: '100%', right: 0, bottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {macOsExecutors.map((executor: Executor) => {
                    return (
                      <img
                        key={executor.executor_id}
                        src={`/api/images/executors/${executor.executor_type}`}
                        alt={executor.executor_type}
                        style={{ width: 30, height: 30, borderRadius: 4, margin: '0 10px 0 10px' }}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item={true} xs={3}>
          <Card classes={{ root: classes.card }} variant="outlined">
            <CardActionArea classes={{ root: classes.area }} onClick={() => openInstall('browser', browserExecutors)} disabled={browserExecutors.length === 0}>
              <CardContent className={classes.content}>
                <div className={classes.icon}>
                  <PlatformIcon platform="Browser" width={40} />
                </div>
                <Typography
                  variant="h6"
                  style={{
                    fontSize: 15,
                    margin: '20px 0 40px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: browserExecutors.length === 0 ? theme.palette.text?.disabled : theme.palette.text?.primary,
                  }}
                >
                  <DownloadingOutlined style={{ marginRight: 10 }} /> Install Browser Agent
                </Typography>
                <div style={{ position: 'absolute', width: '100%', right: 0, bottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {browserExecutors.map((executor: Executor) => {
                    return (
                      <img
                        key={executor.executor_id}
                        src={`/api/images/executors/${executor.executor_type}`}
                        alt={executor.executor_type}
                        style={{ width: 30, height: 30, borderRadius: 4, margin: '0 10px 0 10px' }}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
      <Dialog
        open={platform !== null}
        TransitionComponent={Transition}
        onClose={closeInstall}
        PaperProps={{ elevation: 1 }}
        fullWidth={true}
        maxWidth="md"
      >
        <DialogTitle>Install a simulation agent</DialogTitle>
        <DialogContent>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            {(selectedExecutors ?? []).map((executor) => {
              return (
                <Tab key={executor.executor_id} label={executor.executor_name} value={executor.executor_type}/>
              );
            })}
          </Tabs>
          {currentSelectedExecutor && (
          <div style={{ marginTop: 20 }}>
            {currentSelectedExecutor.executor_name === 'Caldera' ? (
              <div style={{ marginTop: 20 }}>
                <Alert variant="outlined" severity="info">
                  {t('For the moment, OpenBAS is using Caldera as an agent to execute the sequence of security validations. In the future, the Filigran XTM agent will replace it.')}
                </Alert>
                <TextField
                  label={t('Installation path')}
                  fullWidth={true}
                  value={agentFolder ?? platformSelector().defaultAgentFolder}
                  onChange={(event) => setAgentFolder(event.target.value)}
                  style={{ marginTop: 20 }}
                />
                {platform === 'macos' && (
                  <FormControl style={{ width: '100%', marginTop: 20 }}>
                    <InputLabel id="arch">{t('Architecture')}</InputLabel>
                    <Select
                      labelId="arch"
                      value={arch}
                      onChange={(event) => setArch(event.target.value ?? 'amd64')}
                      fullWidth={true}
                    >
                      <MenuItem value="amd64">{t('AMD64')}</MenuItem>
                      <MenuItem value="arm64">{t('ARM64')}</MenuItem>
                    </Select>
                  </FormControl>
                )}
                <Typography variant="h2" style={{ marginTop: 30 }}>{t('Step 1 - Add antivirus exclusions')}</Typography>
                <Alert variant="outlined" severity="info">
                  {t('The agent will never execute directly any payload.')}
                </Alert>
                <p>
                  {t('You will need to add proper antivirus exclusion for this agent. It may not be necessary in the future with the signed XTM agent but this is generally a good practice to ensure the agent will be always available.')}
                </p>
                <pre style={{ margin: '20px 0 10px 0' }}>{platformSelector().exclusions}</pre>
                <Typography variant="h2" style={{ marginTop: 30 }}>{t('Step 2 - Install the agent')}</Typography>
                <Alert variant="outlined" severity="info">
                  {t('Installing the agent is requiring local administrator privileges.')}
                </Alert>
                {platform === 'windows' && (
                  <>
                    <p>
                      {t('You can whether directly copy and paste the following Powershell snippet in an elevated prompt or download the .ps1 script (and execute it as an administrator).')}
                    </p>
                    <pre style={{ margin: '20px 0 10px 0' }}>{platformSelector().displayedCode}</pre>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                      <Button variant="outlined" style={{ marginBottom: 20 }} startIcon={<ContentCopyOutlined />} onClick={() => copyToClipboard(t, platformSelector().code)}>{t('Copy')}</Button>
                      <Button variant="outlined" style={{ marginBottom: 20 }} startIcon={<DownloadCircleOutline />} onClick={() => download(platformSelector().displayedCode, 'openbas.ps1', 'text/plain')}>{t('Download')}</Button>
                    </div>
                  </>
                )}
                {platform !== 'windows' && (
                <>
                  <p>
                    {t('You can whether directly copy and paste the following bash snippet in a root console or download the .sh script (and execute it as root).')}
                  </p>
                  <Alert variant="outlined" severity="warning">
                    {t('For the moment, the following snippet or script will not add the agent at boot. Please be sure to add it in rc.local or other files to make it persistent. We will release proper packages in the near future.')}
                  </Alert>
                  <pre style={{ margin: '20px 0 10px 0' }}>{platformSelector().displayedCode}</pre>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                    <Button variant="outlined" style={{ marginBottom: 20 }} startIcon={<ContentCopyOutlined />} onClick={() => copyToClipboard(t, platformSelector().code)}>{t('Copy')}</Button>
                    <Button variant="outlined" style={{ marginBottom: 20 }} startIcon={<DownloadCircleOutline />} onClick={() => download(platformSelector().displayedCode, 'openbas.sh', 'text/plain')}>{t('Download')}</Button>
                  </div>
                </>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 20 }}>
                <Chip
                  variant="outlined"
                  icon={<ArticleOutlined />}
                  classes={{ root: classes.chip }}
                  label={t('documentation')}
                />
                <Typography variant="body1" style={{ marginBottom: 20 }}>
                  To install the agent please follow the <a target="_blank" href={currentSelectedExecutor.executor_doc} rel="noreferrer">{currentSelectedExecutor.executor_name} documentation</a>.
                </Typography>
              </div>
            )}
          </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Executors;
