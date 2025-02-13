import { MoreVert } from '@mui/icons-material';
import { Button, Dialog as DialogMUI, DialogActions, DialogContent, DialogContentText, IconButton, Menu, MenuItem } from '@mui/material';
import { type FunctionComponent, type MouseEvent as ReactMouseEvent, useContext, useState } from 'react';

import { type LoggedHelper } from '../../../../../actions/helper';
import Dialog from '../../../../../components/common/Dialog';
import Transition from '../../../../../components/common/Transition';
import { useFormatter } from '../../../../../components/i18n';
import { useHelper } from '../../../../../store';
import { type InjectExpectation, type PlatformSettings } from '../../../../../utils/api-types';
import { PermissionsContext } from '../../Context';
import { type ExpectationInput, type ExpectationInputForm } from './Expectation';
import ExpectationFormUpdate from './ExpectationFormUpdate';
import useExpectationExpirationTime from './useExpectationExpirationTime';

interface ExpectationPopoverProps {
  index: number;
  expectation: ExpectationInput;
  handleUpdate: (data: ExpectationInput, idx: number) => void;
  handleDelete: (idx: number) => void;
}

const ExpectationPopover: FunctionComponent<ExpectationPopoverProps> = ({
  index,
  expectation,
  handleUpdate,
  handleDelete,
}) => {
  // Standard hooks
  const { settings }: { settings: PlatformSettings } = useHelper((helper: LoggedHelper) => ({
    settings: helper.getPlatformSettings(),
  }));
  const { t } = useFormatter();
  const { permissions } = useContext(PermissionsContext);

  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const getExpirationTime = (expirationTime: number): number => {
    if (expirationTime !== null || expirationTime !== undefined) {
      return expirationTime;
    }
    return useExpectationExpirationTime(expectation.expectation_type as InjectExpectation['inject_expectation_type']); // FIXME: should change type of expectation_type property
  };

  const initialValues = {
    expectation_type: expectation.expectation_type ?? '',
    expectation_name: expectation.expectation_name ?? '',
    expectation_description: expectation.expectation_description ?? '',
    expectation_score: expectation.expectation_score ?? settings.expectation_manual_default_score_value,
    expectation_expectation_group: expectation.expectation_expectation_group ?? false,
    expectation_expiration_time: getExpirationTime(expectation.expectation_expiration_time),
  };

  // Popover
  const handlePopoverOpen = (event: ReactMouseEvent<HTMLButtonElement>) => {
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

  const onSubmitEdit = (data: ExpectationInputForm) => {
    const values: ExpectationInput = {
      ...data,
      expectation_expiration_time: data.expiration_time_days * 3600 * 24
        + data.expiration_time_hours * 3600
        + data.expiration_time_minutes * 60,
    };
    handleUpdate(values, index);
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
        onClick={event => handlePopoverOpen(event)}
        aria-haspopup="true"
        size="large"
        disabled={permissions.readOnly}
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
      <DialogMUI
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
      </DialogMUI>
      <Dialog
        open={openEdit}
        handleClose={handleCloseEdit}
        title={t('Update the expectation')}
      >
        <ExpectationFormUpdate
          initialValues={initialValues}
          onSubmit={onSubmitEdit}
          handleClose={handleCloseEdit}
        />
      </Dialog>
    </div>
  );
};

export default ExpectationPopover;
