import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '@mui/material/Button';
import { makeStyles } from '@mui/styles';
import { useFormatter } from '../../../components/i18n';

const useStyles = makeStyles((theme) => ({
  button: {
    marginRight: theme.spacing(2),
    padding: '0 5px 0 5px',
    minHeight: 20,
    minWidth: 20,
    textTransform: 'none',
  },
}));

const TopMenuChallenges = () => {
  const classes = useStyles();
  const { t } = useFormatter();
  const location = useLocation();
  return (
    <div>
      <Button
        component={Link}
        to="/admin"
        variant={
          location.pathname === '/admin/challenges' ? 'contained' : 'text'
        }
        size="small"
        color={
          location.pathname === '/admin/challenges' ? 'secondary' : 'primary'
        }
        classes={{ root: classes.button }}
      >
        {t('Challenges')}
      </Button>
    </div>
  );
};

export default TopMenuChallenges;
