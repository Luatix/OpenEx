import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as R from 'ramda';
import { Observable } from 'rxjs';
import { FIVE_SECONDS, timeDiff, dateFormat } from '../../../../utils/Time';
import { i18nRegister } from '../../../../utils/Messages';
import { T } from '../../../../components/I18n';
import * as Constants from '../../../../constants/ComponentTypes';
import { List } from '../../../../components/List';
import Theme from '../../../../components/Theme';
import { Dialog } from '../../../../components/Dialog';
import { FlatButton } from '../../../../components/Button';
import { MainListItem } from '../../../../components/list/ListItem';
import { Icon } from '../../../../components/Icon';
import { LinearProgress } from '../../../../components/LinearProgress';
import { CircularSpinner } from '../../../../components/Spinner';
import Countdown from '../../../../components/Countdown';
/* eslint-disable */
import { fetchAudiences } from "../../../../actions/Audience";
import { fetchDryrun } from "../../../../actions/Dryrun";
import { fetchDryinjects } from "../../../../actions/Dryinject";
import { downloadFile } from "../../../../actions/File";
import DryrunPopover from "./DryrunPopover";
/* eslint-enable */
import DryinjectView from './DryinjectView';
import DryinjectStatusView from './DryinjectStatusView';

i18nRegister({
  fr: {
    Dryrun: 'Simulation',
    'You do not have any pending injects in this dryrun.':
      "Vous n'avez aucune injection en attente dans cette simulation.",
    'You do not have any processed injects in this dryrun.':
      "Vous n'avez aucune injection traitée dans cette simulation.",
    'Pending injects': 'Injections en attente',
    'Processed injects': 'Injections traitées',
    'Inject view': "Vue de l'injection",
    Status: 'Statut',
  },
});

const styles = {
  container: {
    textAlign: 'center',
  },
  columnLeft: {
    float: 'left',
    width: '49%',
    margin: 0,
    padding: 0,
    textAlign: 'left',
  },
  columnRight: {
    float: 'right',
    width: '49%',
    margin: 0,
    padding: 0,
    textAlign: 'left',
  },
  title: {
    float: 'left',
    fontSize: '13px',
    textTransform: 'uppercase',
  },
  audience: {
    float: 'right',
    fontSize: '15px',
    fontWeight: '600',
  },
  subtitle: {
    float: 'left',
    fontSize: '12px',
    color: '#848484',
  },
  state: {
    float: 'right',
  },
  empty: {
    marginTop: 40,
    fontSize: '18px',
    fontWeight: 500,
    textAlign: 'left',
  },
  dryinject_title: {
    float: 'left',
    padding: '5px 0 0 0',
  },
  dryinject_date: {
    float: 'right',
    padding: '5px 30px 0 0',
  },
};

