import { useTheme } from '@mui/styles';
import { FunctionComponent } from 'react';
import Chart from 'react-apexcharts';
import * as R from 'ramda';
import Empty from '../../../../../components/Empty';
import { useFormatter } from '../../../../../components/i18n';
import { areaChartOptions } from '../../../../../utils/Charts';
import type { Theme } from '../../../../../components/Theme';
import type { InjectStore } from '../../../../../actions/injects/Inject';
import type { Inject } from '../../../../../utils/api-types';

interface Props {
  injects: Inject[];
}

const InjectOverTimeArea: FunctionComponent<Props> = ({
  injects,
}) => {
  // Standard hooks
  const { t, nsdt } = useFormatter();
  const theme: Theme = useTheme();

  let cumulation = 0;
  const injectsOverTime = R.pipe(
    R.filter((i: InjectStore) => i && i.inject_sent_at !== null),
    R.sortWith([R.ascend(R.prop('inject_sent_at'))]),
    R.map((i: InjectStore) => {
      cumulation += 1;
      return R.assoc('inject_cumulated_number', cumulation, i);
    }),
  )(injects);
  const injectsData = [
    {
      name: t('Number of injects'),
      data: injectsOverTime.map((i: InjectStore & { inject_cumulated_number: number }) => ({
        x: i.inject_sent_at,
        y: i.inject_cumulated_number,
      })),
    },
  ];
  return (
    <>
      {injectsOverTime.length > 0 ? (
        <Chart
          // @ts-expect-error: Need to migrate Chart.js file
          options={areaChartOptions(theme, true, nsdt, null, undefined)}
          series={injectsData}
          type="area"
          width="100%"
          height={350}
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

export default InjectOverTimeArea;
