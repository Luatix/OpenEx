import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as R from 'ramda';
import { injectIntl } from 'react-intl';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import Dialog from '@material-ui/core/Dialog';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import * as Constants from '../../../constants/ComponentTypes';
import Theme from '../../../components/Theme';
import { T } from '../../../components/I18n';
import { i18nRegister } from '../../../utils/Messages';
import { dateFormat, timeDiff } from '../../../utils/Time';
import {
  MainListItem,
  MainSmallListItem,
  SecondaryListItem,
  TertiaryListItem,
} from '../../../components/list/ListItem';
import { Icon } from '../../../components/Icon';
import { fetchObjectives } from '../../../actions/Objective';
import { fetchSubobjectives } from '../../../actions/Subobjective';
import { fetchAudiences } from '../../../actions/Audience';
import { fetchSubaudiences } from '../../../actions/Subaudience';
import { fetchEvents } from '../../../actions/Event';
import { fetchIncidents, fetchIncidentTypes } from '../../../actions/Incident';
import { downloadFile } from '../../../actions/File';
import { fetchAllInjects } from '../../../actions/Inject';
import { fetchExercise } from '../../../actions/Exercise';
import { fetchGroups } from '../../../actions/Group';
import EventView from './scenario/event/EventView';
import IncidentView from './scenario/event/IncidentView';
import InjectView from './scenario/event/InjectView';
import AudienceView from './audiences/audience/AudienceView';
import ObjectiveView from './objective/ObjectiveView';
import AudiencePopover from './AudiencePopover';
import AudiencesPopover from './AudiencesPopover';
import ScenarioPopover from './ScenarioPopover';

i18nRegister({
  fr: {
    'Main objectives': 'Objectifs principaux',
    Audiences: 'Audiences',
    players: 'joueurs',
    'You do not have any objectives in this exercise.':
      "Vous n'avez aucun objectif dans cet exercice.",
    'You do not have any audiences in this exercise.':
      "Vous n'avez aucune audience dans cet exercice.",
    Scenario: 'Scénario',
    'You do not have any events in this exercise.':
      "Vous n'avez aucun événement dans cet exercice.",
    'Inject view': "Vue de l'injection",
    'Incident view': "Vue de l'incident",
    'Objective view': "Vue de l'objectif",
    'Audience view': "Vue de l'audience",
    'Event view': "Vue de l'événement",
    'View all': 'Voir tout',
    'Audiences of the inject': "Audiences de l'injection",
  },
});

const styles = () => ({
  empty: {
    marginTop: 15,
    fontSize: 16,
  },
});

