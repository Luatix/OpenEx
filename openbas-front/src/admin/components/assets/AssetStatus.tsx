import { Chip } from '@mui/material';
import { type FunctionComponent } from 'react';
import { makeStyles } from 'tss-react/mui';

import { useFormatter } from '../../../components/i18n';

const useStyles = makeStyles()(() => ({
  chip: {
    fontSize: 20,
    fontWeight: 800,
    textTransform: 'uppercase',
    borderRadius: 4,
  },
  chipInList: {
    fontSize: 12,
    lineHeight: '12px',
    height: 20,
    float: 'left',
    textTransform: 'uppercase',
    borderRadius: 4,
    width: 120,
  },
}));

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

interface Props {
  variant: string;
  status: string;
}

const AssetStatus: FunctionComponent<Props> = ({ variant, status }) => {
  const { t } = useFormatter();
  const { classes } = useStyles();
  const style = variant === 'list' ? classes.chipInList : classes.chip;

  switch (status) {
    case 'Active':
      return (
        <Chip
          className={style}
          style={inlineStyles.green}
          label={t('Active')}
        />
      );
    case 'Inactive':
      return (
        <Chip
          className={style}
          style={inlineStyles.red}
          label={t('Inactive')}
        />
      );
    default:
      return (
        <Chip
          className={style}
          style={inlineStyles.green}
          label={t('Active')}
        />
      );
  }
};

export default AssetStatus;
