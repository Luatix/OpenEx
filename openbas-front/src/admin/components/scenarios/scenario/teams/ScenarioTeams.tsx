import { Paper, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import * as React from 'react';
import { useParams } from 'react-router';

import {
  fetchScenarioTeams,
} from '../../../../../actions/scenarios/scenario-actions';
import type { ScenariosHelper } from '../../../../../actions/scenarios/scenario-helper';
import { useFormatter } from '../../../../../components/i18n';
import { useHelper } from '../../../../../store';
import type { Scenario, Team } from '../../../../../utils/api-types';
import { useAppDispatch } from '../../../../../utils/hooks';
import useDataLoader from '../../../../../utils/hooks/useDataLoader';
import { PermissionsContext, TeamContext } from '../../../common/Context';
import ContextualTeams from '../../../components/teams/ContextualTeams';
import UpdateTeams from '../../../components/teams/UpdateTeams';
import teamContextForScenario from './teamContextForScenario';

interface Props {
  scenarioTeamsUsers: Scenario['scenario_teams_users'];
}

const ScenarioTeams: React.FC<Props> = ({ scenarioTeamsUsers }) => {
  // Standard hooks
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  const { permissions } = useContext(PermissionsContext);

  // Fetching data
  const { scenarioId } = useParams() as { scenarioId: Scenario['scenario_id'] };
  const { teamsStore }: { teamsStore: Team[] } = useHelper((helper: ScenariosHelper) => ({
    teamsStore: helper.getScenarioTeams(scenarioId),
  }));
  useDataLoader(() => {
    dispatch(fetchScenarioTeams(scenarioId));
  });

  const [teams, setTeams] = useState<Team[]>([]);
  useEffect(() => {
    setTeams(teamsStore);
  }, [teamsStore]);

  return (
    <TeamContext.Provider value={teamContextForScenario(scenarioId, scenarioTeamsUsers)}>
      <Typography variant="h4" gutterBottom style={{ float: 'left' }}>
        {t('Teams')}
      </Typography>
      {permissions.canWrite
      && (
        <UpdateTeams
          addedTeamIds={teams.map((team: Team) => team.team_id)}
          setTeams={(ts: Team[]) => setTeams(ts)}
        />
      )}
      <div className="clearfix" />
      <Paper sx={{ minHeight: '100%', padding: 2 }} variant="outlined">
        <ContextualTeams teams={teams} />
      </Paper>
    </TeamContext.Provider>
  );
};

export default ScenarioTeams;
