import { useTheme } from '@mui/styles';
import * as R from 'ramda';
import { FunctionComponent } from 'react';
import Chart from 'react-apexcharts';

import type { ExerciseStore } from '../../../../actions/exercises/Exercise';
import { fetchExerciseInjects } from '../../../../actions/Inject';
import type { InjectorContractHelper } from '../../../../actions/injector_contracts/injector-contract-helper';
import type { InjectExpectationStore, InjectStore } from '../../../../actions/injects/Inject';
import type { InjectHelper } from '../../../../actions/injects/inject-helper';
import Empty from '../../../../components/Empty';
import { useFormatter } from '../../../../components/i18n';
import type { Theme } from '../../../../components/Theme';
import { useHelper } from '../../../../store';
import { horizontalBarsChartOptions } from '../../../../utils/Charts';
import { useAppDispatch } from '../../../../utils/hooks';
import useDataLoader from '../../../../utils/hooks/useDataLoader';

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
  const { injects } = useHelper((helper: InjectHelper & InjectorContractHelper) => ({
    injects: helper.getExerciseInjects(exerciseId),
  }));
  useDataLoader(() => {
    dispatch(fetchExerciseInjects(exerciseId));
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
  const injectsByInjectorContractData = [
    {
      name: t('Number of injects'),
      data: injectsByType.map((a: InjectStore & { number: number }) => ({
        x: tPick(a.inject_injector_contract?.injector_contract_labels),
        y: a.number,
        fillColor: a.inject_injector_contract?.injector_contract_content_parsed?.config?.color,
      })),
    },
  ];

  return (
    <>
      {injectsByType.length > 0 ? (
        <Chart
          // @ts-expect-error: Need to migrate Chart.js file
          options={horizontalBarsChartOptions(theme)}
          series={injectsByInjectorContractData}
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
