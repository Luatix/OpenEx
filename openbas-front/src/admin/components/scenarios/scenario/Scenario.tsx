import { PlayArrowOutlined } from '@mui/icons-material';
import { Avatar, Button, Chip, Grid, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import * as R from 'ramda';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { Link, useParams } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { type ExercisesHelper } from '../../../../actions/exercises/exercise-helper';
import { searchScenarioExercises } from '../../../../actions/scenarios/scenario-actions';
import { type ScenariosHelper } from '../../../../actions/scenarios/scenario-helper';
import { initSorting } from '../../../../components/common/queryable/Page';
import PaginationComponentV2 from '../../../../components/common/queryable/pagination/PaginationComponentV2';
import { buildSearchPagination } from '../../../../components/common/queryable/QueryableUtils';
import { useQueryableWithLocalStorage } from '../../../../components/common/queryable/useQueryableWithLocalStorage';
import ExpandableMarkdown from '../../../../components/ExpandableMarkdown';
import { useFormatter } from '../../../../components/i18n';
import ItemCategory from '../../../../components/ItemCategory';
import ItemMainFocus from '../../../../components/ItemMainFocus';
import ItemSeverity from '../../../../components/ItemSeverity';
import ItemTags from '../../../../components/ItemTags';
import PlatformIcon from '../../../../components/PlatformIcon';
import octiDark from '../../../../static/images/xtm/octi_dark.png';
import octiLight from '../../../../static/images/xtm/octi_light.png';
import { useHelper } from '../../../../store';
import { type ExerciseSimple, type KillChainPhase, type Scenario as ScenarioType, type SearchPaginationInput } from '../../../../utils/api-types';
import { isEmptyField } from '../../../../utils/utils';
import ExerciseList from '../../simulations/ExerciseList';
import ExercisePopover from '../../simulations/simulation/ExercisePopover';
import ScenarioDistributionByExercise from './ScenarioDistributionByExercise';

// Deprecated - https://mui.com/system/styles/basics/
// Do not use it for new code.
const useStyles = makeStyles()(() => ({
  chip: {
    fontSize: 12,
    height: 25,
    margin: '0 7px 7px 0',
    textTransform: 'uppercase',
    borderRadius: 4,
    width: 180,
  },
  gridContainer: {
    marginBottom: 20,
  },
  paper: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: '15px 15px 0 15px',
    borderRadius: 4,
  },
}));

