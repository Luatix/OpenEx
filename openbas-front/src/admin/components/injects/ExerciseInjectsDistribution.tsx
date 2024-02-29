import React, { FunctionComponent } from 'react';
import * as R from 'ramda';
import { useFormatter } from '../../../components/i18n';
import type { TeamStore } from '../../../actions/teams/Team';
import InjectsDistribution, { getTeamsColors } from './InjectsDistribution';

interface Props {
  teams: TeamStore[];
}

const ExerciseInjectsDistribution: FunctionComponent<Props> = ({
  teams,
}) => {
  // Standard hooks
  const { t } = useFormatter();

  const topTeams = R.pipe(
    R.sortWith([R.descend(R.prop('team_exercise_injects_number'))]),
    R.take(6),
  )(teams || []);
  const teamsColors = getTeamsColors(teams);
  const distributionChartData = [
    {
      name: t('Number of injects'),
      data: topTeams.map((a: TeamStore) => ({
        x: a.team_name,
        y: a.team_exercise_injects_number,
        fillColor: teamsColors[a.team_id],
      })),
    },
  ];
  const maxInjectsNumber = Math.max(
    ...topTeams.map((a: TeamStore) => a.team_exercise_injects_number),
  );

  return (
    <InjectsDistribution topTeams={topTeams}
      distributionChartData={distributionChartData}
      maxInjectsNumber={maxInjectsNumber}
    />
  );
};

export default ExerciseInjectsDistribution;
