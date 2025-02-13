import { MoreVert } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, IconButton, Menu, MenuItem } from '@mui/material';
import { FunctionComponent, useContext, useState } from 'react';
import * as React from 'react';
import { Link } from 'react-router';

import type { ExercisesHelper } from '../../../../actions/exercises/exercise-helper';
import { duplicateInjectForExercise, duplicateInjectForScenario } from '../../../../actions/Inject';
import type { InjectStore } from '../../../../actions/injects/Inject';
import { exportInjects, testInject } from '../../../../actions/injects/inject-action';
import DialogDuplicate from '../../../../components/common/DialogDuplicate';
import DialogTest from '../../../../components/common/DialogTest';
import ExportOptionsDialog from '../../../../components/common/export/ExportOptionsDialog';
import Transition from '../../../../components/common/Transition';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import type { Inject, InjectExportRequestInput, InjectStatus, InjectTestStatusOutput } from '../../../../utils/api-types';
import { MESSAGING$ } from '../../../../utils/Environment';
import { useAppDispatch } from '../../../../utils/hooks';
import { download } from '../../../../utils/utils';
import { InjectContext, PermissionsContext } from '../Context';

type InjectPopoverType = {
  inject_id: string;
  inject_exercise?: string;
  inject_scenario?: string;
  inject_status?: InjectStatus;
  inject_testable?: boolean;
  inject_teams?: string[];
  inject_type?: string;
  inject_enabled?: boolean;
  inject_title?: string;
};

interface Props {
  inject: InjectPopoverType;
  setSelectedInjectId: (injectId: Inject['inject_id']) => void;
  isDisabled?: boolean;
  canBeTested?: boolean;
  canDone?: boolean;
  canTriggerNow?: boolean;
  exerciseOrScenarioId?: string;
  onCreate?: (result: { result: string; entities: { injects: Record<string, InjectStore> } }) => void;
  onUpdate?: (result: { result: string; entities: { injects: Record<string, InjectStore> } }) => void;
  onDelete?: (result: string) => void;
}

