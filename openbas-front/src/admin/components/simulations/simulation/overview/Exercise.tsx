import { Grid, Paper, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import * as R from 'ramda';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

import type { ExerciseStore, InjectExpectationResultsByAttackPatternStore } from '../../../../../actions/exercises/Exercise';
import type { ScenarioStore } from '../../../../../actions/scenarios/Scenario';
import { fetchExerciseExpectationResult, fetchExerciseInjectExpectationResults, searchExerciseInjects } from '../../../../../actions/exercises/exercise-action';
import type { ExercisesHelper } from '../../../../../actions/exercises/exercise-helper';
import { buildEmptyFilter } from '../../../../../components/common/queryable/filter/FilterUtils';
import { initSorting } from '../../../../../components/common/queryable/Page';
import { buildSearchPagination } from '../../../../../components/common/queryable/QueryableUtils';
import { useQueryableWithLocalStorage } from '../../../../../components/common/queryable/useQueryableWithLocalStorage';
import { useFormatter } from '../../../../../components/i18n';
import Loader from '../../../../../components/Loader';
import { useHelper } from '../../../../../store';
import type { ExpectationResultsByType, FilterGroup } from '../../../../../utils/api-types';
import InjectResultList from '../../../atomic_testings/InjectResultList';
import ResponsePie from '../../../common/injects/ResponsePie';
import MitreMatrix from '../../../common/matrix/MitreMatrix';
import ExerciseMainInformation from '../ExerciseMainInformation';
import ExerciseDistribution from './ExerciseDistribution';
import type {ScenariosHelper} from "../../../../../actions/scenarios/scenario-helper";
import useDataLoader from "../../../../../utils/hooks/useDataLoader";
import {fetchScenarioArticles} from "../../../../../actions/channels/article-action";
import {fetchScenario} from "../../../../../actions/scenarios/scenario-actions";
import {useAppDispatch} from "../../../../../utils/hooks";

// Deprecated - https://mui.com/system/styles/basics/
// Do not use it for new code.
const useStyles = makeStyles(() => ({
  gridContainer: {
    marginBottom: 20,
  },
  paper: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: 15,
    borderRadius: 4,
  },
}));

const Exercise = () => {
  // Standard hooks
  const classes = useStyles();
  const { t } = useFormatter();
  const dispatch = useAppDispatch();

  // Fetching data
  const { exerciseId } = useParams() as { exerciseId: ExerciseStore['exercise_id'] };
  const { exercise } = useHelper((helper: ExercisesHelper) => ({
    exercise: helper.getExercise(exerciseId),
  }));
  const scenario = useHelper((helper: ScenariosHelper) => {
    console.log(exercise.exercise_scenario)
    return helper.getScenario(exercise.exercise_scenario);
  });

  useDataLoader(() => {
    dispatch(fetchScenario(exercise.exercise_scenario));
  })

  const [results, setResults] = useState<ExpectationResultsByType[] | null>(null);
  const [injectResults, setInjectResults] = useState<InjectExpectationResultsByAttackPatternStore[] | null>(null);
  useEffect(() => {
    fetchExerciseExpectationResult(exerciseId).then((result: { data: ExpectationResultsByType[] }) => setResults(result.data));
    fetchExerciseInjectExpectationResults(exerciseId).then((result: { data: InjectExpectationResultsByAttackPatternStore[] }) => setInjectResults(result.data));
  }, [exerciseId]);
  const goToLink = `/admin/simulations/${exerciseId}/injects`;
  let resultAttackPatternIds = [];
  if (injectResults) {
    resultAttackPatternIds = R.uniq(
      injectResults
        .filter(injectResult => !!injectResult.inject_attack_pattern)
        .flatMap(injectResult => injectResult.inject_attack_pattern) as unknown as string[],
    );
  }

  const quickFilter: FilterGroup = {
    mode: 'and',
    filters: [
      buildEmptyFilter('inject_kill_chain_phases', 'contains'),
      buildEmptyFilter('inject_tags', 'contains'),
    ],
  };

  const { queryableHelpers, searchPaginationInput } = useQueryableWithLocalStorage('simulation-injects-results', buildSearchPagination({
    sorts: initSorting('inject_updated_at', 'DESC'),
    filterGroup: quickFilter,
  }));
  return (
    <>
      <Grid
        container
        spacing={3}
        classes={{ container: classes.gridContainer }}
      >
        <Grid item xs={6} style={{ paddingTop: 10 }}>
          <Typography variant="h4" gutterBottom>
            {t('Information')}
          </Typography>
          <ExerciseMainInformation exercise={exercise} scenario={scenario} />
        </Grid>
        <Grid item xs={6} style={{ display: 'flex', flexDirection: 'column', paddingTop: 10 }}>
          <Typography variant="h4" gutterBottom>
            {t('Results')}
          </Typography>
          <Paper variant="outlined" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {!results
              ? <Loader variant="inElement" />
              : <ResponsePie expectationResultsByTypes={results} humanValidationLink={`/admin/simulations/${exerciseId}/animation/validations`} />}
          </Paper>
        </Grid>
        {injectResults && resultAttackPatternIds.length > 0 && (
          <Grid item xs={12} style={{ marginTop: 25 }}>
            <Typography variant="h4" gutterBottom>
              {t('MITRE ATT&CK Results')}
            </Typography>
            <Paper classes={{ root: classes.paper }} variant="outlined" style={{ display: 'flex', alignItems: 'center' }}>
              <MitreMatrix goToLink={goToLink} injectResults={injectResults} />
            </Paper>
          </Grid>
        )}
        {exercise.exercise_status !== 'SCHEDULED' && (
          <Grid item xs={12} style={{ marginTop: 25 }}>
            <Typography variant="h4" gutterBottom style={{ marginBottom: 15 }}>
              {t('Injects results')}
            </Typography>
            <Paper classes={{ root: classes.paper }} variant="outlined">
              <InjectResultList
                fetchInjects={input => searchExerciseInjects(exerciseId, input)}
                goTo={injectId => `/admin/simulations/${exerciseId}/injects/${injectId}`}
                queryableHelpers={queryableHelpers}
                searchPaginationInput={searchPaginationInput}
              />
            </Paper>
          </Grid>
        )}
      </Grid>
      <div style={{ marginBottom: 25 }}>
        <ExerciseDistribution exerciseId={exerciseId} />
      </div>
    </>
  );
};

export default Exercise;