class IndexExerciseDryrun extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openView: false,
      currentDryinject: {},
      openStatus: false,
      currentStatus: {},
    };
  }

  componentDidMount() {
    this.props.fetchAudiences(this.props.exerciseId);
    // Scheduler listener
    const initialStream = Observable.of(1); // Fetch on loading
    const intervalStream = Observable.interval(FIVE_SECONDS); // Fetch every five seconds
    const cancelStream = Observable.create((obs) => {
      this.cancelStreamEvent = () => {
        obs.next(1);
      };
    });
    this.subscription = initialStream
      .merge(intervalStream)
      .takeUntil(cancelStream)
      .exhaustMap(() => Promise.all([
        this.props.fetchDryrun(
          this.props.exerciseId,
          this.props.dryrunId,
          true,
        ),
        this.props.fetchDryinjects(
          this.props.exerciseId,
          this.props.dryrunId,
          true,
        ),
      ]))
      .subscribe();
  }

  componentWillReceiveProps(nextProps) {
    const dryrunFinished = R.propOr(false, 'dryrun_finished', nextProps.dryrun);
    if (dryrunFinished) this.cancelStreamEvent();
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  // eslint-disable-next-line class-methods-use-this
  selectIcon(type, color) {
    switch (type) {
      case 'openex_email':
        return (
          <Icon
            name={Constants.ICON_NAME_CONTENT_MAIL}
            type={Constants.ICON_TYPE_MAINLIST}
            color={color}
          />
        );
      case 'openex_ovh_sms':
        return (
          <Icon
            name={Constants.ICON_NAME_NOTIFICATION_SMS}
            type={Constants.ICON_TYPE_MAINLIST}
            color={color}
          />
        );
      case 'manual':
        return (
          <Icon
            name={Constants.ICON_NAME_ACTION_INPUT}
            type={Constants.ICON_TYPE_MAINLIST}
            color={color}
          />
        );
      default:
        return (
          <Icon
            name={Constants.ICON_NAME_CONTENT_MAIL}
            type={Constants.ICON_TYPE_MAINLIST}
            color={color}
          />
        );
    }
  }

  handleOpenView(dryinject) {
    this.setState({ currentDryinject: dryinject, openView: true });
  }

  handleCloseView() {
    this.setState({ openView: false });
  }

  handleOpenStatus(dryinject) {
    this.setState({ currentStatus: dryinject, openStatus: true });
  }

  handleCloseStatus() {
    this.setState({ openStatus: false });
  }

  downloadAttachment(fileId, fileName) {
    return this.props.downloadFile(fileId, fileName);
  }

  render() {
    const viewActions = [
      <FlatButton
        key="close"
        label="Close"
        primary={true}
        onClick={this.handleCloseView.bind(this)}
      />,
    ];
    const statusActions = [
      <FlatButton
        key="close"
        label="Close"
        primary={true}
        onClick={this.handleCloseStatus.bind(this)}
      />,
    ];

    const dryrunId = R.propOr('', 'dryrun_id', this.props.dryrun);
    const dryrunDate = R.propOr('', 'dryrun_date', this.props.dryrun);
    const dryrunFinished = R.propOr(
      false,
      'dryrun_finished',
      this.props.dryrun,
    );
    const nextDryinject = R.propOr(
      undefined,
      'dryinject_date',
      R.head(this.props.dryinjectsPending),
    );
    const countdown = nextDryinject ? (
      <Countdown targetDate={nextDryinject} />
    ) : (
      ''
    );

    return (
      <div style={styles.container}>
        <div style={styles.title}>
          <T>Dryrun</T>
        </div>
        <DryrunPopover
          exerciseId={this.props.exerciseId}
          dryrun={this.props.dryrun}
          listenDeletionCall={this.cancelStreamEvent}
        />
        <div style={styles.audience}>{dryrunId}</div>
        <div className="clearfix"></div>
        <div style={styles.subtitle}>{dateFormat(dryrunDate)}</div>
        <div style={styles.state}>
          {dryrunFinished ? (
            <Icon
              name={Constants.ICON_NAME_ACTION_DONE_ALL}
              color={Theme.palette.primary1Color}
            />
          ) : (
            <CircularSpinner size={20} color={Theme.palette.primary1Color} />
          )}
        </div>
        <div className="clearfix" />
        <br />
        <LinearProgress
          mode={
            this.props.dryinjectsProcessed.length === 0
              ? 'indeterminate'
              : 'determinate'
          }
          min={0}
          max={
            this.props.dryinjectsPending.length
            + this.props.dryinjectsProcessed.length
          }
          value={this.props.dryinjectsProcessed.length}
        />
        <br />
        <div style={styles.columnLeft}>
          <div style={styles.title}>
            <T>Pending injects</T> {countdown}
          </div>
          <div className="clearfix" />
          <List>
            {this.props.dryinjectsPending.length === 0 ? (
              <div style={styles.empty}>
                <T>You do not have any pending injects in this dryrun.</T>
              </div>
            ) : (
              ''
            )}
            {R.take(30, this.props.dryinjectsPending).map((dryinject) => {
              const injectInProgress = R.path(['inject_status', 'status_name'], dryinject)
                === 'PENDING';
              const injectIcon = injectInProgress ? (
                <CircularSpinner
                  size={20}
                  type={Constants.SPINNER_TYPE_INJECT}
                  color={Theme.palette.primary1Color}
                />
              ) : (
                this.selectIcon(dryinject.dryinject_type)
              );
              return (
                <MainListItem
                  key={dryinject.dryinject_id}
                  onClick={this.handleOpenView.bind(this, dryinject)}
                  primaryText={
                    <div>
                      <div style={styles.dryinject_title}>
                        {dryinject.dryinject_title}
                      </div>
                      <div style={styles.dryinject_date}>
                        {dateFormat(dryinject.dryinject_date)}
                      </div>
                      <div className="clearfix" />
                    </div>
                  }
                  leftIcon={injectIcon}
                />
              );
            })}
          </List>
          <Dialog
            title={R.propOr(
              '-',
              'dryinject_title',
              this.state.currentDryinject,
            )}
            modal={false}
            open={this.state.openView}
            autoScrollBodyContent={true}
            onRequestClose={this.handleCloseView.bind(this)}
            actions={viewActions}
          >
            <DryinjectView
              downloadAttachment={this.downloadAttachment.bind(this)}
              dryinject={this.state.currentDryinject}
            />
          </Dialog>
        </div>
        <div style={styles.columnRight}>
          <div style={styles.title}>
            <T>Processed injects</T>
          </div>
          <div className="clearfix"></div>
          <List>
            {this.props.dryinjectsProcessed.length === 0 ? (
              <div style={styles.empty}>
                <T>You do not have any processed injects in this dryrun.</T>
              </div>
            ) : (
              ''
            )}
            {R.take(30, this.props.dryinjectsProcessed).map((dryinject) => {
              let color = '#4CAF50';
              if (dryinject.dryinject_status.status_name === 'ERROR') {
                color = '#F44336';
              } else if (dryinject.dryinject_status.status_name === 'PARTIAL') {
                color = '#FF5722';
              }
              return (
                <MainListItem
                  key={dryinject.dryinject_id}
                  onClick={this.handleOpenStatus.bind(this, dryinject)}
                  primaryText={
                    <div>
                      <div style={styles.dryinject_title}>
                        {dryinject.dryinject_title}
                      </div>
                      <div style={styles.dryinject_date}>
                        {dateFormat(dryinject.dryinject_date)}
                      </div>
                      <div className="clearfix"></div>
                    </div>
                  }
                  leftIcon={this.selectIcon(dryinject.dryinject_type, color)}
                />
              );
            })}
          </List>
          <Dialog
            title="Status"
            modal={false}
            open={this.state.openStatus}
            autoScrollBodyContent={true}
            onRequestClose={this.handleCloseStatus.bind(this)}
            actions={statusActions}
          >
            <DryinjectStatusView dryinject={this.state.currentStatus} />
          </Dialog>
        </div>
      </div>
    );
  }
}