const InjectPopover: FunctionComponent<Props> = ({
  inject,
  setSelectedInjectId,
  isDisabled = false,
  canBeTested = false,
  canDone = false,
  canTriggerNow = false,
  exerciseOrScenarioId,
  onCreate,
  onUpdate,
  onDelete,
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
  const [duplicate, setDuplicate] = useState(false);
  const [openTest, setOpenTest] = useState(false);
  const [openEnable, setOpenEnable] = useState(false);
  const [openDisable, setOpenDisable] = useState(false);
  const [openDone, setOpenDone] = useState(false);
  const [openTrigger, setOpenTrigger] = useState(false);
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [openExportDialog, setOpenExportDialog] = useState(false);

  const isExercise = useHelper((helper: ExercisesHelper) => helper.getExercisesMap()[exerciseOrScenarioId!] !== undefined);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => setAnchorEl(null);

  const handleOpenDuplicate = () => {
    setDuplicate(true);
    handlePopoverClose();
  };
  const handleCloseDuplicate = () => setDuplicate(false);

  const submitDuplicate = () => {
    if (inject.inject_exercise) {
      dispatch(duplicateInjectForExercise(inject.inject_exercise, inject.inject_id)).then((result: { result: string; entities: { injects: Record<string, InjectStore> } }) => {
        onCreate?.(result);
      });
    }
    if (inject.inject_scenario) {
      dispatch(duplicateInjectForScenario(inject.inject_scenario, inject.inject_id)).then((result: { result: string; entities: { injects: Record<string, InjectStore> } }) => {
        onCreate?.(result);
      });
    }
    handleCloseDuplicate();
  };

  const handleOpenDelete = () => {
    setOpenDelete(true);
    handlePopoverClose();
  };
  const handleCloseDelete = () => setOpenDelete(false);

  const submitDelete = () => {
    onDeleteInject(inject.inject_id).then(() => {
      onDelete?.(inject.inject_id);
      handleCloseDelete();
    });
  };

  const handleOpenTest = () => {
    setOpenTest(true);
    handlePopoverClose();
  };
  const handleCloseTest = () => setOpenTest(false);

  const handleExportOpen = () => setOpenExportDialog(true);
  const handleExportClose = () => setOpenExportDialog(false);

  const handleExportJsonSingle = (withPlayers: boolean, withTeams: boolean, withVariableValues: boolean) => {
    const exportData: InjectExportRequestInput = {
      injects: [
        { inject_id: inject.inject_id },
      ],
      options: {
        with_players: withPlayers,
        with_teams: withTeams,
        with_variable_values: withVariableValues,
      },
    };
    exportInjects(exportData).then((result) => {
      const contentDisposition = result.headers['content-disposition'];
      const match = contentDisposition.match(/filename\s*=\s*(.*)/i);
      const filename = match[1];
      download(result.data, filename, result.headers['content-type']);
    });
    handleExportClose();
  };

  const submitTest = () => {
    testInject(inject.inject_id).then((result: { data: InjectTestStatusOutput }) => {
      if (isExercise) {
        MESSAGING$.notifySuccess(t('Inject test has been sent, you can view test logs details on {itsDedicatedPage}.', {
          itsDedicatedPage: <Link to={`/admin/simulations/${exerciseOrScenarioId}/tests/${result.data.status_id}`}>{t('its dedicated page')}</Link>,
        }));
      } else {
        MESSAGING$.notifySuccess(t('Inject test has been sent, you can view test logs details on {itsDedicatedPage}.', {
          itsDedicatedPage: <Link to={`/admin/scenarios/${exerciseOrScenarioId}/tests/${result.data.status_id}`}>{t('its dedicated page')}</Link>,
        }));
      }
    });
    handleCloseTest();
  };

  const handleOpenEnable = () => {
    setOpenEnable(true);
    handlePopoverClose();
  };
  const handleCloseEnable = () => setOpenEnable(false);

  const submitEnable = () => {
    onUpdateInjectActivation(inject.inject_id, { inject_enabled: true }).then((result) => {
      onUpdate?.(result);
      handleCloseEnable();
    });
  };

  const handleOpenDisable = () => {
    setOpenDisable(true);
    handlePopoverClose();
  };
  const handleCloseDisable = () => setOpenDisable(false);

  const submitDisable = () => {
    onUpdateInjectActivation(inject.inject_id, { inject_enabled: false }).then((result) => {
      onUpdate?.(result);
      handleCloseDisable();
    });
  };

  const handleOpenDone = () => {
    setOpenDone(true);
    handlePopoverClose();
  };
  const handleCloseDone = () => setOpenDone(false);

  const submitDone = () => {
    onInjectDone?.(inject.inject_id).then((result) => {
      onUpdate?.(result);
      handleCloseDone();
    });
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
    onUpdateInjectTrigger?.(inject.inject_id).then((result) => {
      onUpdate?.(result);
      handleCloseTrigger();
    });
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
        <MenuItem onClick={handleExportOpen} disabled={isDisabled}>
          {t('inject_export_json_single')}
        </MenuItem>
        <MenuItem onClick={handleOpenDuplicate} disabled={isDisabled}>
          {t('Duplicate')}
        </MenuItem>
        <MenuItem
          onClick={handleOpenEditContent}
          disabled={isDisabled}
        >
          {t('Update')}
        </MenuItem>
        {!inject.inject_status && onInjectDone && canDone && (
          <MenuItem
            onClick={handleOpenDone}
            disabled={isDisabled}
          >
            {t('Mark as done')}
          </MenuItem>
        )}
        {inject.inject_testable && canBeTested && (
          <MenuItem onClick={handleOpenTest}>
            {t('Test')}
          </MenuItem>
        )}
        {inject.inject_type !== 'openbas_manual' && canTriggerNow && onUpdateInjectTrigger && (
          <MenuItem
            onClick={handleOpenTrigger}
            disabled={isDisabled || !permissions.isRunning}
          >
            {t('Trigger now')}
          </MenuItem>
        )}
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
      <DialogDuplicate
        open={duplicate}
        handleClose={handleCloseDuplicate}
        handleSubmit={submitDuplicate}
        text={`${t('Do you want to duplicate this inject:')} ${inject.inject_title} ?`}
      />
      <Dialog
        TransitionComponent={Transition}
        open={openDone}
        onClose={handleCloseDone}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t(`Do you want to mark this inject as done: ${inject.inject_title}?`)}
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
        open={openDelete}
        TransitionComponent={Transition}
        onClose={handleCloseDelete}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {`${t('Do you want to delete this inject:')} ${inject.inject_title} ?`}
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
      <DialogTest
        open={openTest}
        handleClose={handleCloseTest}
        handleSubmit={submitTest}
        text={`${t('Do you want to test this inject:')} ${inject.inject_title} ?`}
      />
      <Dialog
        TransitionComponent={Transition}
        open={openEnable}
        onClose={handleCloseEnable}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t(`Do you want to enable this inject: ${inject.inject_title}?`)}
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
            {`${t('Do you want to disable this inject:')} ${inject.inject_title} ?`}
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
            {t(`Do you want to mark this inject as done: ${inject.inject_title}?`)}
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
            {t(`Do you want to trigger this inject now: ${inject.inject_title}?`)}
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
      <ExportOptionsDialog
        title={t('inject_export_prompt')}
        open={openExportDialog}
        onCancel={handleExportClose}
        onClose={handleExportClose}
        onSubmit={handleExportJsonSingle}
      />
    </>
  );
};

export default InjectPopover;
