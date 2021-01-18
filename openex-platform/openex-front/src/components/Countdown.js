import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import countdown from 'countdown';
import { T } from './I18n';
import { dateFromNow, now, parse } from '../utils/Time';
import * as Constants from '../constants/ComponentTypes';
import { i18nRegister } from '../utils/Messages';

i18nRegister({
  fr: {
    ' ms| s| m| h| d| w| m| y| d| c| m': ' ms| s| m| h| j| s| m| a| d| s| m',
    now: 'maintenant',
    'in progress': 'en cours',
  },
});

const styles = {
  [Constants.COUNTDOWN_TITLE]: {
    float: 'left',
    margin: '0px 0px 0px 0px',
  },
};

class Countdown extends Component {
  translate(text) {
    return this.props.intl.formatMessage({ id: text });
  }

  constructor(props) {
    super(props);
    this.state = { startDate: now() };
    const options = this.translate(' ms| s| m| h| d| w| m| y| d| c| m');
    countdown.setLabels(options, options, ', ', ', ', this.translate('now'));
  }

  render() {
    if (now().isAfter(parse(this.props.targetDate))) {
      return (
        <span style={styles[this.props.type]}>
          (<T>in progress</T>)
        </span>
      );
    }
    return (
      <span style={styles[this.props.type]}>
        ({dateFromNow(this.props.targetDate)})
      </span>
    );
  }
}

Countdown.propTypes = {
  targetDate: PropTypes.string,
  intl: PropTypes.object,
  type: PropTypes.string,
};

export default injectIntl(Countdown);
