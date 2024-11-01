import { Button, ListItemText, Menu, MenuItem, Typography } from '@mui/material';
import { makeStyles, useTheme } from '@mui/styles';
import { FunctionComponent, useState } from 'react';
import * as React from 'react';
import { Link } from 'react-router-dom';

import type { InjectExpectationResultsByAttackPatternStore, InjectExpectationResultsByTypeStore } from '../../../../actions/exercises/Exercise';
import type { Theme } from '../../../../components/Theme';
import type { AttackPattern, ExpectationResultsByType } from '../../../../utils/api-types';
import { hexToRGB } from '../../../../utils/Colors';
import AtomicTestingResult from '../../atomic_testings/atomic_testing/AtomicTestingResult';

const useStyles = makeStyles((theme: Theme) => ({
  button: {
    whiteSpace: 'nowrap',
    width: '100%',
    textTransform: 'capitalize',
    color: theme.palette.text?.primary,
    backgroundColor: theme.palette.background.accent,
    borderRadius: 4,
    padding: '6px 0px 6px 8px',
  },
  buttonDummy: {
    whiteSpace: 'nowrap',
    width: '100%',
    textTransform: 'capitalize',
    color: theme.palette.text?.primary,
    backgroundColor: hexToRGB(theme.palette.background.accent, 0.4),
    borderRadius: 4,
    padding: '6px 0px 6px 8px',
  },
  buttonText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: 4,
    width: '100%',
  },
}));

interface AttackPatternBoxProps {
  goToLink?: string;
  attackPattern: AttackPattern;
  injectResult: InjectExpectationResultsByAttackPatternStore | undefined;
  dummy?: boolean;
}

const AttackPatternBox: FunctionComponent<AttackPatternBoxProps> = ({
  goToLink,
  attackPattern,
  injectResult,
  dummy,
}) => {
  // Standard hooks
  const classes = useStyles();
  const theme = useTheme<Theme>();
  const [open, setOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const results: InjectExpectationResultsByTypeStore[] = injectResult?.inject_expectation_results ?? [];

  if (dummy) {
    const content = () => (
      <div className={classes.buttonText}>
        <Typography variant="caption" style={{ color: theme.palette.text?.disabled }}>
          {attackPattern.attack_pattern_name}
        </Typography>
        <AtomicTestingResult expectations={results[0]?.results ?? []} />
      </div>
    );
    return (
      <div
        key={attackPattern.attack_pattern_id}
        className={classes.buttonDummy}
      >
        {content()}
      </div>
    );
  }
  const handleOpen = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.stopPropagation();
    setOpen(true);
    setAnchorEl(event.currentTarget);
  };
  const lowestSelector = (aggregation: (('FAILED' | 'PENDING' | 'PARTIAL' | 'UNKNOWN' | 'SUCCESS' | undefined)[])): 'FAILED' | 'PENDING' | 'PARTIAL' | 'UNKNOWN' | 'SUCCESS' => {
    if (aggregation.includes('FAILED')) {
      return 'FAILED';
    }
    if (aggregation.includes('PARTIAL')) {
      return 'PARTIAL';
    }
    if (aggregation.includes('PENDING')) {
      return 'PENDING';
    }
    if (aggregation.includes('UNKNOWN')) {
      return 'UNKNOWN';
    }
    return 'SUCCESS';
  };
  const aggregatedPrevention = (results ?? []).map(result => result.results?.filter(r => r.type === 'PREVENTION').map(r => r.avgResult)).flat();
  const aggregatedDetection = (results ?? []).map(result => result.results?.filter(r => r.type === 'DETECTION').map(r => r.avgResult)).flat();
  const aggregatedHumanResponse = (results ?? []).map(result => result.results?.filter(r => r.type === 'HUMAN_RESPONSE').map(r => r.avgResult)).flat();
  const aggregatedResults: ExpectationResultsByType[] = [
    {
      type: 'PREVENTION',
      avgResult: lowestSelector(aggregatedPrevention),
      distribution: [],
    },
    {
      type: 'DETECTION',
      avgResult: lowestSelector(aggregatedDetection),
      distribution: [],
    },
    {
      type: 'HUMAN_RESPONSE',
      avgResult: lowestSelector(aggregatedHumanResponse),
      distribution: [],
    },
  ];
  return (
    <>
      <Button
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        className={classes.button}
        onClick={event => handleOpen(event)}
      >
        <div className={classes.buttonText}>
          <Typography variant="caption">
            {attackPattern.attack_pattern_name}
          </Typography>
          <AtomicTestingResult expectations={aggregatedResults} />
        </div>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => {
          setAnchorEl(null);
          setOpen(false);
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top', horizontal: 'left',
        }}
      >
        {results?.map((result, idx) => {
          const content = () => (
            <>
              <ListItemText primary={result.inject_title} />
              <AtomicTestingResult expectations={result.results ?? []} />
            </>
          );
          if (goToLink) {
            return (
              <MenuItem
                key={`inject-result-${idx}`}
                component={Link}
                to={goToLink ?? ''}
                style={{ display: 'flex', gap: 8 }}
              >
                {content()}
              </MenuItem>
            );
          }
          return (
            <MenuItem
              key={`inject-result-${idx}`}
              style={{ display: 'flex', gap: 8, pointerEvents: 'none' }}
            >
              {content()}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default AttackPatternBox;
