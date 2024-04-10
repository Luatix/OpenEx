import { Chip } from '@mui/material';
import React, { CSSProperties, FunctionComponent } from 'react';
import { makeStyles } from '@mui/styles';
import { useFormatter } from '../i18n';

const useStyles = makeStyles(() => ({
  chipInList: {
    fontSize: 12,
    lineHeight: '12px',
    height: 20,
    float: 'left',
    textTransform: 'uppercase',
    borderRadius: '0',
    width: 120,
  },
}));

interface Props {
  label: string;
  style: CSSProperties;
}

const ChipInList: FunctionComponent<Props> = ({
  label,
  style,
}) => {
  // Standard hooks
  const classes = useStyles();
  const { t } = useFormatter();

  return (
    <Chip
      classes={{ root: classes.chipInList }}
      style={style}
      label={t(label)}
    />
  );
};

export default ChipInList;
