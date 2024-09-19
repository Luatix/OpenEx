import { useParams } from 'react-router-dom';
import React from 'react';
import { Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useHelper } from '../../../../store';
import type { ScenariosHelper } from '../../../../actions/scenarios/scenario-helper';
import type { ScenarioStore } from '../../../../actions/scenarios/Scenario';
import { useFormatter } from '../../../../components/i18n';
import ScenarioTeams from './teams/ScenarioTeams';
import ScenarioVariables from './variables/ScenarioVariables';
import ScenarioChallenges from './challenges/ScenarioChallenges';
import ScenarioArticles from './articles/ScenarioArticles';

// Deprecated - https://mui.com/system/styles/basics/
// Do not use it for new code.
const useStyles = makeStyles(() => ({
  gridContainer: {
    marginBottom: 20,
  },
}));

const ScenarioDefinition = () => {
  // Standard hooks
  const classes = useStyles();
  const { t } = useFormatter();
  const { scenarioId } = useParams() as { scenarioId: ScenarioStore['scenario_id'] };
  // Fetching data
  const { scenario } = useHelper((helper: ScenariosHelper) => ({
    scenario: helper.getScenario(scenarioId),
  }));
  return (
    <>
      <Grid
        container
        spacing={3}
        classes={{ container: classes.gridContainer }}
      >
        <Grid item xs={6} style={{ paddingTop: 10 }}>
          <ScenarioTeams scenarioTeamsUsers={scenario.scenario_teams_users} />
        </Grid>
        <Grid item xs={6} style={{ paddingTop: 10 }}>
          <ScenarioVariables />
        </Grid>
        <Grid item xs={12} style={{ marginTop: 25 }}>
          <Typography variant="h4" gutterBottom style={{ float: 'left' }}>
            {t('Media pressure')}
          </Typography>
          <ScenarioArticles />
        </Grid>
        <Grid item xs={12} style={{ marginTop: 5 }}>
          <Typography variant="h4" gutterBottom style={{ float: 'left' }}>
            {t('Used challenges (in injects)')}
          </Typography>
          <ScenarioChallenges />
        </Grid>
      </Grid>
    </>
  );
};

export default ScenarioDefinition;
