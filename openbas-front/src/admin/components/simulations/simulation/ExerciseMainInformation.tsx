import { Chip, Grid, Link as MUILink, Paper, Typography } from '@mui/material';
import * as R from 'ramda';
import { FunctionComponent } from 'react';
import { Link } from 'react-router';

import type { ScenariosHelper } from '../../../../actions/scenarios/scenario-helper';
import ExpandableMarkdown from '../../../../components/ExpandableMarkdown';
import { useFormatter } from '../../../../components/i18n';
import ItemCategory from '../../../../components/ItemCategory';
import ItemMainFocus from '../../../../components/ItemMainFocus';
import ItemSeverity from '../../../../components/ItemSeverity';
import ItemTags from '../../../../components/ItemTags';
import PlatformIcon from '../../../../components/PlatformIcon';
import { useHelper } from '../../../../store';
import type { Exercise, KillChainPhase } from '../../../../utils/api-types';
import { truncate } from '../../../../utils/String';

interface Props {
  exercise: Exercise;
}

const ExerciseMainInformation: FunctionComponent<Props> = ({ exercise }) => {
  const { t } = useFormatter();
  const sortByOrder = R.sortWith([R.ascend(R.prop('phase_order'))]);
  const scenarioBaseUri = '/admin/scenarios';
  const { scenario } = useHelper((helper: ScenariosHelper) => ({
    scenario: helper.getScenario(exercise.exercise_scenario || ''),
  }));

  return (
    <Paper sx={{ padding: '15px' }} variant="outlined">
      <Grid id="main_information" container spacing={3}>
        <Grid item xs={8} style={{ paddingTop: 10 }}>
          <Typography
            variant="h3"
            gutterBottom
            style={{ marginTop: 20 }}
          >
            {t('Description')}
          </Typography>
          <ExpandableMarkdown
            source={exercise.exercise_description}
            limit={300}
          />
        </Grid>
        <Grid item xs={4} style={{ paddingTop: 10 }}>
          <Typography
            variant="h3"
            gutterBottom
            style={{ marginTop: 20 }}
          >
            {t('Parent scenario')}
          </Typography>
          {scenario ? (
            <MUILink
              component={Link}
              to={scenarioBaseUri + '/' + scenario.scenario_id}
            >
              <Typography
                overflow="hidden"
                textOverflow="ellipsis"
              >
                { truncate(scenario.scenario_name, 30) }
              </Typography>
            </MUILink>
          ) : '-'}
        </Grid>
        <Grid item xs={4} style={{ paddingTop: 10 }}>
          <Typography
            variant="h3"
            gutterBottom
            style={{ marginTop: 20 }}
            sx={{
              width: '100%',
            }}
          >
            {t('Severity')}
          </Typography>
          <ItemSeverity severity={exercise.exercise_severity} label={t(exercise.exercise_severity ?? 'Unknown')} />
        </Grid>
        <Grid item xs={4} style={{ paddingTop: 10 }}>
          <Typography
            variant="h3"
            gutterBottom
            style={{ marginTop: 20 }}
          >
            {t('Category')}
          </Typography>
          <ItemCategory category={exercise?.exercise_category ?? ''} label={t(exercise.exercise_category ?? 'Unknown')} />
        </Grid>
        <Grid item xs={4} style={{ paddingTop: 10 }}>
          <Typography
            variant="h3"
            gutterBottom
            style={{ marginTop: 20 }}
          >
            {t('Main Focus')}
          </Typography>
          <ItemMainFocus mainFocus={exercise?.exercise_main_focus ?? ''} label={t(exercise.exercise_main_focus ?? 'Unknown')} />
        </Grid>
        <Grid item xs={4} style={{ paddingTop: 10 }}>
          <Typography
            variant="h3"
            gutterBottom
            style={{ marginTop: 20 }}
          >
            {t('Tags')}
          </Typography>
          <ItemTags tags={exercise.exercise_tags} limit={10} />
        </Grid>
        <Grid item xs={4} style={{ paddingTop: 10 }}>
          <Typography
            variant="h3"
            gutterBottom
            style={{ marginTop: 20 }}
          >
            {t('Platforms')}
          </Typography>
          {(exercise.exercise_platforms ?? []).length === 0 ? (
            <PlatformIcon platform={t('No inject in this scenario')} tooltip width={25} />
          ) : exercise.exercise_platforms?.map(
            (platform: string) => <PlatformIcon key={platform} platform={platform} tooltip width={25} marginRight={10} />,
          )}
        </Grid>
        <Grid item xs={4} style={{ paddingTop: 10 }}>
          <Typography
            variant="h3"
            gutterBottom
            style={{ marginTop: 20 }}
          >
            {t('Kill Chain Phases')}
          </Typography>
          {(exercise.exercise_kill_chain_phases ?? []).length === 0 && '-'}
          {sortByOrder(exercise.exercise_kill_chain_phases ?? []).map((killChainPhase: KillChainPhase) => (
            <Chip
              key={killChainPhase.phase_id}
              variant="outlined"
              style={{
                fontSize: 12,
                height: 25,
                margin: '0 7px 7px 0',
                textTransform: 'uppercase',
                borderRadius: 4,
                width: 180,
              }}
              color="error"
              label={killChainPhase.phase_name}
            />
          ))}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ExerciseMainInformation;
