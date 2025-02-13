import { Paper as PaperMui } from '@mui/material';
import { FunctionComponent, ReactElement } from 'react';
import { makeStyles } from 'tss-react/mui';

interface PaperProps {
  children: ReactElement;
}

const useStyles = makeStyles()(() => ({
  paper: {
    padding: 20,
    marginBottom: 30,
    borderRadius: 6,
  },
}));

const Paper: FunctionComponent<PaperProps> = ({ children }) => {
  const { classes } = useStyles();

  return (
    <PaperMui variant="outlined" className={classes.paper}>
      {children}
    </PaperMui>
  );
};

export default Paper;
