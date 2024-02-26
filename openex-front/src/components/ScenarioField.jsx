import React from 'react';
import { Kayaking } from '@mui/icons-material';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Autocomplete from './Autocomplete';
import useDataLoader from '../utils/ServerSideEvent';
import { useHelper } from '../store';
import { fetchScenarios } from '../actions/scenarios/scenario-actions';
import { useAppDispatch } from '../utils/hooks';

const useStyles = makeStyles(() => ({
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
}));

const ScenarioField = (props) => {
  // Standard hooks
  const classes = useStyles();
  const dispatch = useAppDispatch();
  // Fetching data
  const scenarios = useHelper((helper) => helper.getScenarios());
  useDataLoader(() => {
    dispatch(fetchScenarios());
  });

  const { name, onKeyDown, style, label, placeholder, noMargin } = props;
  const scenarioOptions = (scenarios || []).map((n) => ({
    id: n.scenario_id,
    label: n.scenario_name,
  }));
  return (
    <Autocomplete
      variant="standard"
      size="small"
      name={name}
      noMargin={noMargin}
      fullWidth
      multiple
      label={label}
      placeholder={placeholder}
      options={scenarioOptions}
      style={style}
      onKeyDown={onKeyDown}
      renderOption={(renderProps, option) => (
        <Box component="li" {...renderProps}>
          <div className={classes.icon}>
            <Kayaking />
          </div>
          <div className={classes.text}>{option.label}</div>
        </Box>
      )}
      classes={{ clearIndicator: classes.autoCompleteIndicator }}
    />
  );
};

export default ScenarioField;
