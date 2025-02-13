import { PlayArrowOutlined, Stop } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { type Dispatch, type SetStateAction, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { createRunningExerciseFromScenario, updateScenarioRecurrence } from '../../../../actions/scenarios/scenario-actions';
import { type ScenariosHelper } from '../../../../actions/scenarios/scenario-helper';
import Transition from '../../../../components/common/Transition';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import { type Exercise, type Scenario } from '../../../../utils/api-types';
import { parseCron, type ParsedCron } from '../../../../utils/Cron';
import { MESSAGING$ } from '../../../../utils/Environment';
import { useAppDispatch } from '../../../../utils/hooks';
import { truncate } from '../../../../utils/String';
import ScenarioPopover from './ScenarioPopover';
import ScenarioRecurringFormDialog from './ScenarioRecurringFormDialog';

const useStyles = makeStyles()(() => ({
  title: {
    float: 'left',
    marginRight: 10,
  },
  statusScheduled: {
    float: 'left',
    margin: '4px 0 0 5px',
    width: 20,
    height: 20,
    borderRadius: '50%',
    boxShadow: '0px 0px 5px 2px #4caf50',
    animation: 'pulse-green 1s linear infinite alternate',
  },
  statusNotScheduled: {
    float: 'left',
    margin: '4px 0 0 5px',
    width: 20,
    height: 20,
    borderRadius: '50%',
    boxShadow: '0px 0px 5px 2px #f44336',
  },
  actions: {
    margin: '-6px 0 0 0',
    float: 'right',
    display: 'flex',
  },
}));

interface ScenarioHeaderProps {
  setCronExpression: Dispatch<SetStateAction<string | null>>;
  setParsedCronExpression: Dispatch<SetStateAction<ParsedCron | null>>;
  setSelectRecurring: Dispatch<SetStateAction<string>>;
  selectRecurring: string;
  setOpenScenarioRecurringFormDialog: Dispatch<SetStateAction<boolean>>;
  setOpenInstantiateSimulationAndStart: Dispatch<SetStateAction<boolean>>;
  openScenarioRecurringFormDialog: boolean;
  openInstantiateSimulationAndStart: boolean;
  noRepeat: boolean;
}

const ScenarioHeader = ({
  setCronExpression,
  setParsedCronExpression,
  setSelectRecurring,
  selectRecurring,
  noRepeat,
  openScenarioRecurringFormDialog,
  setOpenScenarioRecurringFormDialog,
  openInstantiateSimulationAndStart,
  setOpenInstantiateSimulationAndStart,
}: ScenarioHeaderProps) => {
  // Standard hooks
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { classes } = useStyles();
  const theme = useTheme();
  const { scenarioId } = useParams() as { scenarioId: Scenario['scenario_id'] };

  // Fetching data
  const { scenario }: { scenario: Scenario } = useHelper((helper: ScenariosHelper) => ({
    scenario: helper.getScenario(scenarioId),
  }));

  // Local
  const ended = scenario.scenario_recurrence_end && new Date(scenario.scenario_recurrence_end).getTime() < new Date().getTime();
  const onSubmit = (cron: string, start: string, end?: string) => {
    setCronExpression(cron);
    setParsedCronExpression(parseCron(cron));
    dispatch(updateScenarioRecurrence(scenarioId, { scenario_recurrence: cron, scenario_recurrence_start: start, scenario_recurrence_end: end }));
    setOpenScenarioRecurringFormDialog(false);
  };
  useEffect(() => {
    if (scenario.scenario_recurrence != null) {
      setCronExpression(scenario.scenario_recurrence);
      setParsedCronExpression(parseCron(scenario.scenario_recurrence));
      const { w, d } = parseCron(scenario.scenario_recurrence);
      if (w) {
        setSelectRecurring('monthly');
      } else if (d) {
        setSelectRecurring('weekly');
      } else if (!noRepeat) {
        setSelectRecurring('daily');
      }
    }
  }, [scenario.scenario_recurrence]);
  const stop = () => {
    setCronExpression(null);
    setParsedCronExpression(null);
    dispatch(updateScenarioRecurrence(scenarioId, { scenario_recurrence: undefined, scenario_recurrence_start: undefined, scenario_recurrence_end: undefined }));
  };

  return (
    <>
      <Tooltip title={scenario.scenario_name}>
        <Typography variant="h1" gutterBottom={true} classes={{ root: classes.title }}>
          {truncate(scenario.scenario_name, 80)}
        </Typography>
      </Tooltip>
      <div style={{ float: 'left', margin: '4px 10px 0 8px', color: theme.palette.text?.disabled, borderLeft: `1px solid ${theme.palette.text?.disabled}`, height: 20 }} />
      <Tooltip title={t(scenario.scenario_recurrence ? 'Scheduled' : 'Not scheduled')}>
        <div className={scenario.scenario_recurrence ? classes.statusScheduled : classes.statusNotScheduled} />
      </Tooltip>
      <div className={classes.actions}>
        {scenario.scenario_recurrence && !ended ? (
          <Button
            style={{ marginRight: 10 }}
            startIcon={<Stop />}
            variant="outlined"
            color="inherit"
            size="small"
            onClick={stop}
          >
            {t('Stop')}
          </Button>
        ) : (
          <Button
            style={{ marginRight: 10, lineHeight: 'initial' }}
            startIcon={<PlayArrowOutlined />}
            variant="contained"
            color="primary"
            size="small"
            onClick={() => setOpenInstantiateSimulationAndStart(true)}
          >
            {t('Launch now')}
          </Button>
        )}
        <ScenarioPopover
          scenario={scenario}
          actions={['Duplicate', 'Update', 'Delete', 'Export']}
          onDelete={() => navigate('/admin/scenarios')}
        />
      </div>
      <ScenarioRecurringFormDialog
        selectRecurring={selectRecurring}
        onSelectRecurring={setSelectRecurring}
        open={openScenarioRecurringFormDialog}
        setOpen={setOpenScenarioRecurringFormDialog}
        onSubmit={onSubmit}
        initialValues={scenario}
      />
      <Dialog
        open={openInstantiateSimulationAndStart}
        TransitionComponent={Transition}
        onClose={() => setOpenInstantiateSimulationAndStart(false)}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('A simulation will be launched based on this scenario and will start immediately. Are you sure you want to proceed?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInstantiateSimulationAndStart(false)}>
            {t('Cancel')}
          </Button>
          <Button
            color="secondary"
            onClick={async () => {
              setOpenInstantiateSimulationAndStart(false);
              const exercise: Exercise = (await createRunningExerciseFromScenario(scenarioId)).data;
              MESSAGING$.notifySuccess(t('New simulation successfully created and started. Click {here} to view the simulation.', {
                here: <Link to={`/admin/simulations/${exercise.exercise_id}`}>{t('here')}</Link>,
              }));
            }}
          >
            {t('Confirm')}
          </Button>
        </DialogActions>
      </Dialog>
      <div className="clearfix" />
    </>
  );
};

export default ScenarioHeader;
