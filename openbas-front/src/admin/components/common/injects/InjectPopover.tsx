import React, { FunctionComponent, useContext, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, IconButton, Menu, MenuItem, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { useFormatter } from '../../../../components/i18n';
import Transition from '../../../../components/common/Transition';
import type { InjectStore } from '../../../../actions/injects/Inject';
import { InjectContext, PermissionsContext } from '../Context';
import type { Inject, InjectStatus, InjectStatusExecution, Tag } from '../../../../utils/api-types';
import { tryInject } from '../../../../actions/Inject';
import { useAppDispatch } from '../../../../utils/hooks';

interface Props {
  inject: InjectStore;
  tagsMap: Record<string, Tag>;
  setSelectedInjectId: (injectId: Inject['inject_id']) => void;
  isDisabled: boolean;
}

const InjectPopover: FunctionComponent<Props> = ({
  inject,
  setSelectedInjectId,
  isDisabled,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  const { permissions } = useContext(PermissionsContext);
  const {
    onUpdateInjectTrigger,
    onUpdateInjectActivation,
    onInjectDone,
    onDeleteInject,
  } = useContext(InjectContext);

  const [openDelete, setOpenDelete] = useState(false);
  const [openTry, setOpenTry] = useState(false);
  const [openEnable, setOpenEnable] = useState(false);
  const [openDisable, setOpenDisable] = useState(false);
  const [openDone, setOpenDone] = useState(false);
  const [openResult, setOpenResult] = useState(false);
  const [openTrigger, setOpenTrigger] = useState(false);
  const [injectResult, setInjectResult] = useState<InjectStatus | null>(null);
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
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
    onDeleteInject(inject.inject_id);
    handleCloseDelete();
  };

  // const handleOpenTry = () => {
  //   setOpenTry(true);
  //   handlePopoverClose();
  // };

  const handleCloseTry = () => setOpenTry(false);

  const handleCloseResult = () => {
    setOpenResult(false);
    setInjectResult(null);
  };

  const submitTry = () => {
    // FIXME: remove try possibility
    dispatch(tryInject(inject.inject_id)).then((payload: InjectStatus) => {
      setInjectResult(payload);
      setOpenResult(true);
    });
    handleCloseTry();
  };

  const handleOpenEnable = () => {
    setOpenEnable(true);
    handlePopoverClose();
  };

  const handleCloseEnable = () => setOpenEnable(false);

  const submitEnable = () => {
    onUpdateInjectActivation(inject.inject_id, { inject_enabled: true });
    handleCloseEnable();
  };

  const handleOpenDisable = () => {
    setOpenDisable(true);
    handlePopoverClose();
  };

  const handleCloseDisable = () => {
    setOpenDisable(false);
  };

  const submitDisable = () => {
    onUpdateInjectActivation(inject.inject_id, { inject_enabled: false });
    handleCloseDisable();
  };

  const handleOpenDone = () => {
    setOpenDone(true);
    handlePopoverClose();
  };

  const handleCloseDone = () => setOpenDone(false);

  const submitDone = () => {
    onInjectDone?.(inject.inject_id);
    handleCloseDone();
  };

  const handleOpenEditContent = () => {
    setSelectedInjectId(inject.inject_id);
    handlePopoverClose();
  };

  const handleOpenTrigger = () => {
    setOpenTrigger(true);
    handlePopoverClose();
  };

  const handleCloseTrigger = () => setOpenTrigger(false);

  const submitTrigger = () => {
    onUpdateInjectTrigger?.(inject.inject_id);
    handleCloseTrigger();
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
          onClick={handleOpenEditContent}
          disabled={isDisabled}
        >
          {t('Update')}
        </MenuItem>
        {!inject.inject_status && onInjectDone && (
          <MenuItem
            onClick={handleOpenDone}
            disabled={isDisabled}
          >
            {t('Mark as done')}
          </MenuItem>
        )}
        {inject.inject_type !== 'openbas_manual' && onUpdateInjectTrigger && (
          <MenuItem
            onClick={handleOpenTrigger}
            disabled={isDisabled || !permissions.isRunning}
          >
            {t('Trigger now')}
          </MenuItem>
        )}
        {/* TODO create an atomic testing when using this button */}
        {/* {inject.inject_type !== 'openbas_manual' && ( */}
        {/*  <MenuItem */}
        {/*    onClick={handleOpenTry} */}
        {/*    disabled={isDisabled} */}
        {/*  > */}
        {/*    {t('Try the inject')} */}
        {/*  </MenuItem> */}
        {/* )} */}
        {inject.inject_enabled ? (
          <MenuItem
            onClick={handleOpenDisable}
            disabled={isDisabled}
          >
            {t('Disable')}
          </MenuItem>
        ) : (
          <MenuItem
            onClick={handleOpenEnable}
            disabled={isDisabled}
          >
            {t('Enable')}
          </MenuItem>
        )}
        <MenuItem onClick={handleOpenDelete}>
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
            {t('Do you want to delete this inject?')}
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
        open={openTry}
        onClose={handleCloseTry}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            <p>{t('Do you want to try this inject?')}</p>
            <Alert severity="info">
              {t('The inject will only be sent to you.')}
            </Alert>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTry}>
            {t('Cancel')}
          </Button>
          <Button color="secondary" onClick={submitTry}>
            {t('Try')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        TransitionComponent={Transition}
        open={openEnable}
        onClose={handleCloseEnable}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to enable this inject?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEnable}>
            {t('Cancel')}
          </Button>
          <Button color="secondary" onClick={submitEnable}>
            {t('Enable')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        TransitionComponent={Transition}
        open={openDisable}
        onClose={handleCloseDisable}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to disable this inject?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDisable}>
            {t('Cancel')}
          </Button>
          <Button color="secondary" onClick={submitDisable}>
            {t('Disable')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        TransitionComponent={Transition}
        open={openDone}
        onClose={handleCloseDone}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to mark this inject as done?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDone}>
            {t('Cancel')}
          </Button>
          <Button color="secondary" onClick={submitDone}>
            {t('Mark')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        TransitionComponent={Transition}
        open={openTrigger}
        onClose={handleCloseTrigger}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to trigger this inject now?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTrigger}>
            {t('Cancel')}
          </Button>
          <Button color="secondary" onClick={submitTrigger}>
            {t('Trigger')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openResult}
        TransitionComponent={Transition}
        onClose={handleCloseResult}
        fullWidth
        maxWidth="md"
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          {/* TODO: selectable={false} */}
          <Table size="small">
            {/* TODO: displayRowCheckbox={false} */}
            <TableBody>
              {injectResult && Object.entries(injectResult).map(
                ([key, value]) => {
                  if (key === 'status_traces') {
                    return (
                      <TableRow key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell>
                          {/* TODO: selectable={false} */}
                          <Table size="small" key={key}>
                            {/* TODO: displayRowCheckbox={false} */}
                            <TableBody>
                              <>
                                {value?.filter((trace: InjectStatusExecution) => !!trace.execution_message)
                                  .map((trace: InjectStatusExecution) => (
                                    <TableRow key={trace.execution_category}>
                                      <TableCell>
                                        {trace.execution_message}
                                      </TableCell>
                                      <TableCell>
                                        {trace.execution_status}
                                      </TableCell>
                                      <TableCell>{trace.execution_time}</TableCell>
                                    </TableRow>
                                  ))}
                              </>
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return (
                    <TableRow key={key}>
                      <TableCell>{key}</TableCell>
                      <TableCell>{value}</TableCell>
                    </TableRow>
                  );
                },
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResult}>
            {t('Close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InjectPopover;
