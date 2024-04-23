import { useTheme } from '@mui/styles';
import React, { FunctionComponent } from 'react';
import Chart from 'react-apexcharts';
import * as R from 'ramda';
import Empty from '../../../../components/Empty';
import type { ExerciseStore } from '../../../../actions/exercises/Exercise';
import { useFormatter } from '../../../../components/i18n';
import { useAppDispatch } from '../../../../utils/hooks';
import { useHelper } from '../../../../store';
import useDataLoader from '../../../../utils/ServerSideEvent';
import { horizontalBarsChartOptions } from '../../../../utils/Charts';
import type { Theme } from '../../../../components/Theme';
import type { InjectHelper } from '../../../../actions/injects/inject-helper';
import { fetchInjects } from '../../../../actions/Inject';
import type { InjectExpectationStore, InjectStore } from '../../../../actions/injects/Inject';

interface Props {
  exerciseId: ExerciseStore['exercise_id'];
}

const InjectDistributionByType: FunctionComponent<Props> = ({
  exerciseId,
}) => {
  // Standard hooks
  const { t, tPick } = useFormatter();
  const dispatch = useAppDispatch();
  const theme: Theme = useTheme();

  // Fetching data
  const { injects, injectTypesMap } = useHelper((helper: InjectHelper) => ({
    injects: helper.getScenarioInjects(exerciseId),
    injectTypesMap: helper.getInjectTypesMapByType(),
  }));
  useDataLoader(() => {
    dispatch(fetchInjects(exerciseId));
  });

  const injectsByType = R.pipe(
    R.filter((n: InjectStore) => n.inject_sent_at !== null),
    R.groupBy(R.prop('inject_type')),
    R.toPairs,
    R.map((n: [string, InjectExpectationStore[]]) => ({
      inject_type: n[0],
      number: n[1].length,
    })),
    R.sortWith([R.descend(R.prop('number'))]),
  )(injects);
  const injectsByInjectTypeData = [
    {
      name: t('Number of injects'),
      data: injectsByType.map((a: InjectStore & { number: number }) => ({
        x: tPick(injectTypesMap && injectTypesMap[a.inject_type]?.label),
        y: a.number,
        fillColor:
          injectTypesMap && injectTypesMap[a.inject_type]?.config?.color,
      })),
    },
  ];

  return (
    <>
      {injectsByType.length > 0 ? (
        <Chart
          // @ts-expect-error: Need to migrate Chart.js file
          options={horizontalBarsChartOptions(theme)}
          series={injectsByInjectTypeData}
          type="bar"
          width="100%"
          height={50 + injectsByType.length * 50}
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

export default InjectDistributionByType;