IndexExerciseDryrun.propTypes = {
  exerciseId: PropTypes.string,
  dryrunId: PropTypes.string,
  audiences: PropTypes.array,
  dryrun: PropTypes.object,
  dryinjectsPending: PropTypes.array,
  dryinjectsProcessed: PropTypes.array,
  fetchAudiences: PropTypes.func,
  fetchDryinjects: PropTypes.func,
  fetchDryrun: PropTypes.func,
  downloadFile: PropTypes.func,
};

const filterAudiences = (audiences, exerciseId) => {
  const audiencesFilterAndSorting = R.pipe(
    R.values,
    R.filter((n) => n.audience_exercise.exercise_id === exerciseId),
    R.sort((a, b) => a.audience_name.localeCompare(b.audience_name)),
  );
  return audiencesFilterAndSorting(audiences);
};

const filterDryinjectsPending = (dryinjects, dryrunId) => {
  const dryinjectsFilterAndSorting = R.pipe(
    R.values,
    R.filter((n) => {
      const statusName = n.dryinject_status.status_name;
      const identifiedInject = n.dryinject_dryrun.dryrun_id === dryrunId;
      const isPendingInject = statusName === null || statusName === 'PENDING';
      return identifiedInject && isPendingInject;
    }),
    R.sort((a, b) => timeDiff(a.dryinject_date, b.dryinject_date)),
  );
  return dryinjectsFilterAndSorting(dryinjects);
};

const filterDryinjectsProcessed = (dryinjects, dryrunId) => {
  const dryinjectsFilterAndSorting = R.pipe(
    R.values,
    R.filter(
      (n) => n.dryinject_dryrun.dryrun_id === dryrunId
        && (n.dryinject_status.status_name === 'SUCCESS'
          || n.dryinject_status.status_name === 'PARTIAL'
          || n.dryinject_status.status_name === 'ERROR'),
    ),
    R.sort((a, b) => timeDiff(b.dryinject_date, a.dryinject_date)),
  );
  return dryinjectsFilterAndSorting(dryinjects);
};

const select = (state, ownProps) => {
  const { exerciseId } = ownProps.params;
  const { dryrunId } = ownProps.params;
  const dryrun = R.propOr({}, dryrunId, state.referential.entities.dryruns);
  const audiences = filterAudiences(
    state.referential.entities.audiences,
    exerciseId,
  );
  const dryinjectsPending = filterDryinjectsPending(
    state.referential.entities.dryinjects,
    dryrunId,
  );
  const dryinjectsProcessed = filterDryinjectsProcessed(
    state.referential.entities.dryinjects,
    dryrunId,
  );

  return {
    exerciseId,
    dryrunId,
    dryrun,
    audiences,
    dryinjectsPending,
    dryinjectsProcessed,
  };
};

export default connect(select, {
  fetchAudiences,
  fetchDryrun,
  fetchDryinjects,
  downloadFile,
})(IndexExerciseDryrun);
