import React, { FunctionComponent, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import { MoreVert } from '@mui/icons-material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import Transition from '../../../../../components/common/Transition';
import { isExerciseReadOnly } from '../../../../../utils/Exercise';
import { Exercise } from '../../../../../utils/api-types';
import { useFormatter } from '../../../../../components/i18n';
import ExpectationManualForm from './ExpectationManualForm';
import { ExpectationInput } from '../../../../../actions/Expectation';

interface ExpectationPopoverProps {
  index: number;
  exercise: Exercise;
  expectation: ExpectationInput;
  handleUpdate: (data: ExpectationInput, idx: number) => void;
  handleDelete: (idx: number) => void;
}

const ExpectationManualPopover: FunctionComponent<ExpectationPopoverProps> = ({
  index,
  exercise,
  expectation,
  handleUpdate,
  handleDelete,
}) => {
  const { t } = useFormatter();

  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  // Popover
  const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
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

  const onSubmitEdit = (data: ExpectationInput) => {
    handleUpdate(data, index);
    handleCloseEdit();
  };

  // Deletion
  const handleOpenDelete = () => {
    setOpenDelete(true);
    handlePopoverClose();
  };
  const handleCloseDelete = () => setOpenDelete(false);

  const onSubmitDelete = () => {
    handleDelete(index);
    handleCloseDelete();
  };

  return (
    <div>
      <IconButton
        onClick={(event) => handlePopoverOpen(event)}
        aria-haspopup="true"
        size="large"
        disabled={isExerciseReadOnly(exercise)}
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
        >
          {t('Update')}
        </MenuItem>
        <MenuItem
          onClick={handleOpenDelete}
        >
          {t('Remove')}
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
            {t('Do you want to delete this expectation ?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>
            {t('Cancel')}
          </Button>
          <Button color="secondary" onClick={onSubmitDelete}>
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
        <DialogTitle>{t('Update the expectation')}</DialogTitle>
        <DialogContent>
          <ExpectationManualForm
            initialValues={expectation}
            editing={true}
            onSubmit={onSubmitEdit}
            handleClose={handleCloseEdit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpectationManualPopover;
