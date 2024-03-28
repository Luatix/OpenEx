import React, { useState } from 'react';
import { makeStyles, useTheme } from '@mui/styles';
import { Grid, Paper, Typography, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Drawer } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CastOutlined, CastForEducationOutlined } from '@mui/icons-material';
import * as R from 'ramda';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import useDataLoader from '../../../../utils/ServerSideEvent';
import { fetchExerciseTeams } from '../../../../actions/Exercise';
import { fetchInjects, fetchInjectTypes, updateInjectForExercise } from '../../../../actions/Inject';
import Empty from '../../../../components/Empty';
import SearchFilter from '../../../../components/SearchFilter';
import TagsFilter from '../../../../components/TagsFilter';
import useSearchAnFilter from '../../../../utils/SortingFiltering';
import InjectIcon from '../../components/injects/InjectIcon';
import { splitDuration } from '../../../../utils/Time';
import InjectPopover from '../../components/injects/InjectPopover';
import InjectStatus from '../../components/injects/InjectStatus';
import { truncate } from '../../../../utils/String';
import InjectDefinition from '../../components/injects/InjectDefinition';
import InjectStatusDetails from '../../components/injects/InjectStatusDetails';
import ProgressBarCountdown from '../../../../components/ProgressBarCountdown';
import AnimationMenu from '../AnimationMenu';
import { usePermissions } from '../../../../utils/Exercise';
import { fetchExerciseArticles } from '../../../../actions/channels/article-action';
import { fetchVariablesForExercise } from '../../../../actions/variables/variable-actions';

