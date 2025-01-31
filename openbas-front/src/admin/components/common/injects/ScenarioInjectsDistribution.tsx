import * as R from 'ramda';
import { FunctionComponent } from 'react';

import { useFormatter } from '../../../../components/i18n';
import type { Team } from '../../../../utils/api-types';
import InjectsDistribution from './InjectsDistribution';
import { getTeamsColors } from './teams/utils';

interface Props {
  teams: Team[];
}

const ScenarioInjectsDistribution: FunctionComponent<Props> = ({
  teams,
}) => {
  // Standard hooks
  const { t } = useFormatter();

  const topTeams = R.pipe(
    R.sortWith([R.descend(R.prop('team_scenario_injects_number'))]),
    R.take(6),
  )(teams || []);
  const teamsColors = getTeamsColors(teams);
  const distributionChartData = [
    {
      name: t('Number of injects'),
      data: topTeams.map((a: Team) => ({
        x: a.team_name,
        y: a.team_scenario_injects_number,
        fillColor: teamsColors[a.team_id],
      })),
    },
  ];
  const maxInjectsNumber = Math.max(
    ...topTeams.map((a: Team) => a.team_scenario_injects_number),
  );

  return (
    <InjectsDistribution
      topTeams={topTeams}
      distributionChartData={distributionChartData}
      maxInjectsNumber={maxInjectsNumber}
    />
  );
};

export default ScenarioInjectsDistribution;
