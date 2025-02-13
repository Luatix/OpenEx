import { UpdateOutlined } from '@mui/icons-material';
import { Alert, AlertTitle, Box, IconButton, Tab, Tabs, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import cronstrue from 'cronstrue';
import { type FunctionComponent, lazy, Suspense, useState } from 'react';
import { Link, Route, Routes, useLocation, useParams } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { fetchScenario } from '../../../../actions/scenarios/scenario-actions';
import { type ScenariosHelper } from '../../../../actions/scenarios/scenario-helper';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import { errorWrapper } from '../../../../components/Error';
import { useFormatter } from '../../../../components/i18n';
import Loader from '../../../../components/Loader';
import NotFound from '../../../../components/NotFound';
import { useHelper } from '../../../../store';
import { type Scenario } from '../../../../utils/api-types';
import { parseCron, type ParsedCron } from '../../../../utils/Cron';
import { useAppDispatch } from '../../../../utils/hooks';
import useDataLoader from '../../../../utils/hooks/useDataLoader';
import useScenarioPermissions from '../../../../utils/Scenario';
import { DocumentContext, type DocumentContextType, InjectContext, PermissionsContext, type PermissionsContextType } from '../../common/Context';
import injectContextForScenario from './ScenarioContext';
import ScenarioHeader from './ScenarioHeader';

const ScenarioComponent = lazy(() => import('./Scenario'));
const ScenarioDefinition = lazy(() => import('./ScenarioDefinition'));
const Injects = lazy(() => import('./injects/ScenarioInjects'));
const Tests = lazy(() => import('./tests/ScenarioTests'));
const Lessons = lazy(() => import('./lessons/ScenarioLessons'));

// eslint-disable-next-line no-underscore-dangle
const _MS_PER_DAY = 1000 * 60 * 60 * 24;

const useStyles = makeStyles()(() => ({
  scheduling: {
    display: 'flex',
    margin: '-35px 8px 0 0',
    float: 'right',
    alignItems: 'center',
  },
}));

const IndexScenarioComponent: FunctionComponent<{ scenario: Scenario }> = ({
  scenario,
}) => {
  const { t, ft, locale, fld } = useFormatter();
  const location = useLocation();
  const theme = useTheme();
  const { classes } = useStyles();
  const permissionsContext: PermissionsContextType = {
    permissions: useScenarioPermissions(scenario.scenario_id),
  };
  const documentContext: DocumentContextType = {
    onInitDocument: () => ({
      document_tags: [],
      document_scenarios: scenario ? [{ id: scenario.scenario_id, label: scenario.scenario_name }] : [],
      document_exercises: [],
    }),
  };
  let tabValue = location.pathname;
  if (location.pathname.includes(`/admin/scenarios/${scenario.scenario_id}/definition`)) {
    tabValue = `/admin/scenarios/${scenario.scenario_id}/definition`;
  } else if (location.pathname.includes(`/admin/scenarios/${scenario.scenario_id}/tests`)) {
    tabValue = `/admin/scenarios/${scenario.scenario_id}/tests`;
  }
  const [openScenarioRecurringFormDialog, setOpenScenarioRecurringFormDialog] = useState<boolean>(false);
  const [openInstantiateSimulationAndStart, setOpenInstantiateSimulationAndStart] = useState<boolean>(false);
  const [selectRecurring, setSelectRecurring] = useState('noRepeat');
  const [cronExpression, setCronExpression] = useState<string | null>(scenario.scenario_recurrence || null);
  const [parsedCronExpression, setParsedCronExpression] = useState<ParsedCron | null>(scenario.scenario_recurrence ? parseCron(scenario.scenario_recurrence) : null);
  const noRepeat = !!scenario.scenario_recurrence_end && !!scenario.scenario_recurrence_start
    && new Date(scenario.scenario_recurrence_end).getTime() - new Date(scenario.scenario_recurrence_start).getTime() <= _MS_PER_DAY
    && ['noRepeat', 'daily'].includes(selectRecurring);
  const getHumanReadableScheduling = () => {
    if (!cronExpression || !parsedCronExpression) {
      return null;
    }
    let sentence: string;
    if (noRepeat) {
      sentence = `${fld(scenario.scenario_recurrence_start)} ${t('recurrence_at')} ${ft(new Date().setUTCHours(parsedCronExpression.h, parsedCronExpression.m, 0))}`;
    } else {
      sentence = cronstrue.toString(cronExpression, {
        verbose: true,
        tzOffset: -new Date().getTimezoneOffset() / 60,
        locale,
      });
      if (scenario.scenario_recurrence_end) {
        sentence += ` ${t('recurrence_from')} ${fld(scenario.scenario_recurrence_start)}`;
        sentence += ` ${t('recurrence_to')} ${fld(scenario.scenario_recurrence_end)}`;
      } else {
        sentence += ` ${t('recurrence_starting_from')} ${fld(scenario.scenario_recurrence_start)}`;
      }
    }
    return sentence;
  };
  return (
    <PermissionsContext.Provider value={permissionsContext}>
      <DocumentContext.Provider value={documentContext}>
        <>
          <Breadcrumbs
            variant="list"
            elements={[
              { label: t('Scenarios'), link: '/admin/scenarios' },
              { label: scenario.scenario_name, current: true },
            ]}
          />
          <ScenarioHeader
            setCronExpression={setCronExpression}
            setParsedCronExpression={setParsedCronExpression}
            setSelectRecurring={setSelectRecurring}
            selectRecurring={selectRecurring}
            setOpenScenarioRecurringFormDialog={setOpenScenarioRecurringFormDialog}
            openScenarioRecurringFormDialog={openScenarioRecurringFormDialog}
            setOpenInstantiateSimulationAndStart={setOpenInstantiateSimulationAndStart}
            openInstantiateSimulationAndStart={openInstantiateSimulationAndStart}
            noRepeat={noRepeat}
          />
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              marginBottom: 4,
            }}
          >
            <Tabs value={tabValue}>
              <Tab
                component={Link}
                to={`/admin/scenarios/${scenario.scenario_id}`}
                value={`/admin/scenarios/${scenario.scenario_id}`}
                label={t('Overview')}
              />
              <Tab
                component={Link}
                to={`/admin/scenarios/${scenario.scenario_id}/definition`}
                value={`/admin/scenarios/${scenario.scenario_id}/definition`}
                label={t('Definition')}
              />
              <Tab
                component={Link}
                to={`/admin/scenarios/${scenario.scenario_id}/injects`}
                value={`/admin/scenarios/${scenario.scenario_id}/injects`}
                label={t('Injects')}
              />
              <Tab
                component={Link}
                to={`/admin/scenarios/${scenario.scenario_id}/tests`}
                value={`/admin/scenarios/${scenario.scenario_id}/tests`}
                label={t('Tests')}
              />
              <Tab
                component={Link}
                to={`/admin/scenarios/${scenario.scenario_id}/lessons`}
                value={`/admin/scenarios/${scenario.scenario_id}/lessons`}
                label={t('Lessons learned')}
              />
            </Tabs>
            <div className={classes.scheduling}>
              {!cronExpression && (
                <IconButton size="small" onClick={() => setOpenScenarioRecurringFormDialog(true)} style={{ marginRight: 5 }}>
                  <UpdateOutlined color="primary" />
                </IconButton>
              )}
              {cronExpression && !scenario.scenario_recurrence && (
                <IconButton size="small" style={{ cursor: 'default', marginRight: 5 }}>
                  <UpdateOutlined />
                </IconButton>
              )}
              {cronExpression && scenario.scenario_recurrence && (
                <Tooltip title={(t('Modify the scheduling'))}>
                  <IconButton size="small" onClick={() => setOpenScenarioRecurringFormDialog(true)} style={{ marginRight: 5 }}>
                    <UpdateOutlined color="primary" />
                  </IconButton>
                </Tooltip>
              )}
              <span style={{ color: theme.palette.text?.disabled }}>{!cronExpression && t('Not scheduled')}</span>
              {cronExpression && <span>{getHumanReadableScheduling()}</span>}
            </div>
          </Box>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="" element={errorWrapper(ScenarioComponent)({ setOpenInstantiateSimulationAndStart })} />
              <Route path="definition" element={errorWrapper(ScenarioDefinition)()} />
              <Route path="injects" element={errorWrapper(Injects)()} />
              <Route path="tests/:statusId?" element={errorWrapper(Tests)()} />
              <Route path="lessons" element={errorWrapper(Lessons)()} />
              {/* Not found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </>
      </DocumentContext.Provider>
    </PermissionsContext.Provider>
  );
};

const Index = () => {
  // Standard hooks
  const dispatch = useAppDispatch();
  const [pristine, setPristine] = useState(true);
  const [loading, setLoading] = useState(true);
  const { t } = useFormatter();
  // Fetching data
  const { scenarioId } = useParams() as { scenarioId: Scenario['scenario_id'] };
  const scenario = useHelper((helper: ScenariosHelper) => helper.getScenario(scenarioId));
  useDataLoader(() => {
    setLoading(true);
    dispatch(fetchScenario(scenarioId)).finally(() => {
      setPristine(false);
      setLoading(false);
    });
  });

  const scenarioInjectContext = injectContextForScenario(scenario);

  // avoid to show loader if something trigger useDataLoader
  if (pristine && loading) {
    return <Loader />;
  }
  if (!loading && !scenario) {
    return (
      <Alert severity="warning">
        <AlertTitle>{t('Warning')}</AlertTitle>
        {t('Scenario is currently unavailable or you do not have sufficient permissions to access it.')}
      </Alert>
    );
  }
  return (
    <InjectContext.Provider value={scenarioInjectContext}>
      <IndexScenarioComponent scenario={scenario} />
    </InjectContext.Provider>
  );
};

export default Index;
