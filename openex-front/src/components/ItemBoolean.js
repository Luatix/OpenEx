import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import { withStyles } from '@mui/styles';
import Chip from '@mui/material/Chip';
import inject18n from './i18n';

const styles = () => ({
  chip: {
    fontSize: 12,
    lineHeight: '12px',
    height: 25,
    marginRight: 7,
    textTransform: 'uppercase',
    borderRadius: '0',
    width: 130,
  },
  chipInList: {
    fontSize: 12,
    lineHeight: '12px',
    height: 20,
    float: 'left',
    textTransform: 'uppercase',
    borderRadius: '0',
    width: 90,
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
  grey: {
    backgroundColor: 'rgba(176, 176, 176, 0.08)',
    color: '#b0b0b0',
  },
};

class ItemBoolean extends Component {
  render() {
    const {
      classes, label, status, variant, t, reverse, onClick, disabled,
    } = this.props;
    const style = variant === 'list' ? classes.chipInList : classes.chip;
    if (status === true) {
      return (
        <Chip
          classes={{ root: style }}
          style={reverse ? inlineStyles.red : inlineStyles.green}
          label={label}
          onClick={onClick ? onClick.bind(this) : null}
        />
      );
    }
    if (status === null) {
      return (
        <Chip
          classes={{ root: style }}
          style={inlineStyles.grey}
          label={t('N/A')}
          onClick={onClick ? onClick.bind(this) : null}
          disabled={disabled}
        />
      );
    }
    return (
      <Chip
        classes={{ root: style }}
        style={reverse ? inlineStyles.green : inlineStyles.red}
        label={label}
        onClick={onClick ? onClick.bind(this) : null}
      />
    );
  }
}

ItemBoolean.propTypes = {
  classes: PropTypes.object.isRequired,
  status: PropTypes.bool,
  label: PropTypes.string,
  variant: PropTypes.string,
  reverse: PropTypes.bool,
  onClick: PropTypes.func,
};

export default R.compose(inject18n, withStyles(styles))(ItemBoolean);
