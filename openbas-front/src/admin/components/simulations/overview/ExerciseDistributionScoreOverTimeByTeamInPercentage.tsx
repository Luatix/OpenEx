import React, { FunctionComponent } from 'react';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/styles';
import * as R from 'ramda';
import type { ExerciseStore } from '../../../../actions/exercises/Exercise';
import { lineChartOptions } from '../../../../utils/Charts';
import Empty from '../../../../components/Empty';
import { useFormatter } from '../../../../components/i18n';
import type { Theme } from '../../../../components/Theme';
import type { InjectExpectation } from '../../../../utils/api-types';
import { useHelper } from '../../../../store';
import type { InjectHelper } from '../../../../actions/injects/inject-helper';
import type { TeamsHelper } from '../../../../actions/teams/team-helper';
import { computeTeamsColors } from './DistributionUtils';
import type { InjectExpectationStore } from '../../../../actions/injects/Inject';

interface Props {
  exerciseId: ExerciseStore['exercise_id'];
}

const ExerciseDistributionScoreOverTimeByTeamInPercentage: FunctionComponent<Props> = ({
  exerciseId,
}) => {
  // Standard hooks
  const { t, nsdt } = useFormatter();
  const theme: Theme = useTheme();

  // Fetching data
  const { injectExpectations, teams, teamsMap } = useHelper((helper: InjectHelper & TeamsHelper) => ({
    injectExpectations: helper.getExerciseInjectExpectations(exerciseId),
    teams: helper.getExerciseTeams(exerciseId),
    teamsMap: helper.getTeamsMap(),
  }));

  const teamsTotalScores = R.pipe(
    R.filter((n: InjectExpectation) => !R.isEmpty(n.inject_expectation_results)),
    R.groupBy(R.prop('inject_expectation_team')),
    R.toPairs,
    R.map((n: [string, InjectExpectationStore[]]) => ({
      ...teamsMap[n[0]],
      team_total_score: R.sum(
        R.map((o: InjectExpectationStore) => o.inject_expectation_score, n[1]),
      ),
    })),
  )(injectExpectations);

  const teamsColors = computeTeamsColors(teams, theme);
  let cumulation = 0;
  const teamsPercentScoresData = R.pipe(
    R.filter((n: InjectExpectationStore) => !R.isEmpty(n.inject_expectation_results)),
    R.groupBy(R.prop('inject_expectation_team')),
    R.toPairs,
    R.map((n: [string, InjectExpectationStore[]]) => {
      cumulation = 0;
      return [
        n[0],
        R.pipe(
          R.sortWith([R.ascend(R.prop('inject_expectation_updated_at'))]),
          R.map((i: InjectExpectationStore) => {
            cumulation += i.inject_expectation_score;
            return R.assoc(
              'inject_expectation_percent_score',
              Math.round(
                (cumulation * 100)
                / (teamsMap[n[0]]
                  ? teamsMap[n[0]]
                    .team_injects_expectations_total_expected_score
                  : 1),
              ),
              i,
            );
          }),
        )(n[1]),
      ];
    }),
    R.map((n: [string, Array<InjectExpectationStore & { inject_expectation_percent_score: number }>]) => ({
      name: teamsMap[n[0]]?.team_name,
      color: teamsColors[n[0]],
      data: n[1].map((i) => ({
        x: i.inject_expectation_updated_at,
        y: i.inject_expectation_percent_score,
      })),
    })),
  )(injectExpectations);

  return (
    <>
      {teamsTotalScores.length > 0 ? (
        <Chart
          // @ts-expect-error: Need to migrate Chart.js file
          options={lineChartOptions(
            theme,
            true,
            // @ts-expect-error: Need to migrate i18n.js file
            nsdt,
            null,
            undefined,
            false,
            true,
          )}
          series={teamsPercentScoresData}
          type="line"
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

export default ExerciseDistributionScoreOverTimeByTeamInPercentage;
