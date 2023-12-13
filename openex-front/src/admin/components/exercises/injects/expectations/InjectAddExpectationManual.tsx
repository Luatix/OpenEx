import React, { FunctionComponent, useState } from 'react';
import { ListItemButton, ListItemIcon } from '@mui/material';
import { ControlPointOutlined } from '@mui/icons-material';
import ListItemText from '@mui/material/ListItemText';
import { makeStyles } from '@mui/styles';
import { isExerciseReadOnly } from '../../../../../utils/Exercise';
import { Exercise } from '../../../../../utils/api-types';
import { Theme } from '../../../../../components/Theme';
import { useFormatter } from '../../../../../components/i18n';
import Dialog from '../../../../../components/common/Dialog';
import ExpectationManualForm from './ExpectationManualForm';
import { ExpectationInput } from '../../../../../actions/Expectation';

const useStyles = makeStyles((theme: Theme) => ({
  item: {
    paddingLeft: 10,
    height: 50,
  },
  text: {
    fontSize: theme.typography.h2.fontSize,
    color: theme.palette.primary.main,
    fontWeight: theme.typography.h2.fontWeight,
  },
}));

interface InjectAddExpectationProps {
  exercise: Exercise;
  handleAddExpectation: (data: ExpectationInput) => void;
}

const InjectAddExpectationManual: FunctionComponent<InjectAddExpectationProps> = ({
  exercise,
  handleAddExpectation,
}) => {
  const classes = useStyles();
  const { t } = useFormatter();

  // Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const handleOpen = () => setOpenDialog(true);
  const handleClose = () => setOpenDialog(false);

  // Form
  const onSubmit = (data: ExpectationInput) => {
    handleAddExpectation(data);
    handleClose();
  };

  return (
    <>
      <ListItemButton
        classes={{ root: classes.item }}
        divider={true}
        onClick={handleOpen}
        color="primary"
        disabled={isExerciseReadOnly(exercise)}
      >
        <ListItemIcon color="primary">
          <ControlPointOutlined color="primary" />
        </ListItemIcon>
        <ListItemText
          primary={t('Add manual expectations')}
          classes={{ primary: classes.text }}
        />
      </ListItemButton>
      <Dialog
        open={openDialog}
        handleClose={handleClose}
        title={t('Add manual expectation in this inject')}>
        <ExpectationManualForm onSubmit={onSubmit} handleClose={handleClose} />
      </Dialog>
    </>
  );
};

export default InjectAddExpectationManual;