const Scenario = ({ setOpenInstantiateSimulationAndStart }: { setOpenInstantiateSimulationAndStart: Dispatch<SetStateAction<boolean>> }) => {
  // Standard hooks
  const { classes } = useStyles();
  const theme = useTheme();
  const { t } = useFormatter();
  const { scenarioId } = useParams() as { scenarioId: ScenarioType['scenario_id'] };
  // Fetching data
  const { scenario } = useHelper((helper: ScenariosHelper & ExercisesHelper) => ({
    scenario: helper.getScenario(scenarioId),
  }));
  const areAnyExercisesInScenario = scenario.scenario_exercises?.length > 0;
  const sortByOrder = R.sortWith([R.ascend(R.prop('phase_order'))]);

  // Exercises
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [exercises, setExercises] = useState<ExerciseSimple[]>([]);
  const { queryableHelpers, searchPaginationInput } = useQueryableWithLocalStorage(`scenario-${scenarioId}-simulations`, buildSearchPagination({
    sorts: initSorting('exercise_updated_at', 'DESC'),
  }));
  const search = (scenarioId: ScenarioType['scenario_id'], input: SearchPaginationInput) => {
    setLoadingExercises(true);
    return searchScenarioExercises(scenarioId, input).finally(() => {
      setLoadingExercises(false);
    });
  };
  const secondaryAction = (exercise: ExerciseSimple) => (
    <ExercisePopover
      // @ts-expect-error: should pass Exercise model IF we have update as action
      exercise={exercise}
      actions={['Duplicate', 'Export', 'Delete']}
      onDelete={result => setExercises(exercises.filter(e => (e.exercise_id !== result)))}
      inList
    />
  );
  return (
    <>
      <Grid
        container
        spacing={3}
        classes={{ container: classes.gridContainer }}
      >
        <Grid item xs={6} style={{ paddingTop: 10 }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h4" gutterBottom>
              {t('Information')}
            </Typography>
            <Button
              component={Link}
              to={scenario.scenario_external_url}
              target="_blank"
              size="small"
              variant="outlined"
              startIcon={<Avatar style={{ width: 20, height: 20 }} src={theme.palette.mode === 'dark' ? octiDark : octiLight} alt="OCTI" />}
              disabled={isEmptyField(scenario.scenario_external_url)}
            >
              {t('Threat intelligence')}
            </Button>
          </div>
          <Paper classes={{ root: classes.paper }} variant="outlined">
            <Grid container spacing={3}>
              <Grid item xs={12} style={{ paddingTop: 10 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('Description')}
                </Typography>
                <ExpandableMarkdown
                  source={scenario.scenario_description}
                  limit={300}
                />
              </Grid>
              <Grid item xs={4} style={{ paddingTop: 10 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('Severity')}
                </Typography>
                <ItemSeverity severity={scenario.scenario_severity} label={t(scenario.scenario_severity ?? 'Unknown')} />
              </Grid>
              <Grid item xs={4} style={{ paddingTop: 10 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('Category')}
                </Typography>
                <ItemCategory category={scenario.scenario_category} label={t(scenario.scenario_category ?? 'Unknown')} />
              </Grid>
              <Grid item xs={4} style={{ paddingTop: 10 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('Main Focus')}
                </Typography>
                <ItemMainFocus mainFocus={scenario.scenario_main_focus} label={t(scenario.scenario_main_focus ?? 'Unknown')} />
              </Grid>
              <Grid item xs={4} style={{ paddingTop: 10 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('Tags')}
                </Typography>
                <ItemTags tags={scenario.scenario_tags} limit={10} />
              </Grid>
              <Grid item xs={4} style={{ paddingTop: 10 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('Platforms')}
                </Typography>
                {(scenario.scenario_platforms ?? []).length === 0 ? (
                  <PlatformIcon platform={t('No inject in this scenario')} tooltip width={25} />
                ) : scenario.scenario_platforms.map(
                  (platform: string) => <PlatformIcon key={platform} platform={platform} tooltip width={25} marginRight={10} />,
                )}
              </Grid>
              <Grid item xs={4} style={{ paddingTop: 10 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('Kill Chain Phases')}
                </Typography>
                {(scenario.scenario_kill_chain_phases ?? []).length === 0 && '-'}
                {sortByOrder(scenario.scenario_kill_chain_phases ?? [])?.map((killChainPhase: KillChainPhase) => (
                  <Chip
                    key={killChainPhase.phase_id}
                    variant="outlined"
                    classes={{ root: classes.chip }}
                    color="error"
                    label={killChainPhase.phase_name}
                  />
                ))}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={6} style={{ paddingTop: 10 }}>
          <Typography variant="h4" gutterBottom style={{ margin: '9px 0 17px 0' }}>
            {t('Latest 10 Finished Simulations')}
          </Typography>
          <Paper classes={{ root: classes.paper }} variant="outlined">
            <ScenarioDistributionByExercise scenarioId={scenarioId} />
          </Paper>
        </Grid>
        {areAnyExercisesInScenario && (
          <Grid item xs={12} style={{ marginTop: 35 }}>
            <Typography variant="h4" gutterBottom style={{ marginBottom: 15 }}>
              {t('Simulations')}
            </Typography>
            <Paper classes={{ root: classes.paper }} variant="outlined">
              <PaginationComponentV2
                fetch={input => search(scenarioId, input)}
                searchPaginationInput={searchPaginationInput}
                setContent={setExercises}
                entityPrefix="exercise"
                availableFilterNames={['exercise_kill_chain_phases', 'exercise_name', 'exercise_tags']}
                queryableHelpers={queryableHelpers}
                searchEnable={false}
              />
              <ExerciseList
                exercises={exercises}
                queryableHelpers={queryableHelpers}
                secondaryAction={secondaryAction}
                loading={loadingExercises}
                isGlobalScoreAsync={true}
              />
            </Paper>
          </Grid>
        )}
      </Grid>
      {!areAnyExercisesInScenario && !scenario.scenario_recurrence && (
        <div style={{ marginTop: 100, textAlign: 'center' }}>
          <div style={{ fontSize: 20 }}>
            {t('This scenario has never run, schedule or run it now!')}
          </div>
          <Button
            style={{ marginTop: 20 }}
            startIcon={<PlayArrowOutlined />}
            variant="contained"
            color="primary"
            size="large"
            onClick={() => setOpenInstantiateSimulationAndStart(true)}
          >
            {t('Launch simulation now')}
          </Button>
        </div>
      )}
      {!areAnyExercisesInScenario && scenario.scenario_recurrence && (
        <div style={{ marginTop: 100, textAlign: 'center' }}>
          <div style={{ fontSize: 20 }}>
            {t('This scenario is scheduled to run, results will appear soon.')}
          </div>
        </div>
      )}
    </>
  );
};

export default Scenario;
