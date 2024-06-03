import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import * as R from 'ramda';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, IconButton, Menu, MenuItem } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import InjectorContractForm from './InjectorContractForm';
import { useFormatter } from '../../../../../components/i18n';
import { attackPatternOptions } from '../../../../../utils/Option';
import Transition from '../../../../../components/common/Transition';
import { deleteInjectorContract, updateInjectorContract, updateInjectorContractMapping } from '../../../../../actions/InjectorContracts';
import InjectorContractCustomForm from './InjectorContractCustomForm';
import Drawer from '../../../../../components/common/Drawer';

const InjectorContractPopover = ({ injectorContract, killChainPhasesMap, attackPatternsMap, onUpdate }) => {
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
  const onSubmitEditMapping = (data) => {
    const inputValues = R.pipe(
      R.assoc('contract_attack_patterns_ids', R.pluck('id', data.injector_contract_attack_patterns)),
      R.dissoc('injector_contract_attack_patterns'),
    )(data);
    return dispatch(updateInjectorContractMapping(injectorContract.injector_contract_id, inputValues)).then((result) => {
      if (result.entities) {
        if (onUpdate) {
          const updated = result.entities.injector_contracts[result.result];
          onUpdate(updated);
        }
      }
      handleCloseEdit();
    });
  };
  const onSubmitEdit = (data, fields) => {
    const injectorContractContent = JSON.parse(injectorContract.injector_contract_content);
    const newInjectorContractContent = {
      ...injectorContractContent,
      label: { en: data.injector_contract_name },
      fields: injectorContractContent.fields.map((field) => {
        const newField = field;
        if (!R.isNil(fields[field.key]?.readOnly)) {
          newField.readOnly = fields[field.key]?.readOnly;
        }
        if (!R.isNil(fields[field.key]?.defaultValue)) {
          newField.defaultValue = field.cardinality === '1' ? fields[field.key]?.defaultValue : [fields[field.key]?.defaultValue];
        }
        return newField;
      }),
    };
    const inputValues = R.pipe(
      R.assoc('contract_labels', { en: data.injector_contract_name }),
      R.assoc('contract_attack_patterns_ids', R.pluck('id', data.injector_contract_attack_patterns)),
      R.assoc('contract_content', JSON.stringify(newInjectorContractContent)),
      R.dissoc('injector_contract_attack_patterns'),
    )(data);
    return dispatch(updateInjectorContract(injectorContract.injector_contract_id, inputValues)).then((result) => {
      if (result.entities) {
        if (onUpdate) {
          const updated = result.entities.injector_contracts[result.result];
          onUpdate(updated);
        }
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
    dispatch(deleteInjectorContract(injectorContract.injector_contract_id));
    handleCloseDelete();
  };
  const injectorContractAttackPatterns = attackPatternOptions(injectorContract.injector_contract_attack_patterns, attackPatternsMap, killChainPhasesMap);
  let initialValues = null;
  if (injectorContract.injector_contract_custom) {
    initialValues = R.pipe(
      R.assoc('injector_contract_name', injectorContract.injector_contract_labels.en),
      R.assoc('injector_contract_attack_patterns', injectorContractAttackPatterns),
    )(injectorContract);
  } else {
    initialValues = { injector_contract_attack_patterns: injectorContractAttackPatterns };
  }
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
        <MenuItem onClick={handleOpenDelete} disabled={!injectorContract.injector_contract_custom}>{t('Delete')}</MenuItem>
      </Menu>
      <Dialog
        open={openDelete}
        TransitionComponent={Transition}
        onClose={handleCloseDelete}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to delete this inject contract?')}
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
        title={t('Update the injector contract')}
      >
        {injectorContract.injector_contract_custom ? (
          <InjectorContractCustomForm
            initialValues={initialValues}
            editing={true}
            onSubmit={onSubmitEdit}
            handleClose={handleCloseEdit}
            contractTemplate={injectorContract}
          />
        ) : (
          <InjectorContractForm
            initialValues={initialValues}
            editing={true}
            onSubmit={onSubmitEditMapping}
            handleClose={handleCloseEdit}
          />
        )}
      </Drawer>
    </>
  );
};

export default InjectorContractPopover;
