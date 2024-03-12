import React, { Component } from 'react';
import * as R from 'ramda';
import { FlagOutlined } from '@mui/icons-material';
import { Box } from '@mui/material';
import { withStyles } from '@mui/styles';
import Autocomplete from './Autocomplete';
import inject18n from './i18n';
import { countryOptions } from '../utils/Option';

const styles = () => ({
  icon: {
    paddingTop: 4,
    display: 'inline-block',
  },
  text: {
    display: 'inline-block',
    flexGrow: 1,
    marginLeft: 10,
  },
  autoCompleteIndicator: {
    display: 'none',
  },
});

class CountryField extends Component {
  render() {
    const { t, name, classes } = this.props;
    return (
      <div>
        <Autocomplete
          variant="standard"
          size="small"
          name={name}
          fullWidth={true}
          multiple={false}
          label={t('Country')}
          options={countryOptions()}
          style={{ marginTop: 20 }}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <div className={classes.icon}>
                <FlagOutlined />
              </div>
              <div className={classes.text}>{option.label}</div>
            </Box>
          )}
          classes={{ clearIndicator: classes.autoCompleteIndicator }}
        />
      </div>
    );
  }
}

export default R.compose(inject18n, withStyles(styles))(CountryField);
