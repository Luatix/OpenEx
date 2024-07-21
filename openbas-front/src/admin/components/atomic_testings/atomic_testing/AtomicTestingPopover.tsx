import React, { FunctionComponent, useContext, useState } from 'react';
import * as R from 'ramda';
import { useNavigate } from 'react-router-dom';
import type { Inject, InjectResultDTO } from '../../../../utils/api-types';
import { useFormatter } from '../../../../components/i18n';
import { useAppDispatch } from '../../../../utils/hooks';
import ButtonPopover, { VariantButtonPopover } from '../../../../components/common/ButtonPopover';
import DialogDelete from '../../../../components/common/DialogDelete';
import { deleteAtomicTesting, duplicateAtomicTesting, updateAtomicTesting } from '../../../../actions/atomic_testings/atomic-testing-actions';
import { useHelper } from '../../../../store';
import useDataLoader from '../../../../utils/hooks/useDataLoader';
import UpdateInject from '../../common/injects/UpdateInject';
import type { TeamsHelper } from '../../../../actions/teams/team-helper';
import { fetchTeams } from '../../../../actions/teams/team-actions';
import type { TeamStore } from '../../../../actions/teams/Team';
import { InjectResultDtoContext, InjectResultDtoContextType } from '../InjectResultDtoContext';
import DialogDuplicate from '../../../../components/common/DialogDuplicate';

export type AtomicTestingActionPopover = 'Update' | 'Delete' | 'Duplicate';

interface Props {
  atomic: InjectResultDTO;
  actions: AtomicTestingActionPopover[];
  onOperationSuccess?: () => void;
  openEditId: string | null;
  setOpenEditId: (id: string | null) => void;
  variantButtonPopover?: VariantButtonPopover;
}

const AtomicTestingPopover: FunctionComponent<Props> = ({
  atomic,
  actions = [],
  onOperationSuccess,
  openEditId,
  setOpenEditId,
  variantButtonPopover,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Fetching data
  const { updateInjectResultDto } = useContext<InjectResultDtoContextType>(InjectResultDtoContext);
  const { teams } = useHelper((helper: TeamsHelper) => ({
    teams: helper.getTeams(),
  }));
  useDataLoader(() => {
    dispatch(fetchTeams());
  });

  const handleOpenEdit = () => setOpenEditId(atomic.inject_id);
  const handleCloseEdit = () => setOpenEditId(null);

  const onUpdateAtomicTesting = async (data: Inject) => {
    const toUpdate = R.pipe(
      R.pick([
        'inject_tags',
        'inject_title',
        'inject_type',
        'inject_injector_contract',
        'inject_description',
        'inject_content',
        'inject_all_teams',
        'inject_documents',
        'inject_assets',
        'inject_asset_groups',
        'inject_teams',
        'inject_tags',
      ]),
    )(data);
    updateAtomicTesting(atomic.inject_id, toUpdate).then((result: { data: InjectResultDTO }) => {
      updateInjectResultDto(result.data);
      handleCloseEdit();
    });
  };

  const [openDelete, setOpenDelete] = useState(false);
  const handleOpenDelete = () => setOpenDelete(true);
  const handleCloseDelete = () => setOpenDelete(false);
  const submitDelete = () => {
    deleteAtomicTesting(atomic.inject_id).then(() => {
      handleCloseDelete();
      if (onOperationSuccess) onOperationSuccess();
      navigate('/admin/atomic_testings');
    });
  };

  const [openDuplicate, setOpenDuplicate] = useState(false);
  const handleOpenDuplicate = () => setOpenDuplicate(true);
  const handleCloseDuplicate = () => setOpenDuplicate(false);
  const submitDuplicate = () => {
    duplicateAtomicTesting(atomic.inject_id).then((result: { data: InjectResultDTO }) => {
      handleCloseDuplicate();
      if (onOperationSuccess) onOperationSuccess();
      navigate(`/admin/atomic_testings/${result.data.inject_id}`, { replace: true });
    });
  };

  const entries = [];
  if (actions.includes('Update')) entries.push({ label: 'Update', action: handleOpenEdit });
  if (actions.includes('Delete')) entries.push({ label: 'Delete', action: handleOpenDelete });
  if (actions.includes('Duplicate')) entries.push({ label: 'Duplicate', action: handleOpenDuplicate });

  return (
    <>
      <ButtonPopover entries={entries} variant={variantButtonPopover} />
      <UpdateInject
        open={openEditId === atomic.inject_id}
        handleClose={handleCloseEdit}
        onUpdateInject={onUpdateAtomicTesting}
        injectId={atomic.inject_id}
        isAtomic
        teamsFromExerciseOrScenario={teams?.filter((team: TeamStore) => !team.team_contextual) ?? []}
      />
      <DialogDelete
        open={openDelete}
        handleClose={handleCloseDelete}
        handleSubmit={submitDelete}
        text={`${t('Do you want to delete this atomic testing:')} ${atomic.inject_title} ?`}
      />
      <DialogDuplicate
        open={openDuplicate}
        handleClose={handleCloseDuplicate}
        handleSubmit={submitDuplicate}
        text={`${t('Do you want to duplicate this atomic testing:')} ${atomic.inject_title} ?`}
      />
    </>
  );
};

export default AtomicTestingPopover;
