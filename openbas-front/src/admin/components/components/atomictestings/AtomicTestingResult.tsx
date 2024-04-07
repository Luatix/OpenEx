import React from 'react';
import { HorizontalRule, SensorOccupied, Shield, TrackChanges } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import type { ExpectationResultsByType } from '../../../../utils/api-types';

const useStyles = makeStyles(() => ({
  inline: {
    display: 'flex',
    flexDirection: 'row',
    padding: 0,
  },
}));

interface Props {
  expectations: ExpectationResultsByType[] | undefined;
}

const AtomicTestingResult: React.FC<Props> = ({ expectations }) => {
  const classes = useStyles();

  const getColor = (result: string | undefined): string => {
    const colorMap: Record<string, string> = {
      VALIDATED: 'rgb(107, 235, 112)',
      FAILED: 'rgb(220, 81, 72)',
    };

    return colorMap[result ?? ''] ?? 'rgb(245, 166, 35)';
  };

  if (!expectations || expectations.length === 0) {
    return <HorizontalRule/>;
  }

  return (
    <div className={classes.inline}>
      {expectations.map((expectation, index) => {
        const color = getColor(expectation.avgResult);
        let IconComponent;
        switch (expectation.type) {
          case 'PREVENTION':
            IconComponent = Shield;
            break;
          case 'DETECTION':
            IconComponent = TrackChanges;
            break;
          default:
            IconComponent = SensorOccupied;
        }
        return (
          <span key={index}>
            <IconComponent style={{ color, marginRight: 10 }}/>
          </span>
        );
      })}
    </div>
  );
};

export default AtomicTestingResult;
