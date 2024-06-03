import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import * as R from 'ramda';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, IconButton, Menu, MenuItem } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { deletePayload, updatePayload } from '../../../actions/Payload';
import PayloadForm from './PayloadForm';
import { useFormatter } from '../../../components/i18n';
import { attackPatternOptions, documentOptions, platformOptions, tagOptions } from '../../../utils/Option';
import Transition from '../../../components/common/Transition';
import Drawer from '../../../components/common/Drawer';

const PayloadPopover = ({ payload, documentsMap, tagsMap, attackPatternsMap, killChainPhasesMap, onUpdate, onDelete }) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const dispatch = useDispatch();
  const { t } = useFormatter();
  const handlePopoverOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handlePopoverClose = () => setAnchorEl(null);
  const handleOpenEdit = () => {
    setOpenEdit(true);
    handlePopoverClose();
  };
  const handleCloseEdit = () => setOpenEdit(false);
  const onSubmitEdit = (data) => {
    const inputValues = R.pipe(
      R.assoc('payload_platforms', R.pluck('id', data.payload_platforms)),
      R.assoc('payload_tags', R.pluck('id', data.payload_tags)),
      R.assoc('payload_attack_patterns', R.pluck('id', data.payload_attack_patterns)),
    )(data);
    return dispatch(updatePayload(payload.payload_id, inputValues)).then((result) => {
      if (onUpdate) {
        const payloadUpdated = result.entities.payloads[result.result];
        onUpdate(payloadUpdated);
      }
      handleCloseEdit();
    });
  };

  const handleOpenDelete = () => {
    setOpenDelete(true);
    handlePopoverClose();
  };
  const handleCloseDelete = () => setOpenDelete(false);
  const submitDelete = () => {
    dispatch(deletePayload(payload.payload_id)).then(
      () => {
        if (onDelete) {
          onDelete(payload.payload_id);
        }
      },
    );
    handleCloseDelete();
  };
  const payloadAttackPatterns = attackPatternOptions(payload.payload_attack_patterns, attackPatternsMap, killChainPhasesMap);
  const payloadTags = tagOptions(payload.payload_tags, tagsMap);
  const payloadPlatforms = platformOptions(payload.payload_platforms);
  const payloadFiles = documentOptions(payload.executable_file ? [payload.executable_file] : [], documentsMap);
  const initialValues = R.pipe(
    R.pick([
      'payload_name',
      'payload_description',
      'payload_cleanup_executor',
      'payload_cleanup_command',
      'command_executor',
      'command_content',
      'dns_resolution_hostname',
      'payload_arguments',
      'payload_prerequisites',
    ]),
    R.assoc('payload_platforms', payloadPlatforms),
    R.assoc('payload_attack_patterns', payloadAttackPatterns),
    R.assoc('payload_tags', payloadTags),
    R.assoc('executable_file', R.head(payloadFiles)),
  )(payload);
  return (
    <>
      <IconButton color="primary" onClick={handlePopoverOpen} aria-haspopup="true" size="large">
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handlePopoverClose}
      >
        <MenuItem onClick={handleOpenEdit}>{t('Update')}</MenuItem>
        <MenuItem onClick={handleOpenDelete}>{t('Delete')}</MenuItem>
      </Menu>
      <Dialog
        open={openDelete}
        TransitionComponent={Transition}
        onClose={handleCloseDelete}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to delete this payload?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>{t('Cancel')}</Button>
          <Button color="secondary" onClick={submitDelete}>
            {t('Delete')}
          </Button>
        </DialogActions>
      </Dialog>
      <Drawer
        open={openEdit}
        handleClose={handleCloseEdit}
        title={t('Update the payload')}
      >
        <PayloadForm
          initialValues={initialValues}
          editing={true}
          onSubmit={onSubmitEdit}
          handleClose={handleCloseEdit}
          type={payload.payload_type}
        />
      </Drawer>
    </>
  );
};

export default PayloadPopover;
