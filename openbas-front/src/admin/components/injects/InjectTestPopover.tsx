import { MoreVert } from '@mui/icons-material';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { type FunctionComponent, type MouseEvent as ReactMouseEvent, useContext, useState } from 'react';

import { deleteInjectTest } from '../../../actions/inject_test/inject-test-actions';
import { testInject } from '../../../actions/injects/inject-action';
import DialogDelete from '../../../components/common/DialogDelete';
import DialogTest from '../../../components/common/DialogTest';
import { useFormatter } from '../../../components/i18n';
import { type InjectTestStatusOutput } from '../../../utils/api-types';
import { MESSAGING$ } from '../../../utils/Environment';
import { PermissionsContext } from '../common/Context';

interface Props {
  injectTest: InjectTestStatusOutput;
  onTest?: (result: InjectTestStatusOutput) => void;
  onDelete?: (result: string) => void;
}

const InjectTestPopover: FunctionComponent<Props> = ({
  injectTest,
  onDelete,
  onTest,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const { permissions } = useContext(PermissionsContext);

  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [openTest, setOpenTest] = useState(false);

  const handlePopoverOpen = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handlePopoverClose = () => setAnchorEl(null);

  const handleOpenDelete = () => {
    setOpenDelete(true);
    handlePopoverClose();
  };
  const handleCloseDelete = () => setOpenDelete(false);
  const submitDelete = () => {
    deleteInjectTest(injectTest.status_id).then(() => {
      if (onDelete) {
        onDelete(injectTest.status_id!);
      }
    });
    handleCloseDelete();
  };

  const handleOpenTest = () => {
    setOpenTest(true);
    handlePopoverClose();
  };

  const handleCloseTest = () => {
    setOpenTest(false);
  };

  const submitTest = () => {
    testInject(injectTest.inject_id!).then((result: { data: InjectTestStatusOutput }) => {
      onTest?.(result.data);
      MESSAGING$.notifySuccess(t(`Test for inject ${injectTest.inject_title} has been sent`));
      return result;
    });
    handleCloseTest();
  };

  return (
    <>
      <IconButton
        onClick={handlePopoverOpen}
        aria-haspopup="true"
        size="large"
        color="primary"
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
          onClick={handleOpenTest}
        >
          {t('Replay test')}
        </MenuItem>
        <MenuItem onClick={handleOpenDelete}>
          {t('Delete test')}
        </MenuItem>
      </Menu>
      <DialogDelete
        open={openDelete}
        handleClose={handleCloseDelete}
        handleSubmit={submitDelete}
        text={t('Do you want to delete this test?')}
      />
      <DialogTest
        open={openTest}
        handleClose={handleCloseTest}
        handleSubmit={submitTest}
        text={t('Do you want to replay this test?')}
      />
    </>
  );
};

export default InjectTestPopover;
