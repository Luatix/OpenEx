import { ContentCopyOutlined, DownloadingOutlined, TerminalOutlined } from '@mui/icons-material';
import { Alert, Button, Card, CardActionArea, CardContent, Dialog, DialogContent, DialogTitle, FormControl, Grid, InputLabel, MenuItem, Select, Tab, Tabs, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Bash, DownloadCircleOutline, Powershell } from 'mdi-material-ui';
import * as R from 'ramda';
import { type SyntheticEvent, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { fetchExecutors } from '../../../actions/Executor';
import { type ExecutorHelper } from '../../../actions/executors/executor-helper';
import { type MeTokensHelper } from '../../../actions/helper';
import { meTokens } from '../../../actions/User';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Transition from '../../../components/common/Transition';
import { useFormatter } from '../../../components/i18n';
import PlatformIcon from '../../../components/PlatformIcon';
import { useHelper } from '../../../store';
import { type Executor } from '../../../utils/api-types';
import { useAppDispatch } from '../../../utils/hooks';
import useAuth from '../../../utils/hooks/useAuth';
import useDataLoader from '../../../utils/hooks/useDataLoader';
import { copyToClipboard, download } from '../../../utils/utils';
import ExecutorDocumentationLink from './ExecutorDocumentationLink';

const useStyles = makeStyles()(() => ({
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
}));

const Executors = () => {
  // Standard hooks
  const theme = useTheme();
  const { t } = useFormatter();
  const [platform, setPlatform] = useState<null | string>(null);
  const [selectedExecutors, setSelectedExecutors] = useState<null | Executor[]>(null);
  const [activeTab, setActiveTab] = useState<null | string>(null);
  const [agentFolder, setAgentFolder] = useState<null | string>(null);
  const [arch, setArch] = useState<string>('x86_64');
  const { classes } = useStyles();
  const dispatch = useAppDispatch();

  // Fetching data
  const { settings } = useAuth();
  const { executors, tokens } = useHelper((helper: ExecutorHelper & MeTokensHelper) => ({
    executors: helper.getExecutors(),
    tokens: helper.getMeTokens(),
  }));
  useDataLoader(() => {
    dispatch(fetchExecutors());
    dispatch(meTokens());
  });
  const userToken = tokens.length > 0 ? R.head(tokens) : undefined;
  const order = {
    openbas_agent: 1,
    openbas_caldera: 2,
    openbas_tanium: 3,
  };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const sortedExecutors = executors.map((executor: Executor) => ({ ...executor, order: order[executor.executor_type] })).sort(({ order: a }, { order: b }) => a - b);
  const windowsExecutors = sortedExecutors.filter((executor: Executor) => executor.executor_platforms?.includes('Windows'));
  const linuxExecutors = sortedExecutors.filter((executor: Executor) => executor.executor_platforms?.includes('Linux'));
  const macOsExecutors = sortedExecutors.filter((executor: Executor) => executor.executor_platforms?.includes('MacOS'));

  // Selection
  const handleTabChange = (_: SyntheticEvent, newValue: string) => {
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
    setArch('x86_64');
  };
  const currentSelectedExecutor = (selectedExecutors ?? []).filter(executor => executor.executor_type === activeTab).at(0);
  const platformSelector = () => {
    switch (platform) {
      case 'windows':
        return {
          icon: <Powershell />,
          label: 'powershell',
          defaultAgentFolder: 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera',
          exclusions: `${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}
${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe
MD5: 68c1795fb45cb9b522d6cf48443fdc37
SHA1: 5f87d06f818ff8cba9e11e8cd1c6f9d990eca0f8
SHA256: 6b180913acb8cdac3fb8d3154a2f6a0bed13c056a477f4f94c4679414ec13b9f
SHA512: 6185b7253eedfa6253f26cd85c4bcfaf05195219b6ab06b43d9b07279d7d0cdd3c957bd58d36058d7cde405bc8c5084f3ac060a6080bfc18a843738d3bee87fd`,
          displayedCode: `$server="${settings.executor_caldera_public_url}";
$url="${settings.platform_base_url}/api/implant/caldera/windows/${arch}";
$wc=New-Object System.Net.WebClient;
$data=$wc.DownloadData($url);
get-process | ? {$_.modules.filename -like '${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe'} | stop-process -f;
rm -force '${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe' -ea ignore;
New-Item -ItemType Directory -Force -Path '${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}' | Out-Null;
[io.file]::WriteAllBytes('${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe',$data) | Out-Null;
New-NetFirewallRule -DisplayName "Allow OpenBAS" -Direction Inbound -Program '${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe' -Action Allow | Out-Null;
New-NetFirewallRule -DisplayName "Allow OpenBAS" -Direction Outbound -Program '${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe' -Action Allow | Out-Null;
Start-Process -FilePath '${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe' -ArgumentList "-server $server -group red" -WindowStyle hidden;
schtasks /create /tn OpenBAS /sc onstart /ru system /tr "Powershell -ExecutionPolicy Bypass -Command \\\`"Start-Process -FilePath \\\\\\\`"${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe\\\\\\\`" -ArgumentList \\\\\\\`"-server $server -group red\\\\\\\`" -WindowStyle hidden;\\\`"";`,
          code: `$server="${settings.executor_caldera_public_url}";$url="${settings.platform_base_url}/api/implant/caldera/windows/${arch}";$wc=New-Object System.Net.WebClient;$data=$wc.DownloadData($url);get-process | ? {$_.modules.filename -like '${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe'} | stop-process -f;rm -force '${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe' -ea ignore;New-Item -ItemType Directory -Force -Path '${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}' | Out-Null;[io.file]::WriteAllBytes('${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe',$data) | Out-Null;New-NetFirewallRule -DisplayName "Allow OpenBAS" -Direction Inbound -Program '${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe' -Action Allow | Out-Null;New-NetFirewallRule -DisplayName "Allow OpenBAS" -Direction Outbound -Program '${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe' -Action Allow | Out-Null;Start-Process -FilePath '${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe' -ArgumentList "-server $server -group red" -WindowStyle hidden;schtasks /create /tn OpenBAS /sc onstart /ru system /tr "Powershell -NoProfile -ExecutionPolicy Bypass -Command \\\`"Start-Process -FilePath \\\\\\\`"${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Caldera'}\\obas-agent-caldera.exe\\\\\\\`" -ArgumentList \\\\\\\`"-server $server -group red\\\\\\\`" -WindowStyle hidden; \\\`"";`,
        };
      case 'linux':
        return {
          icon: <Bash />,
          label: 'sh',
          defaultAgentFolder: '/opt/openbas-caldera-agent',
          exclusions: `${agentFolder ?? '/opt/openbas-caldera-agent'}
${agentFolder ?? '/opt/openbas-caldera-agent/openbas-caldera-agent'}
MD5: d604c952bb3c6d96621594d39992c499
SHA1: 5b6087f87f5f2ae129f888bba799611836eb39a2
SHA256: 98d1e64445bbef46a36d4724699a386646de78881a1b6f2b346122c76d696c12
SHA512: ca07dc1d0a5297e29327e483f4f35dadb254d96a16a5c33da5ad048e6965a3863d621518a2be40f1a42226c68cbf5e779382a37ee5baa7dd7c538ec73ce059e8`,
          displayedCode: `server="${settings.executor_caldera_public_url}";
mkdir -p ${agentFolder ?? '/opt/openbas-caldera-agent'};
curl -s -X GET ${settings.platform_base_url}/api/implant/caldera/linux/${arch} > ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent;
chmod +x ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent;
nohup ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent -server $server -group red &`,
          code: `server="${settings.executor_caldera_public_url}";mkdir -p ${agentFolder ?? '/opt/openbas-caldera-agent'};curl -s -X GET ${settings.platform_base_url}/api/implant/caldera/linux/${arch} > ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent;chmod +x ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent;nohup ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent -server $server -group red &`,
        };
      case 'macos':
        return {
          icon: <TerminalOutlined />,
          label: 'sh',
          defaultAgentFolder: '/opt/openbas',
          exclusions: `${agentFolder ?? '/opt/openbas'}
${agentFolder ?? '/opt/openbas/openbas-caldera-agent'}
MD5: 1132906cc40001f51673108847b88d0c
SHA1: 3177df4a8fa13a2e13ce63670c579955ad55df3f
SHA256: 2b4397160925bf6b9dcca0949073fd9b2fc590ab641ea1d1c3d7d36048ed674a
SHA512: f1c8cf0c41c7d193bcb2aad21d7a739c785902c3231e15986b2eb37f911824a802f50cb2dbb509deba1c7a2a535fb7b34cf100303c61a6087102948628133747`,
          displayedCode: `server="${settings.executor_caldera_public_url}";
mkdir -p ${agentFolder ?? '/opt/openbas'};
curl -s -X GET ${settings.platform_base_url}/api/implant/caldera/macos/${arch} > ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent;
chmod +x ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent;
nohup ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent -server $server -group red &`,
          code: `server="${settings.executor_caldera_public_url}";mkdir -p ${agentFolder ?? '/opt/openbas-caldera-agent'};curl -s -X GET ${settings.platform_base_url}/api/implant/caldera/macos/${arch} > ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent;chmod +x ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent;nohup ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent -server $server -group red &`,
        };
      default:
        return {
          icon: <Bash />,
          label: 'sh',
          defaultAgentFolder: '/opt/openbas-caldera-agent',
          exclusions: `${agentFolder ?? '/opt/openbas-caldera-agent'}
${agentFolder ?? '/opt/openbas-caldera-agent/openbas-caldera-agent'}`,
          displayedCode: `server="${settings.executor_caldera_public_url}";
mkdir -p ${agentFolder ?? '/opt/openbas-caldera-agent'};
curl -s -X GET ${settings.platform_base_url}/api/implant/caldera/linux/${arch} > ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent;
chmod +x ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent;
nohup ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent -server $server -group red &`,
          code: `server="${settings.executor_caldera_public_url}";mkdir -p ${agentFolder ?? '/opt/openbas-caldera-agent'};curl -s -X GET ${settings.platform_base_url}/api/implant/caldera/linux/${arch} > ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent;chmod +x ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent;nohup ${agentFolder ?? '/opt/openbas-caldera-agent'}/openbas-caldera-agent -server $server -group red &`,
        };
    }
  };
  const platformAgentSelector = () => {
    switch (platform) {
      case 'windows':
        return {
          icon: <Powershell />,
          label: 'powershell',
          defaultAgentFolder: 'C:\\Program Files (x86)\\Filigran\\OBAS Agent',
          exclusions: `${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Agent'}
${agentFolder ?? 'C:\\Program Files (x86)\\Filigran\\OBAS Agent'}\\openbas-agent.exe

Caldera injector hashes:
MD5: 68c1795fb45cb9b522d6cf48443fdc37
SHA1: 5f87d06f818ff8cba9e11e8cd1c6f9d990eca0f8
SHA256: 6b180913acb8cdac3fb8d3154a2f6a0bed13c056a477f4f94c4679414ec13b9f
SHA512: 6185b7253eedfa6253f26cd85c4bcfaf05195219b6ab06b43d9b07279d7d0cdd3c957bd58d36058d7cde405bc8c5084f3ac060a6080bfc18a843738d3bee87fd`,
          displayedCode: `iex (iwr "${settings.platform_base_url}/api/agent/installer/openbas/windows/${userToken?.token_value}").Content`,
          code: `iex (iwr "${settings.platform_base_url}/api/agent/installer/openbas/windows/${userToken?.token_value}").Content`,
        };
      case 'linux':
        return {
          icon: <Bash />,
          label: 'sh',
          defaultAgentFolder: '/opt/openbas-agent',
          exclusions: `${agentFolder ?? '/opt/openbas-agent'}
${agentFolder ?? '/opt/openbas-agent/openbas-agent'}

Caldera injector hashes:
MD5: d604c952bb3c6d96621594d39992c499
SHA1: 5b6087f87f5f2ae129f888bba799611836eb39a2
SHA256: 98d1e64445bbef46a36d4724699a386646de78881a1b6f2b346122c76d696c12
SHA512: ca07dc1d0a5297e29327e483f4f35dadb254d96a16a5c33da5ad048e6965a3863d621518a2be40f1a42226c68cbf5e779382a37ee5baa7dd7c538ec73ce059e8`,
          displayedCode: `curl -s ${settings.platform_agent_url}/api/agent/installer/openbas/linux/${userToken?.token_value} | sudo sh`,
          code: `curl -s ${settings.platform_agent_url}/api/agent/installer/openbas/linux/${userToken?.token_value} | sudo sh`,
        };
      case 'macos':
        return {
          icon: <TerminalOutlined />,
          label: 'sh',
          defaultAgentFolder: '/opt/openbas-agent',
          exclusions: `${agentFolder ?? '/opt/openbas-agent'}
${agentFolder ?? '/opt/openbas-agent/openbas-agent'}

Caldera injector hashes:
MD5: 1132906cc40001f51673108847b88d0c
SHA1: 3177df4a8fa13a2e13ce63670c579955ad55df3f
SHA256: 2b4397160925bf6b9dcca0949073fd9b2fc590ab641ea1d1c3d7d36048ed674a
SHA512: f1c8cf0c41c7d193bcb2aad21d7a739c785902c3231e15986b2eb37f911824a802f50cb2dbb509deba1c7a2a535fb7b34cf100303c61a6087102948628133747`,
          displayedCode: `curl -s ${settings.platform_base_url}/api/agent/installer/openbas/macos/${userToken?.token_value} | sudo sh`,
          code: `curl -s ${settings.platform_base_url}/api/agent/installer/openbas/macos/${userToken?.token_value} | sudo sh`,
        };
      default:
        return {
          icon: <Bash />,
          label: 'sh',
          defaultAgentFolder: '/opt/openbas-agent',
          exclusions: `${agentFolder ?? '/opt/openbas-agent'}
${agentFolder ?? '/opt/openbas-agent/openbas-agent'}

Caldera injector hashes:
MD5: d604c952bb3c6d96621594d39992c499
SHA1: 5b6087f87f5f2ae129f888bba799611836eb39a2
SHA256: 98d1e64445bbef46a36d4724699a386646de78881a1b6f2b346122c76d696c12
SHA512: ca07dc1d0a5297e29327e483f4f35dadb254d96a16a5c33da5ad048e6965a3863d621518a2be40f1a42226c68cbf5e779382a37ee5baa7dd7c538ec73ce059e8`,
          displayedCode: `curl -s ${settings.platform_base_url}/api/agent/installer/openbas/linux/${userToken?.token_value} | sudo sh`,
          code: `curl -s ${settings.platform_base_url}/api/agent/installer/openbas/linux/${userToken?.token_value} | sudo sh`,
        };
    }
  };
  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Agents'), current: true }]} />
      <Alert variant="outlined" severity="info" style={{ marginBottom: 30 }}>
        {t('Here, you can download and install simulation agents available in your executors. Depending on the integrations you have enabled, some of them may be unavailable.')}
        <br />
        <br />
        {t('Learn more information about how to setup simulation agents')}
        {' '}
        <a href="https://docs.openbas.io" target="_blank" rel="noreferrer">{t('in the documentation')}</a>
        .
      </Alert>
      <Grid container={true} spacing={3}>
        <Grid item={true} xs={4}>
          <Card classes={{ root: classes.card }} variant="outlined">
            <CardActionArea classes={{ root: classes.area }} onClick={() => openInstall('windows', windowsExecutors)} disabled={windowsExecutors.length === 0}>
              <CardContent className={classes.content}>
                <div className={classes.icon}>
                  <PlatformIcon platform="Windows" />
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
                  <DownloadingOutlined style={{ marginRight: 10 }} />
                  {' '}
                  {t('Install Windows Agent')}
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
        <Grid item={true} xs={4}>
          <Card classes={{ root: classes.card }} variant="outlined">
            <CardActionArea classes={{ root: classes.area }} onClick={() => openInstall('linux', linuxExecutors)} disabled={linuxExecutors.length === 0}>
              <CardContent className={classes.content}>
                <div className={classes.icon}>
                  <PlatformIcon platform="Linux" />
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
                  <DownloadingOutlined style={{ marginRight: 10 }} />
                  {' '}
                  {t('Install Linux Agent')}
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
        <Grid item={true} xs={4}>
          <Card classes={{ root: classes.card }} variant="outlined">
            <CardActionArea classes={{ root: classes.area }} onClick={() => openInstall('macos', macOsExecutors)} disabled={macOsExecutors.length === 0}>
              <CardContent className={classes.content}>
                <div className={classes.icon}>
                  <PlatformIcon platform="MacOS" />
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
                  <DownloadingOutlined style={{ marginRight: 10 }} />
                  {' '}
                  {t('Install MacOS Agent')}
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
      </Grid>
      <Dialog
        open={platform !== null}
        TransitionComponent={Transition}
        onClose={closeInstall}
        PaperProps={{ elevation: 1 }}
        fullWidth={true}
        maxWidth="md"
      >
        <DialogTitle>{t('Install a simulation agent')}</DialogTitle>
        <DialogContent>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            {(selectedExecutors ?? []).map((executor) => {
              return (
                <Tab key={executor.executor_id} label={executor.executor_name} value={executor.executor_type} />
              );
            })}
          </Tabs>
          {currentSelectedExecutor && (
            <div style={{ marginTop: 20 }}>
              {currentSelectedExecutor.executor_type === 'openbas_caldera' && (
                <div style={{ marginTop: 20 }}>
                  {platform === 'macos' && (
                    <FormControl style={{ width: '100%' }}>
                      <InputLabel id="arch">{t('Architecture')}</InputLabel>
                      <Select
                        labelId="arch"
                        value={arch}
                        onChange={event => setArch(event.target.value ?? 'x86_64')}
                        fullWidth={true}
                      >
                        <MenuItem value="x86_64">{t('x86_64')}</MenuItem>
                        <MenuItem value="arm64">{t('arm64')}</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                  <Typography variant="h2" style={{ marginTop: 30 }}>{t('Step 1 - Install the agent')}</Typography>
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
                  <Typography variant="h2" style={{ marginTop: 30 }}>{t('Step 2 - Add antivirus exclusions')}</Typography>
                  <Alert variant="outlined" severity="info">
                    {t('The agent will never execute directly any payload.')}
                  </Alert>
                  <p>
                    {t('You will need to add proper antivirus exclusions for this agent (to ensure Caldera injects execution to work properly). It may not be necessary in the future but this is generally a good practice to ensure the agent will be always available.')}
                  </p>
                  <pre style={{ margin: '20px 0 10px 0' }}>{platformSelector().exclusions}</pre>
                </div>
              )}
              {currentSelectedExecutor.executor_type === 'openbas_agent' && (
                <div style={{ marginTop: 20 }}>
                  <Typography variant="h2" style={{ marginTop: 30 }}>{t('Step 1 - Install the agent')}</Typography>
                  <Alert variant="outlined" severity="info">
                    {t('Installing the agent is requiring local administrator privileges.')}
                  </Alert>
                  {platform === 'windows' && (
                    <>
                      <p>
                        {t('You can whether directly copy and paste the following Powershell snippet in an elevated prompt or download the .ps1 script (and execute it as an administrator).')}
                      </p>
                      <pre style={{ margin: '20px 0 10px 0' }}>{platformAgentSelector().displayedCode}</pre>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        <Button variant="outlined" style={{ marginBottom: 20 }} startIcon={<ContentCopyOutlined />} onClick={() => copyToClipboard(t, platformAgentSelector().code)}>{t('Copy')}</Button>
                        <Button variant="outlined" style={{ marginBottom: 20 }} startIcon={<DownloadCircleOutline />} onClick={() => download(platformAgentSelector().displayedCode, 'openbas.ps1', 'text/plain')}>{t('Download')}</Button>
                      </div>
                    </>
                  )}
                  {platform !== 'windows' && (
                    <>
                      <p>
                        {t('You can whether directly copy and paste the following bash snippet in a root console or download the .sh script (and execute it as root).')}
                      </p>
                      <pre style={{ margin: '20px 0 10px 0' }}>{platformAgentSelector().displayedCode}</pre>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        <Button variant="outlined" style={{ marginBottom: 20 }} startIcon={<ContentCopyOutlined />} onClick={() => copyToClipboard(t, platformAgentSelector().code)}>{t('Copy')}</Button>
                        <Button variant="outlined" style={{ marginBottom: 20 }} startIcon={<DownloadCircleOutline />} onClick={() => download(platformAgentSelector().displayedCode, 'openbas.sh', 'text/plain')}>{t('Download')}</Button>
                      </div>
                    </>
                  )}
                  <Typography variant="h2" style={{ marginTop: 30 }}>{t('Step 2 - Add antivirus exclusions')}</Typography>
                  <Alert variant="outlined" severity="info">
                    {t('The agent will never execute directly any payload.')}
                  </Alert>
                  <p>
                    {t('You will need to add proper antivirus exclusions for this agent (to ensure Caldera injects execution to work properly). It may not be necessary in the future but this is generally a good practice to ensure the agent will be always available.')}
                  </p>
                  <pre style={{ margin: '20px 0 10px 0' }}>{platformAgentSelector().exclusions}</pre>
                </div>
              )}
              <ExecutorDocumentationLink executor={currentSelectedExecutor} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Executors;
