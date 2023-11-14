import React, { FunctionComponent, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { MoreVert } from '@mui/icons-material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Checkbox from '@mui/material/Checkbox';
import { makeStyles } from '@mui/styles';
import { PopoverProps } from '@mui/material/Popover';
import { useFormatter } from '../../../components/i18n';
import ExerciseForm from './ExerciseForm';
import { deleteExercise, updateExercise } from '../../../actions/Exercise';
import { isExerciseReadOnly } from '../../../utils/Exercise';
import Transition from '../../../components/common/Transition';
import { Exercise, ExerciseUpdateInput } from '../../../utils';
import { useAppDispatch } from '../../../utils/hooks';

const useStyles = makeStyles(() => ({
  button: {
    float: 'left',
    margin: '-10px 0 0 5px',
  },
}));

interface ExercisePopoverProps {
  exercise: Exercise
}

const ExercisePopover: FunctionComponent<ExercisePopoverProps> = ({
  exercise,
}) => {
  const classes = useStyles();
  const { t } = useFormatter();
  const history = useHistory();
  const dispatch = useAppDispatch();

  const [anchorEl, setAnchorEl] = useState<PopoverProps['anchorEl']>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [exportPlayers, setExportPlayers] = useState(false);
  const [exportVariables, setExportVariables] = useState(false);

  // Popover
  const handlePopoverOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => setAnchorEl(null);

  // Edition
  const handleOpenEdit = () => {
    setOpenEdit(true);
    handlePopoverClose();
  };

  const handleCloseEdit = () => setOpenEdit(false);

  const onSubmitEdit = (data: ExerciseUpdateInput) => {
    return dispatch(
      updateExercise(exercise.exercise_id, data),
    ).then(() => handleCloseEdit());
  };

  // Deletion
  const handleOpenDelete = () => {
    setOpenDelete(true);
    handlePopoverClose();
  };

  const handleCloseDelete = () => setOpenDelete(false);

  const submitDelete = () => {
    dispatch(
      deleteExercise(exercise.exercise_id),
    ).then(() => handleCloseDelete());
    history.push('/admin/exercises');
  };

  // Export
  const handleOpenExport = () => {
    setOpenExport(true);
    handlePopoverClose();
  };

  const handleCloseExport = () => setOpenExport(false);

  const submitExport = () => {
    const link = document.createElement('a');
    link.href = `/api/exercises/${exercise.exercise_id}/export?isWithPlayers=${exportPlayers}&isWithVariables=${exportVariables}`;
    link.click();
    handleCloseExport();
  };

  const handleToggleExportPlayers = () => setExportPlayers(!exportPlayers);
  const handleToggleExportVariables = () => setExportVariables(!exportVariables);

  // Form

  const initialValues: ExerciseUpdateInput = {
    exercise_name: exercise.exercise_name,
    exercise_subtitle: exercise.exercise_subtitle,
    exercise_description: exercise.exercise_description,
    exercise_mail_from: exercise.exercise_mail_from,
    exercise_message_header: exercise.exercise_message_header,
    exercise_message_footer: exercise.exercise_message_footer,
  };

  return (
    <div>
      <IconButton
        classes={{ root: classes.button }}
        onClick={handlePopoverOpen}
        aria-haspopup="true"
        size="large"
      >
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handlePopoverClose}
      >
        <MenuItem
          onClick={handleOpenEdit}
          disabled={isExerciseReadOnly(exercise, true)}
        >
          {t('Update')}
        </MenuItem>
        <MenuItem onClick={handleOpenExport}>
          {t('Export')}
        </MenuItem>
        <MenuItem
          onClick={handleOpenDelete}
          disabled={isExerciseReadOnly(exercise, true)}
        >
          {t('Delete')}
        </MenuItem>
      </Menu>
      <Dialog
        open={openDelete}
        TransitionComponent={Transition}
        onClose={handleCloseDelete}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to delete this exercise?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>
            {t('Cancel')}
          </Button>
          <Button color="secondary" onClick={submitDelete}>
            {t('Delete')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        TransitionComponent={Transition}
        open={openEdit}
        onClose={handleCloseEdit}
        fullWidth={true}
        maxWidth="md"
        PaperProps={{ elevation: 1 }}
      >
        <DialogTitle>{t('Update the exercise')}</DialogTitle>
        <DialogContent>
          <ExerciseForm
            initialValues={initialValues}
            editing={true}
            onSubmit={onSubmitEdit.bind(this)}
            handleClose={handleCloseEdit}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={openExport}
        TransitionComponent={Transition}
        onClose={handleCloseExport}
        PaperProps={{ elevation: 1 }}
      >
        <DialogTitle>{t('Export the exercise')}</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  {t('Elements')}
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  {t('Export')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  {t('Scenario (including attached files)')}
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <Checkbox checked={true} disabled={true} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  {t('Audiences')}
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <Checkbox checked={true} disabled={true} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  {t('Players')}
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <Checkbox
                    checked={exportPlayers}
                    onChange={handleToggleExportPlayers}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  {t('Variables')}
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <Checkbox
                    checked={exportVariables}
                    onChange={handleToggleExportVariables}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExport}>
            {t('Cancel')}
          </Button>
          <Button color="secondary" onClick={submitExport}>
            {t('Export')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ExercisePopover;