const useStyles = makeStyles(() => ({
  root: {
    width: '100%',
    flexGrow: 1,
    marginTop: 10,
    padding: '0 200px 50px 0',
    overflowX: 'hidden',
  },
  container: {
    marginTop: 60,
    paddingRight: 40,
  },
  parameters: {
    float: 'left',
  },
  names: {
    float: 'left',
    width: '10%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  lineName: {
    width: '100%',
    height: 50,
    lineHeight: '50px',
  },
  name: {
    fontSize: 14,
    fontWeight: 400,
    display: 'flex',
    alignItems: 'center',
  },
  timeline: {
    float: 'left',
    width: '90%',
    position: 'relative',
  },
  line: {
    position: 'relative',
    width: '100%',
    height: 50,
    lineHeight: '50px',
    padding: '0 20px 0 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
    verticalAlign: 'middle',
  },
  scale: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  tick: {
    position: 'absolute',
    width: 1,
  },
  tickLabelTop: {
    position: 'absolute',
    left: -28,
    top: -20,
    width: 100,
    fontSize: 10,
  },
  tickLabelBottom: {
    position: 'absolute',
    left: -28,
    bottom: -20,
    width: 100,
    fontSize: 10,
  },
  injectGroup: {
    position: 'absolute',
    padding: '6px 5px 0 5px',
    zIndex: 1000,
    display: 'grid',
    gridAutoFlow: 'column',
    gridTemplateRows: 'repeat(2, 20px)',
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
  bodyItem: {
    height: '100%',
    fontSize: 14,
    float: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  drawerPaper: {
    minHeight: '100vh',
    width: '50%',
    padding: 0,
  },
}));

const Timeline = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { exerciseId } = useParams();
  const permissions = usePermissions(exerciseId);
  const { t, fndt } = useFormatter();
  const {
    exercise,
    teams,
    injects,
    injectTypesMap,
    injectTypesWithNoTeams,
    tagsMap,
    teamsInjectsMap,
    technicalInjectsMap,
    articles,
    variables,
  } = useHelper((helper) => {
    const exerciseTeams = helper.getExerciseTeams(exerciseId);
    const injectsPerTeam = R.mergeAll(
      exerciseTeams.map((a) => ({
        [a.team_id]: helper.getTeamInjects(a.team_id),
      })),
    );
    return {
      exercise: helper.getExercise(exerciseId),
      injects: helper.getExerciseInjects(exerciseId),
      teams: exerciseTeams,
      exercisesMap: helper.getExercisesMap(),
      tagsMap: helper.getTagsMap(),
      teamsInjectsMap: injectsPerTeam,
      technicalInjectsMap:
        helper.getExerciseTechnicalInjectsPerType(exerciseId),
      injectTypesMap: helper.getInjectTypesMap(),
      injectTypesWithNoTeams: helper.getInjectTypesWithNoTeams(),
      articles: helper.getExerciseArticles(exerciseId),
      variables: helper.getExerciseVariables(exerciseId),
    };
  });
  const technicalTeams = injectTypesWithNoTeams
    .filter(
      (injectType) => injects.filter((i) => i.inject_type === injectType).length > 0,
    )
    .map((type) => ({ team_id: type, team_name: type }));
  const sortedNativeTeams = R.sortWith(
    [R.ascend(R.prop('team_name'))],
    teams,
  );
  const sortedTeams = [...technicalTeams, ...sortedNativeTeams];
  const injectsMap = { ...teamsInjectsMap, ...technicalInjectsMap };
  const [selectedInject, setSelectedInject] = useState(null);
  useDataLoader(() => {
    dispatch(fetchInjectTypes());
    dispatch(fetchExerciseTeams(exerciseId));
    dispatch(fetchInjects(exerciseId));
    dispatch(fetchExerciseArticles(exerciseId));
    dispatch(fetchVariablesForExercise(exerciseId));
  });
  // Filter and sort hook
  const searchColumns = ['title', 'description', 'content'];
  const filtering = useSearchAnFilter(
    'inject',
    'depends_duration',
    searchColumns,
  );
  const lastInject = R.pipe(
    R.sortWith([R.descend(R.prop('inject_depends_duration'))]),
    R.head,
  )(injects);
  const totalDuration = lastInject
    ? lastInject.inject_depends_duration + 3600
    : 60;
  const tickDuration = Math.round(totalDuration / 20);
  const ticks = [...Array(21)].map((_, i) => tickDuration * i);
  // eslint-disable-next-line consistent-return
  const byTick = R.groupBy((inject) => {
    const duration = inject.inject_depends_duration;
    for (const tick of ticks) {
      if (duration < tick) {
        return tick - tickDuration;
      }
    }
  });
  const pendingInjects = R.sortWith(
    [R.ascend(R.prop('inject_depends_duration'))],
    injects.filter((i) => i.inject_status === null),
  );
  const processedInjects = R.sortWith(
    [R.descend(R.prop('inject_depends_duration'))],
    injects.filter((i) => i.inject_status !== null),
  );
  const injectTypes = R.values(injectTypesMap);
  const disabledTypes = injectTypes
    .filter((type) => type.config.expose === false)
    .map((type) => type.config.type);
  const types = injectTypes.map((type) => type.config.type);
  const grid0 = theme.palette.mode === 'light' ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)';
  const grid5 = theme.palette.mode === 'light'
    ? 'rgba(0,0,0,0.05)'
    : 'rgba(255,255,255,0.05)';
  const grid25 = theme.palette.mode === 'light'
    ? '1px solid rgba(0, 0, 0, 0.25)'
    : '1px solid rgba(255, 255, 255, 0.25)';
  const grid15 = theme.palette.mode === 'light'
    ? '1px dashed rgba(0, 0, 0, 0.15)'
    : '1px dashed rgba(255, 255, 255, 0.15)';

  const onUpdateInject = (injectId, inject) => dispatch(updateInjectForExercise(exerciseId, injectId, inject));
  return (
    <div className={classes.root}>
      <AnimationMenu exerciseId={exerciseId} />
      <div className={classes.parameters}>
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
      </div>
      <div className="clearfix" />
      {sortedTeams.length > 0 ? (
        <div className={classes.container}>
          <div className={classes.names}>
            {sortedTeams.map((team) => (
              <div key={team.team_id} className={classes.lineName}>
                <div className={classes.name}>
                  {team.team_name.startsWith('openbas_') ? (
                    <CastOutlined fontSize="small" />
                  ) : (
                    <CastForEducationOutlined fontSize="small" />
                  )}
                  &nbsp;&nbsp;
                  {team.team_name.startsWith('openbas_')
                    ? t(team.team_name)
                    : truncate(team.team_name, 20)}
                </div>
              </div>
            ))}
          </div>
          <div className={classes.timeline}>
            {sortedTeams.map((team, index) => {
              const injectsGroupedByTick = byTick(
                filtering.filterAndSort(injectsMap[team.team_id]),
              );
              return (
                <div
                  key={team.team_id}
                  className={classes.line}
                  style={{ backgroundColor: index % 2 === 0 ? grid0 : grid5 }}
                >
                  {Object.keys(injectsGroupedByTick).map((key, i) => {
                    const injectGroupPosition = (key * 100) / totalDuration;
                    return (
                      <div
                        key={i}
                        className={classes.injectGroup}
                        style={{ left: `${injectGroupPosition}%` }}
                      >
                        {injectsGroupedByTick[key].map((inject) => (
                          <InjectIcon
                            key={inject.inject_id}
                            type={inject.inject_type}
                            tooltip={inject.inject_title}
                            done={inject.inject_status !== null}
                            disabled={!inject.inject_enabled}
                            size="small"
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <div className={classes.scale}>
              {ticks.map((tick, index) => {
                const duration = splitDuration(tick);
                return (
                  <div
                    key={tick}
                    className={classes.tick}
                    style={{
                      left: `${index * 5}%`,
                      height: index % 5 === 0 ? 'calc(100% + 30px)' : '100%',
                      top: index % 5 === 0 ? -15 : 0,
                      borderRight: index % 5 === 0 ? grid25 : grid15,
                    }}
                  >
                    <div className={classes.tickLabelTop}>
                      {index % 5 === 0
                        ? `${duration.days}
                        ${t('d')}, ${duration.hours}
                        ${t('h')}, ${duration.minutes}
                        ${t('m')}`
                        : ''}
                    </div>
                    <div className={classes.tickLabelBottom}>
                      {index % 5 === 0
                        ? `${duration.days}
                        ${t('d')}, ${duration.hours}
                        ${t('h')}, ${duration.minutes}
                        ${t('m')}`
                        : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className={classes.container}>
          <div className={classes.names}>
            <div className={classes.lineName}>
              <div className={classes.name}>
                <CastForEducationOutlined fontSize="small" />
                &nbsp;&nbsp;
                {t('No team')}
              </div>
            </div>
          </div>
          <div className={classes.timeline}>
            <div className={classes.line}> &nbsp; </div>
            <div className={classes.scale}>
              {ticks.map((tick, index) => {
                const duration = splitDuration(tick);
                return (
                  <div
                    key={tick}
                    className={classes.tick}
                    style={{
                      left: `${index * 5}%`,
                      height: index % 5 === 0 ? '110%' : '100%',
                      top: index % 5 === 0 ? '-5%' : 0,
                      borderRight: index % 5 === 0 ? grid25 : grid15,
                    }}
                  >
                    <div className={classes.tickLabelTop}>
                      {index % 5 === 0
                        ? `${duration.days}
                        ${t('d')}, ${duration.hours}
                        ${t('h')}, ${duration.minutes}
                        ${t('m')}`
                        : ''}
                    </div>
                    <div className={classes.tickLabelBottom}>
                      {index % 5 === 0
                        ? `${duration.days}
                        ${t('d')}, ${duration.hours}
                        ${t('h')}, ${duration.minutes}
                        ${t('m')}`
                        : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <div className="clearfix" />
      <Grid container={true} spacing={3} style={{ marginTop: 50 }}>
        <Grid item={true} xs={6}>
          <Typography variant="h4">{t('Pending injects')}</Typography>
          <Paper variant="outlined" classes={{ root: classes.paper }}>
            {pendingInjects.length > 0 ? (
              <List style={{ paddingTop: 0 }}>
                {pendingInjects.map((inject) => {
                  const isDisabled = disabledTypes.includes(inject.inject_type)
                    || !types.includes(inject.inject_type);
                  return (
                    <ListItem
                      key={inject.inject_id}
                      dense={true}
                      classes={{ root: classes.item }}
                      divider={true}
                      button={true}
                      disabled={isDisabled || !inject.inject_enabled}
                      onClick={() => setSelectedInject(inject.inject_id)}
                    >
                      <ListItemIcon>
                        <InjectIcon
                          type={inject.inject_type}
                          variant="inline"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <div>
                            <div
                              className={classes.bodyItem}
                              style={{ width: '50%' }}
                            >
                              {inject.inject_title}
                            </div>
                            <div
                              className={classes.bodyItem}
                              style={{ width: '20%', paddingTop: 8 }}
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
                                paddingTop: 3,
                                marginRight: 15,
                              }}
                            >
                              {fndt(inject.inject_date)}
                            </div>
                          </div>
                        }
                      />
                      <ListItemSecondaryAction>
                        <InjectPopover
                          inject={inject}
                          exerciseId={exerciseId}
                          exercise={exercise}
                          tagsMap={tagsMap}
                          injectTypesMap={injectTypesMap}
                          setSelectedInject={setSelectedInject}
                          isDisabled={isDisabled}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Empty message={t('No pending injects in this simulation.')} />
            )}
          </Paper>
        </Grid>
        <Grid item={true} xs={6}>
          <Typography variant="h4">{t('Processed injects')}</Typography>
          <Paper variant="outlined" classes={{ root: classes.paper }}>
            {processedInjects.length > 0 ? (
              <List style={{ paddingTop: 0 }}>
                {processedInjects.map((inject) => (
                  <ListItem
                    key={inject.inject_id}
                    dense={true}
                    classes={{ root: classes.item }}
                    divider={true}
                  >
                    <ListItemIcon>
                      <InjectIcon type={inject.inject_type} variant="inline" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <div>
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
                            <InjectStatus
                              variant="list"
                              status={inject.inject_status?.status_name}
                            />
                          </div>
                          <div
                            className={classes.bodyItem}
                            style={{
                              fontFamily: 'Consolas, monaco, monospace',
                              fontSize: 12,
                              paddingTop: 3,
                              marginRight: 15,
                            }}
                          >
                            {fndt(inject.inject_status?.tracking_sent_date)} (
                            {inject.inject_status
                              && (
                                inject.inject_status.tracking_total_execution_time / 1000
                              ).toFixed(2)}
                            s)
                          </div>
                        </div>
                      }
                    />
                    <ListItemSecondaryAction>
                      <InjectStatusDetails status={inject.inject_status} />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Empty message={t('No processed injects in this simulation.')} />
            )}
          </Paper>
        </Grid>
      </Grid>
      <Drawer
        open={selectedInject !== null}
        keepMounted={false}
        anchor="right"
        sx={{ zIndex: 1202 }}
        classes={{ paper: classes.drawerPaper }}
        onClose={() => setSelectedInject(null)}
        elevation={1}
        disableEnforceFocus
      >
        <InjectDefinition
          injectId={selectedInject}
          injectTypes={injectTypes}
          handleClose={() => setSelectedInject(null)}
          tagsMap={tagsMap}
          permissions={permissions}
          teamsFromExerciseOrScenario={teams}
          articlesFromExerciseOrScenario={articles}
          variablesFromExerciseOrScenario={variables}
          onUpdateInject={onUpdateInject}
          uriVariable={`/admin/exercises/${exerciseId}/definition/variables`}
          allUsersNumber={exercise.exercise_all_users_number}
          usersNumber={exercise.exercise_users_number}
          teamsUsers={exercise.exercise_teams_users}
        />
      </Drawer>
    </div>
  );
};

export default Timeline;
