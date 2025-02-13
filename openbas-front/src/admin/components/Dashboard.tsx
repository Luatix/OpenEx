import { ComputerOutlined, HubOutlined, MovieFilterOutlined, PersonOutlined } from '@mui/icons-material';
import { Grid, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { makeStyles } from 'tss-react/mui';

import { fetchStatistics } from '../../actions/Application';
import { type AttackPatternHelper } from '../../actions/attack_patterns/attackpattern-helper';
import { searchExercises } from '../../actions/Exercise';
import { type StatisticsHelper } from '../../actions/statistics/statistics-helper';
import { initSorting, type Page } from '../../components/common/queryable/Page';
import Empty from '../../components/Empty';
import { useFormatter } from '../../components/i18n';
import Loader from '../../components/Loader';
import { useHelper } from '../../store';
import { type AttackPattern, type ExerciseSimple, type InjectExpectationResultsByAttackPattern, type PlatformStatistic } from '../../utils/api-types';
import { horizontalBarsChartOptions, polarAreaChartOptions, verticalBarsChartOptions } from '../../utils/Charts';
import { attackPatternsFakeData, categoriesDataFakeData, categoriesLabelsFakeData, exercisesTimeSeriesFakeData } from '../../utils/fakeData';
import { useAppDispatch } from '../../utils/hooks';
import useDataLoader from '../../utils/hooks/useDataLoader';
import ResponsePie from './common/injects/ResponsePie';
import MitreMatrix from './common/matrix/MitreMatrix';
import PaperMetric from './common/simulate/PaperMetric';
import ExerciseList from './simulations/ExerciseList';

// Deprecated - https://mui.com/system/styles/basics/
// Do not use it for new code.
const useStyles = makeStyles()(() => ({
  paper: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: 15,
    borderRadius: 4,
  },
  paperWithChart: {
    height: 320,
    minHeight: 320,
    margin: '10px 0 0 0',
    padding: 15,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
  },
  paperList: {
    height: 320,
    minHeight: 320,
    margin: '10px 0 0 0',
    padding: 0,
    borderRadius: 4,
  },
  paperChart: {
    height: 320,
    minHeight: 320,
    margin: '10px 0 0 0',
    padding: 15,
    borderRadius: 4,
  },
}));

