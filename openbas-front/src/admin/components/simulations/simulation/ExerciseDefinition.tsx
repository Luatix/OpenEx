import { Grid, Typography } from '@mui/material';
import { useParams } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { type ExercisesHelper } from '../../../../actions/exercises/exercise-helper';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import { type Exercise } from '../../../../utils/api-types';
import ExerciseArticles from './articles/ExerciseArticles';
import ExerciseChallenges from './challenges/ExerciseChallenges';
import ExerciseTeams from './teams/ExerciseTeams';
import ExerciseVariables from './variables/ExerciseVariables';

// Deprecated - https://mui.com/system/styles/basics/
// Do not use it for new code.
const useStyles = makeStyles()(() => ({
  gridContainer: {
    marginBottom: 20,
  },
}));

const ExerciseDefinition = () => {
  // Standard hooks
  const { classes } = useStyles();
  const { t } = useFormatter();
  const { exerciseId } = useParams() as { exerciseId: Exercise['exercise_id'] };
  // Fetching data
  const { exercise } = useHelper((helper: ExercisesHelper) => ({
    exercise: helper.getExercise(exerciseId),
  }));
  return (
    <>
      <Grid
        container
        spacing={3}
        classes={{ container: classes.gridContainer }}
      >
        <Grid item xs={6} style={{ paddingTop: 10 }}>
          <ExerciseTeams exerciseTeamsUsers={exercise.exercise_teams_users ?? []} />
        </Grid>
        <Grid item xs={6} style={{ paddingTop: 10 }}>
          <ExerciseVariables />
        </Grid>
        <Grid item xs={12} style={{ marginTop: 25 }}>
          <Typography variant="h4" gutterBottom style={{ float: 'left' }}>
            {t('Media pressure')}
          </Typography>
          <ExerciseArticles />
        </Grid>
        <Grid item xs={12} style={{ marginTop: 10 }}>
          <Typography variant="h4" gutterBottom style={{ float: 'left' }}>
            {t('Used challenges (in injects)')}
          </Typography>
          <ExerciseChallenges />
        </Grid>
      </Grid>
    </>
  );
};

export default ExerciseDefinition;
