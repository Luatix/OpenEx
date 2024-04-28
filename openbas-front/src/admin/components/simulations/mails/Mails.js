import React from 'react';
import { makeStyles } from '@mui/styles';
import { Chip, Grid, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, Paper, Tooltip, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { FileDownloadOutlined, KeyboardArrowRight } from '@mui/icons-material';
import ItemTags from '../../../../components/ItemTags';
import SearchFilter from '../../../../components/SearchFilter';
import TagsFilter from '../../../../components/TagsFilter';
import { fetchExerciseInjects } from '../../../../actions/Inject';
import InjectIcon from '../../common/injects/InjectIcon';
import useSearchAnFilter from '../../../../utils/SortingFiltering';
import { useFormatter } from '../../../../components/i18n';
import useDataLoader from '../../../../utils/ServerSideEvent';
import { useHelper } from '../../../../store';
import { exportData } from '../../../../utils/Environment';
import AnimationMenu from '../AnimationMenu';
import CreateQuickInject from '../injects/CreateQuickInject';
import { fetchInjectorContracts } from '../../../../actions/InjectorContracts';
import MailDistributionOverTimeChart from './MailDistributionOverTimeChart';
import MailDistributionOverTimeLine from './MailDistributionOverTimeLine';
import MailDistributionByTeam from './MailDistributionByTeam';
import MailDistributionByPlayer from './MailDistributionByPlayer';
import MailDistributionByInject from './MailDistributionByInject';

const useStyles = makeStyles(() => ({
  itemHead: {
    paddingLeft: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
  bodyItem: {
    height: '100%',
    fontSize: 13,
  },
  goIcon: {
    paddingTop: 3,
  },
  coms: {
    fontSize: 12,
    height: 20,
    backgroundColor: 'rgba(0, 177, 255, 0.08)',
    color: '#00b1ff',
    border: '1px solid #00b1ff',
  },
  comsNotRead: {
    fontSize: 12,
    height: 20,
    backgroundColor: 'rgba(236, 64, 122, 0.08)',
    color: '#ec407a',
    border: '1px solid #ec407a',
  },
}));

const headerStyles = {
  iconSort: {
    position: 'absolute',
    margin: '0 0 0 5px',
    padding: 0,
    top: '0px',
  },
  inject_type: {
    float: 'left',
    width: '15%',
    fontSize: 12,
    fontWeight: '700',
  },
  inject_title: {
    float: 'left',
    width: '30%',
    fontSize: 12,
    fontWeight: '700',
  },
  inject_users_number: {
    float: 'left',
    width: '15%',
    fontSize: 12,
    fontWeight: '700',
  },
  inject_sent_at: {
    float: 'left',
    width: '15%',
    fontSize: 12,
    fontWeight: '700',
  },
  inject_communications_not_ack_number: {
    float: 'left',
    width: '10%',
    fontSize: 12,
    fontWeight: '700',
  },
  inject_communications_number: {
    float: 'left',
    width: '10%',
    fontSize: 12,
    fontWeight: '700',
  },
  inject_tags: {
    float: 'left',
    fontSize: 12,
    fontWeight: '700',
  },
};

const inlineStyles = {
  inject_type: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  inject_title: {
    float: 'left',
    width: '30%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  inject_users_number: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  inject_sent_at: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  inject_communications_not_ack_number: {
    float: 'left',
    width: '10%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  inject_communications_number: {
    float: 'left',
    width: '10%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  inject_tags: {
    float: 'left',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

const Mails = () => {
  // Standard hooks
  const classes = useStyles();
  const dispatch = useDispatch();
  const { t, fndt } = useFormatter();
  // Filter and sort hook
  const searchColumns = ['title', 'description', 'content'];
  const filtering = useSearchAnFilter('inject', 'sent_at', searchColumns);
  // Fetching data
  const { exerciseId } = useParams();
  const { exercise, injects, tagsMap } = useHelper((helper) => {
    return {
      exercise: helper.getExercise(exerciseId),
      injects: helper.getExerciseInjects(exerciseId),
      tagsMap: helper.getTagsMap(),
    };
  });
  useDataLoader(() => {
    dispatch(fetchExerciseInjects(exerciseId));
  });
  const sortedInjects = filtering
    .filterAndSort(injects)
    .filter((i) => i.inject_communications_number > 0);
  // Rendering
  return (
    <div>
      <AnimationMenu exerciseId={exerciseId} />
      <Grid container spacing={3}>
        <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4">
            {t('Sent mails over time')}
          </Typography>
          <Paper variant="outlined" classes={{ root: classes.paperChart }}>
            <MailDistributionOverTimeChart exerciseId={exerciseId} />
          </Paper>
        </Grid>
        <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4">
            {t('Sent mails over time')}
          </Typography>
          <Paper variant="outlined" classes={{ root: classes.paperChart }}>
            <MailDistributionOverTimeLine exerciseId={exerciseId} />
          </Paper>
        </Grid>
        <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4">
            {t('Distribution of mails by team')}
          </Typography>
          <Paper variant="outlined" classes={{ root: classes.paperChart }}>
            <MailDistributionByTeam exerciseId={exerciseId} />
          </Paper>
        </Grid>
        <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4">
            {t('Distribution of mails by player')}
          </Typography>
          <Paper variant="outlined" classes={{ root: classes.paperChart }}>
            <MailDistributionByPlayer exerciseId={exerciseId} />
          </Paper>
        </Grid>
        <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4">
            {t('Distribution of mails by inject')}
          </Typography>
          <Paper variant="outlined" classes={{ root: classes.paperChart }}>
            <MailDistributionByInject exerciseId={exerciseId} />
          </Paper>
        </Grid>
      </Grid>
      <div style={{ marginTop: 24 }}>
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
        <div style={{ float: 'right', margin: '-5px 15px 0 0' }}>
          {sortedInjects.length > 0 ? (
            <CSVLink
              data={exportData(
                'inject',
                [
                  'inject_type',
                  'inject_title',
                  'inject_description',
                  'inject_depends_duration',
                  'inject_users_number',
                  'inject_enabled',
                  'inject_tags',
                  'inject_content',
                ],
                sortedInjects,
                tagsMap,
              )}
              filename={`[${exercise.exercise_name}] ${t('Injects')}.csv`}
            >
              <Tooltip title={t('Export this list')}>
                <IconButton size="large">
                  <FileDownloadOutlined color="primary" />
                </IconButton>
              </Tooltip>
            </CSVLink>
          ) : (
            <IconButton size="large" disabled={true}>
              <FileDownloadOutlined />
            </IconButton>
          )}
        </div>
      </div>
      <div className="clearfix" />
      <List style={{ marginTop: 10 }}>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
        >
          <ListItemIcon>
            <span
              style={{
                padding: '0 8px 0 8px',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              &nbsp;
            </span>
          </ListItemIcon>
          <ListItemText
            primary={
              <div>
                {filtering.buildHeader(
                  'inject_title',
                  'Title',
                  false,
                  headerStyles,
                )}
                {filtering.buildHeader(
                  'inject_users_number',
                  'Players',
                  true,
                  headerStyles,
                )}
                {filtering.buildHeader(
                  'inject_sent_at',
                  'Sent at',
                  true,
                  headerStyles,
                )}
                {filtering.buildHeader(
                  'inject_communications_not_ack_number',
                  'Mails not read',
                  true,
                  headerStyles,
                )}
                {filtering.buildHeader(
                  'inject_communications_number',
                  'Total mails',
                  true,
                  headerStyles,
                )}
                {filtering.buildHeader(
                  'inject_tags',
                  'Tags',
                  true,
                  headerStyles,
                )}
              </div>
            }
          />
          <ListItemSecondaryAction> &nbsp; </ListItemSecondaryAction>
        </ListItem>
        {sortedInjects.map((inject) => {
          const injectContract = inject.inject_injector_contract.injector_contract_content_parsed;
          return (
            <ListItem
              key={inject.inject_id}
              component={Link}
              to={`/admin/exercises/${exerciseId}/animation/mails/${inject.inject_id}`}
              classes={{ root: classes.item }}
              divider={true}
              button={true}
            >
              <ListItemIcon style={{ paddingTop: 5 }}>
                <InjectIcon
                  tooltip={t(inject.inject_type)}
                  config={injectContract?.config}
                  type={inject.inject_type}
                  disabled={!inject.inject_enabled}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <div>
                    <div
                      className={classes.bodyItem}
                      style={inlineStyles.inject_title}
                    >
                      {inject.inject_title}
                    </div>
                    <div
                      className={classes.bodyItem}
                      style={inlineStyles.inject_users_number}
                    >
                      {inject.inject_users_number}
                    </div>
                    <div
                      className={classes.bodyItem}
                      style={inlineStyles.inject_sent_at}
                    >
                      {fndt(inject.inject_sent_at)}
                    </div>
                    <div
                      className={classes.bodyItem}
                      style={inlineStyles.inject_communications_not_ack_number}
                    >
                      <Chip
                        classes={{ root: classes.comsNotRead }}
                        label={inject.inject_communications_not_ack_number}
                      />
                    </div>
                    <div
                      className={classes.bodyItem}
                      style={inlineStyles.inject_communications_number}
                    >
                      <Chip
                        classes={{ root: classes.coms }}
                        label={inject.inject_communications_number}
                      />
                    </div>
                    <div
                      className={classes.bodyItem}
                      style={inlineStyles.inject_tags}
                    >
                      <ItemTags variant="list" tags={inject.inject_tags} />
                    </div>
                  </div>
                }
              />
              <ListItemSecondaryAction classes={{ root: classes.goIcon }}>
                <KeyboardArrowRight />
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
      <CreateQuickInject exercise={exercise} />
    </div>
  );
};

export default Mails;