class IndexExercise extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openViewEvent: false,
      currentEvent: {},
      openViewIncident: false,
      currentIncident: {},
      openViewInject: false,
      currentInject: {},
      openViewAudience: false,
      currentAudience: {},
      openViewObjective: false,
      currentObjective: {},
      openObjectives: false,
      openAudiences: false,
      currentInjectAudiences: [],
      openInjectAudiences: false,
    };
  }

  componentDidMount() {
    this.props.fetchIncidentTypes();
    this.props.fetchGroups();
    this.props.fetchObjectives(this.props.exerciseId);
    this.props.fetchSubobjectives(this.props.exerciseId);
    this.props.fetchAudiences(this.props.exerciseId);
    this.props.fetchSubaudiences(this.props.exerciseId);
    this.props.fetchEvents(this.props.exerciseId);
    this.props.fetchIncidents(this.props.exerciseId);
    this.props.fetchAllInjects(this.props.exerciseId);
    this.props.fetchExercise(this.props.exerciseId);
  }

  // eslint-disable-next-line class-methods-use-this
  selectIcon(type) {
    switch (type) {
      case 'email':
        return (
          <Icon
            name={Constants.ICON_NAME_CONTENT_MAIL}
            type={Constants.ICON_TYPE_MAINLIST}
          />
        );
      case 'ovh-sms':
        return (
          <Icon
            name={Constants.ICON_NAME_NOTIFICATION_SMS}
            type={Constants.ICON_TYPE_MAINLIST}
          />
        );
      default:
        return (
          <Icon
            name={Constants.ICON_NAME_CONTENT_MAIL}
            type={Constants.ICON_TYPE_MAINLIST}
          />
        );
    }
  }

  // eslint-disable-next-line class-methods-use-this
  switchColor(disabled) {
    if (disabled) {
      return Theme.palette.disabledColor;
    }
    return Theme.palette.textColor;
  }

  handleOpenViewEvent(event) {
    this.setState({ currentEvent: event, openViewEvent: true });
  }

  handleCloseViewEvent() {
    this.setState({ openViewEvent: false });
  }

  handleOpenViewIncident(incident) {
    this.setState({ currentIncident: incident, openViewIncident: true });
  }

  handleCloseViewIncident() {
    this.setState({ openViewIncident: false });
  }

  handleOpenViewInject(inject) {
    this.setState({ currentInject: inject, openViewInject: true });
  }

  handleCloseViewInject() {
    this.setState({ openViewInject: false });
  }

  handleOpenViewAudience(audience) {
    this.setState({ currentAudience: audience, openViewAudience: true });
  }

  handleCloseViewAudience() {
    this.setState({ openViewAudience: false });
  }

  handleOpenViewObjective(objective) {
    this.setState({ currentObjective: objective, openViewObjective: true });
  }

  handleCloseViewObjective() {
    this.setState({ openViewObjective: false });
  }

  handleOpenObjectives() {
    this.setState({ openObjectives: true });
  }

  handleCloseObjectives() {
    this.setState({ openObjectives: false });
  }

  handleOpenAudiences() {
    this.setState({ openAudiences: true });
  }

  handleCloseAudiences() {
    this.setState({ openAudiences: false });
  }

  handleOpenInjectAudiences(audiences, event) {
    event.stopPropagation();
    this.setState({
      currentInjectAudiences: audiences,
      openInjectAudiences: true,
    });
  }

  handleCloseInjectAudiences() {
    this.setState({ openInjectAudiences: false });
  }

  downloadAttachment(fileId, fileName) {
    return this.props.downloadFile(fileId, fileName);
  }

  render() {
    const { classes } = this.props;
    const viewEventActions = [
      <Button
        key="closeEvent"
        label="Close"
        primary={true}
        onClick={this.handleCloseViewEvent.bind(this)}
      />,
    ];
    const viewIncidentActions = [
      <Button
        key="closeIncident"
        label="Close"
        primary={true}
        onClick={this.handleCloseViewIncident.bind(this)}
      />,
    ];
    const viewInjectActions = [
      <Button
        key="closeInject"
        label="Close"
        primary={true}
        onClick={this.handleCloseViewInject.bind(this)}
      />,
    ];
    const viewAudienceActions = [
      <Button
        key="CloseAudience"
        label="Close"
        primary={true}
        onClick={this.handleCloseViewAudience.bind(this)}
      />,
    ];
    const viewObjectiveActions = [
      <Button
        key="closeObjective"
        label="Close"
        primary={true}
        onClick={this.handleCloseViewObjective.bind(this)}
      />,
    ];
    const audiencesActions = [
      <Button
        key="closeAudiences"
        label="Close"
        primary={true}
        onClick={this.handleCloseAudiences.bind(this)}
      />,
    ];
    const objectivesActions = [
      <Button
        key="closeObjectives"
        label="Close"
        primary={true}
        onClick={this.handleCloseObjectives.bind(this)}
      />,
    ];
    const injectAudiencesActions = [
      <Button
        key="closeAudiences"
        label="Close"
        primary={true}
        onClick={this.handleCloseInjectAudiences.bind(this)}
      />,
    ];

    return (
      <div>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Typography variant="h5" style={{ float: 'left' }}>
              <T>Main objectives</T>
            </Typography>
            <div className="clearfix" />
            {this.props.objectives.length === 0 && (
              <div className={classes.empty}>
                <T>You do not have any objectives in this exercise.</T>
              </div>
            )}
            <List>
              {R.take(3, this.props.objectives).map((objective) => (
                <MainListItem
                  key={objective.objective_id}
                  onClick={this.handleOpenViewObjective.bind(this, objective)}
                  primaryText={objective.objective_title}
                  secondaryText={objective.objective_description}
                  leftIcon={
                    <Icon
                      name={Constants.ICON_NAME_IMAGE_CENTER_FOCUS_STRONG}
                    />
                  }
                />
              ))}
            </List>
            {this.props.objectives.length > 3 ? (
              <div
                onClick={this.handleOpenObjectives.bind(this)}
                style={styles.expand}
              >
                <Icon name={Constants.ICON_NAME_HARDWARE_KEYBOARD_ARROW_DOWN} />
              </div>
            ) : (
              ''
            )}
            <Dialog
              title="Main objectives"
              modal={false}
              open={this.state.openObjectives}
              autoScrollBodyContent={true}
              onClose={this.handleCloseObjectives.bind(this)}
              actions={objectivesActions}
            >
              <List>
                {this.props.objectives.map((objective) => (
                  <MainSmallListItem
                    key={objective.objective_id}
                    onClick={this.handleOpenViewObjective.bind(this, objective)}
                    primaryText={objective.objective_title}
                    secondaryText={objective.objective_description}
                    leftIcon={
                      <Icon
                        name={Constants.ICON_NAME_IMAGE_CENTER_FOCUS_STRONG}
                      />
                    }
                  />
                ))}
              </List>
            </Dialog>
            <Dialog
              title={R.propOr(
                '-',
                'objective_title',
                this.state.currentObjective,
              )}
              modal={false}
              open={this.state.openViewObjective}
              autoScrollBodyContent={true}
              onClose={this.handleCloseViewObjective.bind(this)}
              actions={viewObjectiveActions}
            >
              <ObjectiveView objective={this.state.currentObjective} />
            </Dialog>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h5" style={{ float: 'left' }}>
              Audiences
            </Typography>
            <AudiencesPopover exerciseId={this.props.exerciseId} />
            <div className="clearfix" />
            {this.props.audiences.length === 0 ? (
              <div className={classes.empty}>
                <T>You do not have any audiences in this exercise.</T>
              </div>
            ) : (
              ''
            )}
            <List>
              {R.take(3, this.props.audiences).map((audience) => {
                const playersText = `${
                  audience.audience_users_number
                } ${this.props.intl.formatMessage({ id: 'players' })}`;
                return (
                  <MainListItem
                    rightIconButton={
                      <AudiencePopover
                        exerciseId={this.props.exerciseId}
                        audience={audience}
                      />
                    }
                    key={audience.audience_id}
                    onClick={this.handleOpenViewAudience.bind(this, audience)}
                    primaryText={
                      <div
                        style={{
                          color: this.switchColor(!audience.audience_enabled),
                        }}
                      >
                        {audience.audience_name}
                      </div>
                    }
                    secondaryText={
                      <div
                        style={{
                          color: this.switchColor(!audience.audience_enabled),
                        }}
                      >
                        {playersText}
                      </div>
                    }
                    leftIcon={
                      <Icon
                        name={Constants.ICON_NAME_SOCIAL_GROUP}
                        color={this.switchColor(!audience.audience_enabled)}
                      />
                    }
                  />
                );
              })}
            </List>
            {this.props.audiences.length > 3 ? (
              <div
                onClick={this.handleOpenAudiences.bind(this)}
                style={styles.expand}
              >
                <Icon name={Constants.ICON_NAME_HARDWARE_KEYBOARD_ARROW_DOWN} />
              </div>
            ) : (
              ''
            )}
            <Dialog
              title="Audiences"
              modal={false}
              open={this.state.openAudiences}
              autoScrollBodyContent={true}
              onClose={this.handleCloseAudiences.bind(this)}
              actions={audiencesActions}
            >
              <List>
                {this.props.audiences.map((audience) => {
                  const playersText = `${
                    audience.audience_users_number
                  } ${this.props.intl.formatMessage({ id: 'players' })}`;
                  return (
                    <MainSmallListItem
                      rightIconButton={
                        <AudiencePopover
                          exerciseId={this.props.exerciseId}
                          audience={audience}
                        />
                      }
                      key={audience.audience_id}
                      onClick={this.handleOpenViewAudience.bind(this, audience)}
                      primaryText={
                        <div
                          style={{
                            color: this.switchColor(!audience.audience_enabled),
                          }}
                        >
                          {audience.audience_name}
                        </div>
                      }
                      secondaryText={
                        <div
                          style={{
                            color: this.switchColor(!audience.audience_enabled),
                          }}
                        >
                          {playersText}
                        </div>
                      }
                      leftIcon={
                        <Icon
                          name={Constants.ICON_NAME_SOCIAL_GROUP}
                          color={this.switchColor(!audience.audience_enabled)}
                        />
                      }
                    />
                  );
                })}
              </List>
            </Dialog>
            <Dialog
              title={R.propOr('-', 'audience_name', this.state.currentAudience)}
              modal={false}
              open={this.state.openViewAudience}
              autoScrollBodyContent={true}
              onClose={this.handleCloseViewAudience.bind(this)}
              actions={viewAudienceActions}
            >
              <AudienceView
                audience={this.state.currentAudience}
                subaudiences={this.props.subaudiences}
              />
            </Dialog>
          </Grid>
        </Grid>
        <br />
        <Typography variant="h5" style={{ float: 'left' }}>
          <T>Scenario</T>
        </Typography>
        <ScenarioPopover
          exerciseId={this.props.exerciseId}
          injects={this.props.injects}
          exercise={this.props.exercise}
          exerciseStartDate={this.props.exerciseStartDate}
          exerciseEndDate={this.props.exerciseEndDate}
          userCanUpdate={this.props.userCanUpdate}
        />
        <div className="clearfix" />
        {this.props.events.length === 0 ? (
          <div className={classes.empty}>
            <T>You do not have any events in this exercise.</T>
          </div>
        ) : (
          ''
        )}
        <List>
          {this.props.events.map((event) => {
            const incidents = R.pipe(
              R.map((data) => R.pathOr(
                { incident_title: '' },
                ['incidents', data.incident_id],
                this.props,
              )),
              R.sort((a, b) => a.incident_order > b.incident_order),
            )(event.event_incidents);

            const nestedItems = incidents.map((incident) => {
              const incidentId = R.propOr(
                Math.random(),
                'incident_id',
                incident,
              );
              const incidentTitle = R.propOr('-', 'incident_title', incident);
              const incidentStory = R.propOr('-', 'incident_story', incident);
              const incidentInjects = R.propOr(
                [],
                'incident_injects',
                incident,
              );

              const injects = R.pipe(
                R.map((data) => R.pathOr({}, ['injects', data.inject_id], this.props)),
                R.sort((a, b) => timeDiff(a.inject_date, b.inject_date)),
              )(incidentInjects);

              const nestedItems2 = injects.map((inject) => {
                const injectId = R.propOr(Math.random(), 'inject_id', inject);
                const injectTitle = R.propOr('-', 'inject_title', inject);
                const injectType = R.propOr('-', 'inject_type', inject);
                const injectDate = R.propOr(undefined, 'inject_date', inject);

                return (
                  <TertiaryListItem
                    key={injectId}
                    onClick={this.handleOpenViewInject.bind(this, inject)}
                    leftIcon={this.selectIcon(injectType)}
                    primaryText={injectTitle}
                    secondaryText={dateFormat(injectDate)}
                  />
                );
              });
              return (
                <SecondaryListItem
                  initiallyOpen={false}
                  key={incidentId}
                  onClick={this.handleOpenViewIncident.bind(this, incident)}
                  leftIcon={<Icon name={Constants.ICON_NAME_MAPS_LAYERS} />}
                  primaryText={incidentTitle}
                  secondaryText={incidentStory}
                  nestedItems={nestedItems2}
                />
              );
            });

            return (
              <MainListItem
                initiallyOpen={false}
                key={event.event_id}
                onClick={this.handleOpenViewEvent.bind(this, event)}
                leftIcon={<Icon name={Constants.ICON_NAME_ACTION_EVENT} />}
                primaryText={event.event_title}
                secondaryText={event.event_description}
                nestedItems={nestedItems}
              />
            );
          })}
        </List>
        <Dialog
          title={R.propOr('-', 'event_title', this.state.currentEvent)}
          modal={false}
          open={this.state.openViewEvent}
          autoScrollBodyContent={true}
          onClose={this.handleCloseViewEvent.bind(this)}
          actions={viewEventActions}
        >
          <EventView event={this.state.currentEvent} />
        </Dialog>
        <Dialog
          title={R.propOr('-', 'incident_title', this.state.currentIncident)}
          modal={false}
          open={this.state.openViewIncident}
          autoScrollBodyContent={true}
          onClose={this.handleCloseViewIncident.bind(this)}
          actions={viewIncidentActions}
        >
          <IncidentView
            incident={this.state.currentIncident}
            incident_types={this.props.incident_types}
          />
        </Dialog>
        <Dialog
          title={R.propOr('-', 'inject_title', this.state.currentInject)}
          modal={false}
          open={this.state.openViewInject}
          autoScrollBodyContent={true}
          onClose={this.handleCloseViewInject.bind(this)}
          actions={viewInjectActions}
        >
          <InjectView
            downloadAttachment={this.downloadAttachment.bind(this)}
            inject={this.state.currentInject}
            audiences={this.props.audiences}
            subaudiences={R.values(this.props.subaudiences)}
          />
        </Dialog>
        <Dialog
          title="Audiences of the inject"
          modal={false}
          open={this.state.openInjectAudiences}
          autoScrollBodyContent={true}
          onClose={this.handleCloseInjectAudiences.bind(this)}
          actions={injectAudiencesActions}
        >
          <List>
            {this.state.currentInjectAudiences.map((data) => {
              const audience = R.find(
                (a) => a.audience_id === data.audience_id,
              )(this.props.audiences);
              const audienceId = R.propOr(
                data.audience_id,
                'audience_id',
                audience,
              );
              const audienceName = R.propOr('-', 'audience_name', audience);
              const audienceUsers = R.propOr([], 'audience_users', audience);
              const playersText = `${
                audienceUsers.length
              } ${this.props.intl.formatMessage({ id: 'players' })}`;
              return (
                <MainSmallListItem
                  key={audienceId}
                  onClick={this.handleOpenViewAudience.bind(this, audience)}
                  primaryText={
                    <div
                      style={{
                        color: this.switchColor(!audience.audience_enabled),
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {audienceName}
                    </div>
                  }
                  secondaryText={
                    <div
                      style={{
                        color: this.switchColor(!audience.audience_enabled),
                      }}
                    >
                      {playersText}
                    </div>
                  }
                  leftIcon={
                    <Icon
                      name={Constants.ICON_NAME_SOCIAL_GROUP}
                      color={this.switchColor(!audience.audience_enabled)}
                    />
                  }
                />
              );
            })}
          </List>
        </Dialog>
      </div>
    );
  }
}

IndexExercise.propTypes = {
  exerciseId: PropTypes.string,
  objectives: PropTypes.array,
  subobjectives: PropTypes.object,
  audiences: PropTypes.array,
  subaudiences: PropTypes.object,
  events: PropTypes.array,
  incidents: PropTypes.object,
  incident_types: PropTypes.object,
  injects: PropTypes.object,
  exercise: PropTypes.object,
  fetchGroups: PropTypes.func,
  fetchObjectives: PropTypes.func,
  fetchSubobjectives: PropTypes.func,
  fetchAudiences: PropTypes.func,
  fetchSubaudiences: PropTypes.func,
  fetchEvents: PropTypes.func,
  fetchIncidents: PropTypes.func,
  fetchAllInjects: PropTypes.func,
  fetchExercise: PropTypes.func,
  fetchIncidentTypes: PropTypes.func,
  intl: PropTypes.object,
  downloadFile: PropTypes.func,
};

const filterObjectives = (objectives, exerciseId) => {
  const objectivesFilterAndSorting = R.pipe(
    R.values,
    R.filter((n) => n.objective_exercise.exercise_id === exerciseId),
    R.sort((a, b) => a.objective_priority > b.objective_priority),
  );
  return objectivesFilterAndSorting(objectives);
};

const filterAudiences = (audiences, exerciseId) => {
  const audiencesFilterAndSorting = R.pipe(
    R.values,
    R.filter((n) => n.audience_exercise.exercise_id === exerciseId),
    R.sort((a, b) => a.audience_name.localeCompare(b.audience_name)),
  );
  return audiencesFilterAndSorting(audiences);
};

const filterEvents = (events, exerciseId) => {
  const eventsFilterAndSorting = R.pipe(
    R.values,
    R.filter((n) => n.event_exercise.exercise_id === exerciseId),
    R.sort((a, b) => a.event_order > b.event_order),
  );
  return eventsFilterAndSorting(events);
};

const getExerciseStartDate = (exercises) => {
  const exercise = R.pipe(R.values)(exercises);
  if (exercise.length > 0) {
    return exercise[0].exercise_start_date;
  }
  return null;
};

const getExerciseEndDate = (exercises) => {
  const exercise = R.pipe(R.values)(exercises);
  if (exercise.length > 0) {
    return exercise[0].exercise_end_date;
  }
  return null;
};

const select = (state, ownProps) => {
  const { id: exerciseId } = ownProps;
  const objectives = filterObjectives(
    state.referential.entities.objectives,
    exerciseId,
  );
  const audiences = filterAudiences(
    state.referential.entities.audiences,
    exerciseId,
  );
  const events = filterEvents(state.referential.entities.events, exerciseId);
  const exerciseStartDate = getExerciseStartDate(
    state.referential.entities.exercises,
  );
  const exerciseEndDate = getExerciseEndDate(
    state.referential.entities.exercises,
  );
  const userId = R.path(['logged', 'user'], state.app);
  let userCanUpdate = R.path(
    [userId, 'user_admin'],
    state.referential.entities.users,
  );
  if (!userCanUpdate) {
    const groupValues = R.values(state.referential.entities.groups);
    groupValues.forEach((group) => {
      group.group_grants.forEach((grant) => {
        if (
          grant
          && grant.grant_exercise
          && grant.grant_exercise.exercise_id === exerciseId
          && grant.grant_name === 'PLANNER'
        ) {
          group.group_users.forEach((user) => {
            if (user && user.user_id === userId) {
              userCanUpdate = true;
            }
          });
        }
      });
    });
  }

  return {
    exerciseId,
    userCanUpdate,
    objectives,
    subobjectives: state.referential.entities.subobjectives,
    audiences,
    subaudiences: state.referential.entities.subaudiences,
    events,
    incidents: state.referential.entities.incidents,
    incident_types: state.referential.entities.incident_types,
    injects: state.referential.entities.injects,
    exercise: state.referential.entities.exercises,
    exerciseStartDate,
    exerciseEndDate,
  };
};

export default R.compose(
  connect(select, {
    fetchObjectives,
    fetchSubobjectives,
    fetchAudiences,
    fetchSubaudiences,
    fetchEvents,
    fetchIncidents,
    fetchIncidentTypes,
    fetchAllInjects,
    fetchExercise,
    fetchGroups,
    downloadFile,
  }),
  withStyles(styles),
)(injectIntl(IndexExercise));
