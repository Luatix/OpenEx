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

const inlineStyles = {
  green: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    color: '#4caf50',
  },
  red: {
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    color: '#f44336',
  },
};

class AssetStatus extends Component {
  render() {
    const { t, status, classes, variant } = this.props;
    const style = variant === 'list' ? classes.chipInList : classes.chip;
    switch (status) {
      case 'Active':
        return (
          <Chip
            classes={{ root: style }}
            style={inlineStyles.green}
            label={t('Active')}
          />
        );
      case 'Inactive':
        return (
          <Chip
            classes={{ root: style }}
            style={inlineStyles.red}
            label={t('Inactive')}
          />
        );
      default:
        return (
          <Chip
            classes={{ root: style }}
            style={inlineStyles.green}
            label={t('Active')}
          />
        );
    }
  }
}

AssetStatus.propTypes = {
  classes: PropTypes.object.isRequired,
  variant: PropTypes.string,
  status: PropTypes.string,
};

export default R.compose(inject18n, withStyles(styles))(AssetStatus);
