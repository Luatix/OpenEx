import React, { FunctionComponent, memo } from 'react';
import { makeStyles } from '@mui/styles';
import { AddCircleOutline } from '@mui/icons-material';
import type { Theme } from '../Theme';

const useStyles = makeStyles<Theme>(() => ({
  node: {
    border: '2px dashed rgba(255, 255, 255, 0.12)',
    borderLeft: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    width: 50,
    height: 50,
    padding: '8px 5px 5px 5px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    textAlign: 'center',
    backgroundColor: '#09101e',
    color: 'white',
    cursor: 'none !important',
    '&:hover': {
      backgroundColor: '#0d1626',
    },
  },
  iconContainer: {
    width: '100%',
  },
  icon: {
    textAlign: 'center',
  },
  time: {
    position: 'relative',
    left: 60,
    top: -34,
  },
}));

interface Props {
  time: string,
}

const NodePhantomComponent: FunctionComponent<Props> = (props) => {
  const classes = useStyles();

  return (
    <>
      <div style={{ width: '500px', height: '50px' }}>
        <div className={classes.node} style={{ color: 'white' }}>
          <div className={classes.iconContainer}>
            <AddCircleOutline className={classes.icon} style={{ fontSize: '30px' }}/>
          </div>
        </div>
        <span className={classes.time}>
          {props.time}
        </span>
      </div>
    </>
  );
};

export default memo(NodePhantomComponent);
