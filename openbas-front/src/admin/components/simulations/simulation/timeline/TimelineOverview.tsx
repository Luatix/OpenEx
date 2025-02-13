import { PreviewOutlined } from '@mui/icons-material';
import {
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { fetchExerciseTeams } from '../../../../../actions/Exercise';
import { type ExercisesHelper } from '../../../../../actions/exercises/exercise-helper';
import { fetchExerciseInjects, updateInjectForExercise } from '../../../../../actions/Inject';
import { type InjectStore } from '../../../../../actions/injects/Inject';
import { type InjectHelper } from '../../../../../actions/injects/inject-helper';
import { BACK_LABEL, BACK_URI } from '../../../../../components/Breadcrumbs';
import Empty from '../../../../../components/Empty';
import { useFormatter } from '../../../../../components/i18n';
import ItemStatus from '../../../../../components/ItemStatus';
import ProgressBarCountdown from '../../../../../components/ProgressBarCountdown';
import SearchFilter from '../../../../../components/SearchFilter';
import Timeline from '../../../../../components/Timeline';
import { useHelper } from '../../../../../store';
import { type Exercise, type Inject } from '../../../../../utils/api-types';
import { useAppDispatch } from '../../../../../utils/hooks';
import useDataLoader from '../../../../../utils/hooks/useDataLoader';
import useSearchAnFilter from '../../../../../utils/SortingFiltering';
import { isNotEmptyField } from '../../../../../utils/utils';
import { TeamContext } from '../../../common/Context';
import TagsFilter from '../../../common/filters/TagsFilter';
import InjectIcon from '../../../common/injects/InjectIcon';
import InjectPopover from '../../../common/injects/InjectPopover';
import UpdateInject from '../../../common/injects/UpdateInject';
import AnimationMenu from '../AnimationMenu';
import teamContextForExercise from '../teams/teamContextForExercise';
import InjectOverTimeArea from './InjectOverTimeArea';
import InjectOverTimeLine from './InjectOverTimeLine';

const useStyles = makeStyles()(() => ({
  root: {
    width: '100%',
    margin: '-12px 0 50px 0',
  },
  paperChart: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: 15,
    borderRadius: 4,
  },
  paper: {
    position: 'relative',
    padding: 0,
    overflow: 'hidden',
    height: '100%',
  },
  item: {
    height: 50,
    minHeight: 50,
    maxHeight: 50,
    paddingRight: 0,
  },
  bodyItems: {
    display: 'flex',
    alignItems: 'center',
  },
  bodyItem: {
    height: '100%',
    fontSize: 14,
    float: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 10,
  },
}));

