import { Grid, Typography } from '@mui/material';
import { useParams } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { type ScenariosHelper } from '../../../../actions/scenarios/scenario-helper';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import { type Scenario } from '../../../../utils/api-types';
import ScenarioArticles from './articles/ScenarioArticles';
import ScenarioChallenges from './challenges/ScenarioChallenges';
import ScenarioTeams from './teams/ScenarioTeams';
import ScenarioVariables from './variables/ScenarioVariables';

// Deprecated - https://mui.com/system/styles/basics/
// Do not use it for new code.
const useStyles = makeStyles()(() => ({
  gridContainer: {
    marginBottom: 20,
  },
}));

const ScenarioDefinition = () => {
  // Standard hooks
  const { classes } = useStyles();
  const { t } = useFormatter();
  const { scenarioId } = useParams() as { scenarioId: Scenario['scenario_id'] };
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