const Dashboard = () => {
  // Standard hooks
  const theme = useTheme();
  const { classes } = useStyles();
  const { t, fld, n } = useFormatter();
  const dispatch = useAppDispatch();

  // Exercises
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [exercises, setExercises] = useState<ExerciseSimple[]>([]);
  const searchPaginationInput = {
    sorts: initSorting('exercise_updated_at', 'DESC'),
    page: 0,
    size: 6,
  };
  useEffect(() => {
    setLoadingExercises(true);
    searchExercises(searchPaginationInput).then((result: { data: Page<ExerciseSimple> }) => {
      const { data } = result;
      setExercises(data.content);
    }).finally(() => setLoadingExercises(false));
  }, []);

  // Statistics
  const { statistics, attackPatternsMap }: {
    statistics: PlatformStatistic;
    attackPatternsMap: Record<string, AttackPattern>;
  } = useHelper((helper: StatisticsHelper & AttackPatternHelper) => {
    return { statistics: helper.getStatistics(), attackPatternsMap: helper.getAttackPatternsMap() };
  });
  const [loading, setLoading] = useState(true);
  useDataLoader(() => {
    setLoading(true);
    dispatch(fetchStatistics()).finally(() => {
      setLoading(false);
    });
  });

  const exercisesCountByWeekHasValues = useMemo(
    () => statistics?.exercises_count_by_week && Object.keys(statistics.exercises_count_by_week)?.length,
    [statistics?.exercises_count_by_week],
  );
  const exercisesCountByWeek = useMemo(() => [
    {
      name: t('Number of simulations'),
      data: exercisesCountByWeekHasValues
        ? Object.entries<number>(statistics.exercises_count_by_week!).map(([date, value]) => ({
            x: date,
            y: value,
          }))
        : exercisesTimeSeriesFakeData,
    },
  ], [exercisesCountByWeekHasValues, statistics?.exercises_count_by_week]);

  const exercisesCountByCategoryHasValues = useMemo(
    () => statistics?.exercises_count_by_week && Object.keys(statistics.exercises_count_by_week)?.length,
    [statistics?.exercises_count_by_week],
  );
  const exercisesCountByCategory = useMemo(
    () => (exercisesCountByCategoryHasValues
      ? Object.values<number>(statistics.exercises_count_by_category!)
      : categoriesDataFakeData),
    [exercisesCountByCategoryHasValues, statistics?.exercises_count_by_category],
  );
  const exercisesCountByCategoryLabels = useMemo(
    () => (exercisesCountByCategoryHasValues
      ? Object.keys(statistics.exercises_count_by_category!).map(category => t(category))
      : categoriesLabelsFakeData),
    [exercisesCountByCategoryHasValues, statistics?.exercises_count_by_category],
  );

  const injectsCountByAttackPatternHasValues = useMemo(
    () => statistics?.injects_count_by_attack_pattern && Object.keys(statistics.injects_count_by_attack_pattern)?.length,
    [statistics?.injects_count_by_attack_pattern],
  );
  const injectsCountByAttackPattern = useMemo(
    () => [{
      name: t('Number of injects'),
      data: injectsCountByAttackPatternHasValues && Object.keys(attackPatternsMap).length
        ? Object.entries<number>(statistics.injects_count_by_attack_pattern!).map(([attackPatternId, value]) => {
            return ({
              x: [`[${attackPatternsMap[attackPatternId].attack_pattern_external_id}]`, attackPatternsMap[attackPatternId].attack_pattern_name],
              y: value,
            });
          })
        : attackPatternsFakeData,
    }],
    [statistics?.injects_count_by_attack_pattern, injectsCountByAttackPatternHasValues, attackPatternsMap],
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={3}>
        <PaperMetric
          title={t('Scenarios')}
          subTitle={t('(last 180 days)')}
          icon={<MovieFilterOutlined />}
          number={statistics?.scenarios_count?.global_count}
          progression={statistics?.scenarios_count?.progression_count}
        />
      </Grid>
      <Grid item xs={3}>
        <PaperMetric
          title={t('Simulations')}
          subTitle={t('(last 180 days)')}
          icon={<HubOutlined />}
          number={statistics?.exercises_count?.global_count}
          progression={statistics?.exercises_count?.progression_count}
        />
      </Grid>
      <Grid item xs={3}>
        <PaperMetric
          title={t('Players')}
          subTitle={t('(last 180 days)')}
          icon={<PersonOutlined />}
          number={statistics?.users_count?.global_count}
          progression={statistics?.users_count?.progression_count}
        />
      </Grid>
      <Grid item xs={3}>
        <PaperMetric
          title={t('Assets')}
          subTitle={t('(last 180 days)')}
          icon={<ComputerOutlined />}
          number={statistics?.assets_count?.global_count}
          progression={statistics?.assets_count?.progression_count}
        />
      </Grid>
      <Grid item xs={6}>
        <Typography variant="h4">{t('Performance Overview')}</Typography>
        <Paper variant="outlined" classes={{ root: classes.paperWithChart }}>
          {loading
            ? <Loader variant="inElement" />
            : <ResponsePie expectationResultsByTypes={statistics?.expectation_results} immutable={true} />}
        </Paper>
      </Grid>
      <Grid item={true} xs={6}>
        <Typography variant="h4">{t('Simulations')}</Typography>
        <Paper variant="outlined" classes={{ root: classes.paperChart }}>
          {loading ? (<Loader variant="inElement" />)
            : (
                <Chart
                  options={verticalBarsChartOptions(
                    theme,
                    fld,
                    undefined,
                    false,
                    true,
                    false,
                    true,
                    'dataPoints',
                    true,
                    !exercisesCountByWeekHasValues,
                    undefined,
                    t('No data to display'),
                  )}
                  series={exercisesCountByWeek}
                  type="bar"
                  width="100%"
                  height="100%"
                />
              )}
        </Paper>
      </Grid>
      <Grid item={true} xs={3}>
        <Typography variant="h4">{t('Top simulation categories')}</Typography>
        <Paper variant="outlined" classes={{ root: classes.paperChart }}>
          {loading
            ? <Loader variant="inElement" />
            : (
                <Chart
                  options={polarAreaChartOptions(
                    theme,
                    exercisesCountByCategoryLabels,
                    undefined,
                    'bottom',
                    [],
                    !!exercisesCountByCategoryHasValues,
                    !exercisesCountByCategoryHasValues,
                  )}
                  series={exercisesCountByCategory}
                  type="polarArea"
                  width="100%"
                  height="100%"
                />
              )}
        </Paper>
      </Grid>
      <Grid item={true} xs={3}>
        <Typography variant="h4">{t('Top attack patterns')}</Typography>
        <Paper variant="outlined" classes={{ root: classes.paperChart }}>
          {loading
            ? <Loader variant="inElement" />
            : (
                <Chart
                  options={horizontalBarsChartOptions(
                    theme,
                    true,
                    n,
                    undefined,
                    false,
                    false,
                    undefined,
                    null,
                    true,
                    !injectsCountByAttackPatternHasValues,
                  )}
                  series={injectsCountByAttackPattern}
                  type="bar"
                  width="100%"
                  height="100%"
                />
              )}
        </Paper>
      </Grid>
      <Grid item={true} xs={6}>
        <Typography variant="h4">{t('Last simulations')}</Typography>
        <Paper variant="outlined" classes={{ root: classes.paperList }}>
          {exercises.length === 0 && <Empty message={t('No simulation in this platform yet')} />}
          <ExerciseList
            exercises={exercises}
            hasHeader={false}
            variant="reduced-view"
            loading={loadingExercises}
          />
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h4">{t('MITRE ATT&CK Coverage')}</Typography>
        <Paper variant="outlined" style={{ minWidth: '100%', padding: 16 }}>
          {
            loading
              ? <Loader variant="inElement" />
              : (
                  <MitreMatrix
                    injectResults={(statistics?.inject_expectation_results as InjectExpectationResultsByAttackPattern[])}
                  />
                )
          }
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
