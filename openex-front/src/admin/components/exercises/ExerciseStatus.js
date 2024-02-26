import React, { Component } from 'react';
import * as R from 'ramda';
import * as PropTypes from 'prop-types';
import withStyles from '@mui/styles/withStyles';
import { Chip } from '@mui/material';
import inject18n from '../../../components/i18n';

const styles = () => ({
  chip: {
    fontSize: 20,
    fontWeight: 800,
    textTransform: 'uppercase',
    borderRadius: '0',
  },
  chipInList: {
    fontSize: 12,
    lineHeight: '12px',
    height: 20,
    float: 'left',
    textTransform: 'uppercase',
    borderRadius: '0',
    width: 120,
  },
});

export const inlineStyles = {
  white: {
    backgroundColor: 'rgb(231, 133, 109, 0.08)',
    color: '#8d4e41',
  },
  green: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    color: '#4caf50',
  },
  blue: {
    backgroundColor: 'rgba(92, 123, 245, 0.08)',
    color: '#5c7bf5',
  },
  red: {
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    color: '#f44336',
  },
  orange: {
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
    color: '#ff9800',
  },
  grey: {
    backgroundColor: 'rgba(96, 125, 139, 0.08)',
    color: '#607d8b',
  },
};

class ExerciseStatus extends Component {
  render() {
    const { t, status, classes, variant } = this.props;
    const style = variant === 'list' ? classes.chipInList : classes.chip;
    switch (status) {
      case 'SCHEDULED':
        return (
          <Chip
            classes={{ root: style }}
            style={inlineStyles.blue}
            label={t('Scheduled')}
          />
        );
      case 'RUNNING':
        return (
          <Chip
            classes={{ root: style }}
            style={inlineStyles.green}
            label={t('Running')}
          />
        );
      case 'PAUSED':
        return (
          <Chip
            classes={{ root: style }}
            style={inlineStyles.orange}
            label={t('Paused')}
          />
        );
      case 'CANCELED':
        return (
          <Chip
            classes={{ root: style }}
            style={inlineStyles.white}
            label={t('Canceled')}
          />
        );
      case 'FINISHED':
        return (
          <Chip
            classes={{ root: style }}
            style={inlineStyles.grey}
            label={t('Finished')}
          />
        );
      default:
        return (
          <Chip
            classes={{ root: style }}
            style={inlineStyles.blue}
            label={t('Scheduled')}
          />
        );
    }
  }
}

ExerciseStatus.propTypes = {
  classes: PropTypes.object.isRequired,
  variant: PropTypes.string,
  status: PropTypes.string,
};

export default R.compose(inject18n, withStyles(styles))(ExerciseStatus);
