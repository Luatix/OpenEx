import Chart from 'react-apexcharts';
import React, { FunctionComponent } from 'react';
import { useTheme } from '@mui/styles';
import * as R from 'ramda';
import { horizontalBarsChartOptions } from '../../../../../utils/Charts';
import Empty from '../../../../../components/Empty';
import type { ExerciseStore } from '../../../../../actions/exercises/Exercise';
import { useFormatter } from '../../../../../components/i18n';
import { useAppDispatch } from '../../../../../utils/hooks';
import type { Theme } from '../../../../../components/Theme';
import { useHelper } from '../../../../../store';
import type { InjectHelper } from '../../../../../actions/injects/inject-helper';
import useDataLoader from '../../../../../utils/ServerSideEvent';
import { fetchInjects, fetchInjectTypes } from '../../../../../actions/Inject';
import { fetchExerciseInjectExpectations } from '../../../../../actions/Exercise';
import type { InjectExpectationStore } from '../../../../../actions/injects/Inject';
import type { Inject } from '../../../../../utils/api-types';

interface Props {
  exerciseId: ExerciseStore['exercise_id'];
}

const ExerciseDistributionByInjectType: FunctionComponent<Props> = ({
  exerciseId,
}) => {
  // Standard hooks
  const { t, tPick } = useFormatter();
  const dispatch = useAppDispatch();
  const theme: Theme = useTheme();

  // Fetching data
  const { injectsMap, injectTypesMap, injectExpectations } = useHelper((helper: InjectHelper) => ({
    injectsMap: helper.getInjectsMap(),
    injectTypesMap: helper.getInjectTypesMapByType(),
    injectExpectations: helper.getExerciseInjectExpectations(exerciseId),
  }));
  useDataLoader(() => {
    dispatch(fetchInjects(exerciseId));
    dispatch(fetchInjectTypes());
    dispatch(fetchExerciseInjectExpectations(exerciseId));
  });

  const sortedInjectTypesByTotalScore = R.pipe(
    R.filter((n: InjectExpectationStore) => !R.isEmpty(n.inject_expectation_results)),
    R.map((n: InjectExpectationStore) => R.assoc(
      'inject_expectation_inject',
      injectsMap[n.inject_expectation_inject] || {},
      n,
    )),
    R.groupBy(R.path(['inject_expectation_inject', 'inject_type'])),
    R.toPairs,
    R.map((n: [string, InjectExpectationStore[]]) => ({
      inject_type: n[0],
      inject_total_score: R.sum(R.map((o: InjectExpectationStore) => o.inject_expectation_score ?? 0, n[1])),
    })),
    R.sortWith([R.descend(R.prop('inject_total_score'))]),
    R.take(10),
  )(injectExpectations);

  const totalScoreByInjectTypeData = [
    {
      name: t('Total score'),
      data: sortedInjectTypesByTotalScore.map((i: Inject & { inject_total_score: number }) => ({
        x: tPick(injectTypesMap && injectTypesMap[i.inject_type]?.label),
        y: i.inject_total_score,
        fillColor:
          injectTypesMap && injectTypesMap[i.inject_type]?.config?.color,
      })),
    },
  ];

  return (
    <>
      {sortedInjectTypesByTotalScore.length > 0 ? (
        <Chart
          // @ts-expect-error: Need to migrate Chart.js file
          options={horizontalBarsChartOptions(
            theme,
            false,
            null,
            null,
            true,
          )}
          series={totalScoreByInjectTypeData}
          type="bar"
          width="100%"
          height={50 + sortedInjectTypesByTotalScore.length * 50}
        />
      ) : (
        <Empty
          message={t(
            'No data to display or the simulation has not started yet',
          )}
        />
      )}
    </>
  );
};

export default ExerciseDistributionByInjectType;
