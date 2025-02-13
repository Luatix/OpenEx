import { MoreVert } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Menu, MenuItem } from '@mui/material';
import { FunctionComponent, useState } from 'react';

import Transition from '../../../../components/common/Transition';
import { useFormatter } from '../../../../components/i18n';
import type { Variable, VariableInput } from '../../../../utils/api-types';
import VariableForm from './VariableForm';

interface Props {
  variable: Variable;
  disabled: boolean;
  onEdit: (variable: Variable, data: VariableInput) => void;
  onDelete: (variable: Variable) => void;
}

const VariablePopover: FunctionComponent<Props> = ({
  variable,
  disabled,
  onEdit,
  onDelete,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  const initialValues = (({
    variable_key,
    variable_description,
    variable_value,
  }) => ({ variable_key, variable_description, variable_value }))(variable);

  // Edition

  const [editVar, setEditVar] = useState(false);
  const submitEdit = (data: VariableInput) => {
    onEdit(variable, data);
    setEditVar(false);
  };

  // Deletion

  const [deleteVar, setDeleteVar] = useState(false);
  const submitDelete = () => {
    onDelete(variable);
    setDeleteVar(false);
  };
  return (
    <>
      <IconButton
        onClick={(ev) => {
          ev.stopPropagation();
          setAnchorEl(ev.currentTarget);
        }}
        aria-haspopup="true"
        size="large"
        color="primary"
        disabled={disabled}
      >
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setEditVar(true);
            setAnchorEl(null);
          }}
          disabled={disabled}
        >
          {t('Update')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteVar(true);
            setAnchorEl(null);
          }}
          disabled={disabled}
        >
          {t('Delete')}
        </MenuItem>
      </Menu>
      <Dialog
        open={deleteVar}
        TransitionComponent={Transition}
        onClose={() => setDeleteVar(false)}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to delete the variable ?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteVar(false)}>{t('Cancel')}</Button>
          <Button color="secondary" onClick={submitDelete}>
            {t('Delete')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        TransitionComponent={Transition}
        open={editVar}
        onClose={() => setEditVar(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ elevation: 1 }}
      >
        <DialogTitle>{t('Update the variable')}</DialogTitle>
        <DialogContent>
          <VariableForm
            initialValues={initialValues}
            editing
            onSubmit={submitEdit}
            handleClose={() => setEditVar(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VariablePopover;
