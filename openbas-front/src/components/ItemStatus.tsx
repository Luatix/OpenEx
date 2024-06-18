import React, { FunctionComponent } from 'react';
import { Chip, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useFormatter } from './i18n';

// Deprecated - https://mui.com/system/styles/basics/
// Do not use it for new code.
const useStyles = makeStyles(() => ({
  chip: {
    fontSize: 12,
    height: 25,
    marginRight: 7,
    textTransform: 'uppercase',
    borderRadius: 4,
    width: 150,
  },
  chipInList: {
    fontSize: 12,
    height: 20,
    float: 'left',
    textTransform: 'uppercase',
    borderRadius: 4,
    width: 150,
  },
}));

const inlineStyles = {
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
  yellow: {
    backgroundColor: 'rgba(255, 235, 0, 0.08)',
    color: '#ffeb3b',
  },
  purple: {
    backgroundColor: 'rgba(103, 58, 183, 0.08)',
    color: '#673ab7',
  },
  lightPurple: {
    backgroundColor: 'rgba(156, 39, 176, 0.08)',
    color: '#9c27b0',
  },
  blueGrey: {
    backgroundColor: 'rgba(96, 125, 139, 0.08)',
    color: '#607d8b',
    fontStyle: 'italic',
  },
};

interface ItemStatusProps {
  label: string;
  status?: string | null;
  variant?: 'inList';
  isInject?: boolean,
}

const computeStatusStyle = (status: string | undefined | null) => {
  switch (status) {
    case 'ERROR':
      return inlineStyles.red;
    case 'MAYBE_PREVENTED':
      return inlineStyles.purple;
    case 'MAYBE_PARTIAL_PREVENTED':
      return inlineStyles.lightPurple;
    case 'PARTIAL':
      return inlineStyles.orange;
    case 'QUEUING':
      return inlineStyles.yellow;
    case 'EXECUTING':
      return inlineStyles.blue;
    case 'PENDING':
      return inlineStyles.blue;
    case 'SUCCESS':
      return inlineStyles.green;
    default:
      return inlineStyles.blueGrey;
  }
};

const ItemStatus: FunctionComponent<ItemStatusProps> = ({
  label,
  status,
  variant,
  isInject = false,
}) => {
  const { t } = useFormatter();
  const classes = useStyles();
  const style = variant === 'inList' ? classes.chipInList : classes.chip;
  const classStyle = computeStatusStyle(status);
  let finalLabel = label;
  if (isInject) {
    if (status === 'SUCCESS') {
      finalLabel = t('INJECT EXECUTED', 'STIMULI EXECUTE');
    }
  }
  return (
    <Tooltip title={finalLabel}>
      <Chip classes={{ root: style }} style={classStyle} label={finalLabel} />
    </Tooltip>
  );
};

export default ItemStatus;