const TimelineOverview = () => {
  const { classes } = useStyles();
  const dispatch = useAppDispatch();
  const { exerciseId } = useParams() as { exerciseId: Exercise['exercise_id'] };
  const { t, fndt } = useFormatter();
  const [selectedInjectId, setSelectedInjectId] = useState<string | null>(null);

  const {
    exercise,
    injects,
    teams,
  } = useHelper((helper: InjectHelper & ExercisesHelper) => {
    return {
      exercise: helper.getExercise(exerciseId),
      injects: helper.getExerciseInjects(exerciseId),
      teams: helper.getExerciseTeams(exerciseId),
    };
  });

  // Fetching Data
  useDataLoader(() => {
    dispatch(fetchExerciseTeams(exerciseId));
    dispatch(fetchExerciseInjects(exerciseId));
  });

  // Sort
  const searchColumns = ['title', 'description', 'content'];
  const filtering = useSearchAnFilter(
    'inject',
    'depends_duration',
    searchColumns,
  );

  const isEnable = (inject: InjectStore): boolean => inject.inject_injector_contract.injector_contract_content_parsed?.config.expose && inject.inject_enabled;
  const filteredInjects = filtering.filterAndSort(injects.filter((inject: InjectStore) => isEnable(inject)));
  const pendingInjects = filtering.filterAndSort(filteredInjects.filter((inject: InjectStore) => inject.inject_status === null));
  const processedInjects = filtering.filterAndSort(filteredInjects.filter((i: InjectStore) => i.inject_status !== null));

  const onUpdateInject = async (inject: Inject) => {
    if (selectedInjectId) {
      await dispatch(updateInjectForExercise(exerciseId, selectedInjectId, inject));
    }
  };

  const teamContext = teamContextForExercise(exerciseId, []);

  return (
    <div className={classes.root}>
      <AnimationMenu exerciseId={exerciseId} />
      <div style={{ float: 'left', marginRight: 10 }}>
        <SearchFilter
          variant="small"
          onChange={filtering.handleSearch}
          keyword={filtering.keyword}
        />
      </div>
      <div style={{ float: 'left', marginRight: 10 }}>
        <TagsFilter
          onAddTag={filtering.handleAddTag}
          onRemoveTag={filtering.handleRemoveTag}
          currentTags={filtering.tags}
        />
      </div>
      <div className="clearfix" />
      <Timeline
        injects={filteredInjects}
        teams={teams}
        onSelectInject={(id: string) => setSelectedInjectId(id)}
      >
      </Timeline>
      <div className="clearfix" />
      <Grid container spacing={3} style={{ marginTop: 50, paddingBottom: 24 }}>
        <Grid container item spacing={3}>
          <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4">{t('Pending injects')}</Typography>
            <Paper variant="outlined" classes={{ root: classes.paper }}>
              {pendingInjects.length > 0 ? (
                <List style={{ paddingTop: 0 }}>
                  {pendingInjects.map((inject: InjectStore) => {
                    return (
                      <ListItem
                        key={inject.inject_id}
                        secondaryAction={(
                          <InjectPopover
                            inject={inject}
                            setSelectedInjectId={setSelectedInjectId}
                            canDone
                            canTriggerNow
                          />
                        )}
                      >
                        <ListItemButton
                          dense
                          classes={{ root: classes.item }}
                          divider
                          onClick={() => setSelectedInjectId(inject.inject_id)}
                        >
                          <ListItemIcon>
                            <InjectIcon
                              isPayload={isNotEmptyField(inject.inject_injector_contract.injector_contract_payload)}
                              type={
                                inject.inject_injector_contract.injector_contract_payload
                                  ? inject.inject_injector_contract.injector_contract_payload?.payload_collector_type
                                  || inject.inject_injector_contract.injector_contract_payload?.payload_type
                                  : inject.inject_type
                              }
                              variant="inline"
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={(
                              <div className={classes.bodyItems}>
                                <div
                                  className={classes.bodyItem}
                                  style={{ width: '50%' }}
                                >
                                  {inject.inject_title}
                                </div>
                                <div
                                  className={classes.bodyItem}
                                  style={{ width: '20%' }}
                                >
                                  <ProgressBarCountdown
                                    date={inject.inject_date}
                                    paused={
                                      exercise?.exercise_status === 'PAUSED'
                                      || exercise?.exercise_status === 'CANCELED'
                                    }
                                  />
                                </div>
                                <div
                                  className={classes.bodyItem}
                                  style={{
                                    fontFamily: 'Consolas, monaco, monospace',
                                    fontSize: 12,
                                  }}
                                >
                                  {fndt(inject.inject_date)}
                                </div>
                              </div>
                            )}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Empty message={t('No pending injects in this simulation.')} />
              )}
            </Paper>
          </Grid>
          <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4">{t('Processed injects')}</Typography>
            <Paper variant="outlined" classes={{ root: classes.paper }}>
              {processedInjects.length > 0 ? (
                <List style={{ paddingTop: 0 }}>
                  {processedInjects.map((inject: InjectStore) => (
                    <ListItem key={inject.inject_id} secondaryAction={<PreviewOutlined />}>
                      <ListItemButton
                        dense
                        classes={{ root: classes.item }}
                        divider
                        component={Link}
                        to={`/admin/simulations/${exerciseId}/injects/${inject.inject_id}?${BACK_LABEL}=Animation&${BACK_URI}=/admin/simulations/${exerciseId}/animation/timeline`}
                      >
                        <ListItemIcon>
                          <InjectIcon
                            isPayload={isNotEmptyField(inject.inject_injector_contract.injector_contract_payload)}
                            type={
                              inject.inject_injector_contract.injector_contract_payload
                                ? inject.inject_injector_contract.injector_contract_payload?.payload_collector_type
                                || inject.inject_injector_contract.injector_contract_payload?.payload_type
                                : inject.inject_type
                            }
                            variant="inline"
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={(
                            <div className={classes.bodyItems}>
                              <div
                                className={classes.bodyItem}
                                style={{ width: '40%' }}
                              >
                                {inject.inject_title}
                              </div>
                              <div
                                className={classes.bodyItem}
                                style={{ width: '20%' }}
                              >
                                <ItemStatus
                                  key={inject.inject_id}
                                  variant="inList"
                                  label={inject.inject_status?.status_name ? t(inject.inject_status.status_name) : 'No Status'}
                                  status={inject.inject_status?.status_name}
                                />
                              </div>
                              <div
                                className={classes.bodyItem}
                                style={{
                                  fontFamily: 'Consolas, monaco, monospace',
                                  fontSize: 12,
                                }}
                              >
                                {fndt(inject.inject_status?.tracking_sent_date)}
                                {' '}
                                {
                                  inject.inject_status?.tracking_sent_date && inject.inject_status.tracking_end_date
                                  && ((new Date(inject.inject_status.tracking_end_date).getTime() - new Date(inject.inject_status.tracking_sent_date).getTime()) / 1000).toFixed(2)
                                }
                                {t('s')}
                              </div>
                            </div>
                          )}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Empty message={t('No processed injects in this simulation.')} />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Typography variant="h4">
            {t('Sent injects over time')}
          </Typography>
          <Paper variant="outlined" classes={{ root: classes.paperChart }}>
            <InjectOverTimeArea injects={filteredInjects} />
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h4">
            {t('Sent injects over time')}
          </Typography>
          <Paper variant="outlined" classes={{ root: classes.paperChart }}>
            <InjectOverTimeLine injects={filteredInjects} />
          </Paper>
        </Grid>
      </Grid>
      {selectedInjectId && (
        <TeamContext.Provider value={teamContext}>
          <UpdateInject
            open={selectedInjectId !== null}
            handleClose={() => setSelectedInjectId(null)}
            onUpdateInject={onUpdateInject}
            injectId={selectedInjectId}
            isAtomic={false}
            injects={injects}
          />
        </TeamContext.Provider>
      )}
    </div>
  );
};

export default TimelineOverview;
