import { FunctionComponent, useState } from 'react';
import { useNavigate } from 'react-router';

import { deleteAtomicTesting, duplicateAtomicTesting } from '../../../../actions/atomic_testings/atomic-testing-actions';
import { exportInjects } from '../../../../actions/injects/inject-action';
import ButtonPopover from '../../../../components/common/ButtonPopover';
import DialogDelete from '../../../../components/common/DialogDelete';
import DialogDuplicate from '../../../../components/common/DialogDuplicate';
import ExportOptionsDialog from '../../../../components/common/export/ExportOptionsDialog';
import { useFormatter } from '../../../../components/i18n';
import type {
  InjectExportRequestInput,
  InjectResultOutput,
  InjectResultOverviewOutput,
} from '../../../../utils/api-types';
import { download } from '../../../../utils/utils';
import AtomicTestingUpdate from './AtomicTestingUpdate';

type AtomicTestingActionType = 'Duplicate' | 'Update' | 'Delete' | 'Export';

interface Props {
  atomic: InjectResultOutput | InjectResultOverviewOutput;
  actions: AtomicTestingActionType[];
  onDelete?: (result: string) => void;
  inList?: boolean;
}

const AtomicTestingPopover: FunctionComponent<Props> = ({
  atomic,
  actions = [],
  onDelete,
  inList = false,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const navigate = useNavigate();

  // Duplicate
  const [duplicate, setDuplicate] = useState(false);
  const handleOpenDuplicate = () => setDuplicate(true);
  const handleCloseDuplicate = () => setDuplicate(false);
  const submitDuplicate = async () => {
    await duplicateAtomicTesting(atomic.inject_id).then((result: { data: InjectResultOverviewOutput }) => {
      handleCloseDuplicate();
      navigate(`/admin/atomic_testings/${result.data.inject_id}`);
    });
  };

  // Edition
  const [edition, setEdition] = useState(false);
  const handleOpenEdit = () => setEdition(true);
  const handleCloseEdit = () => setEdition(false);

  // Deletion
  const [deletion, setDeletion] = useState(false);
  const handleOpenDelete = () => setDeletion(true);
  const handleCloseDelete = () => setDeletion(false);
  const submitDelete = () => {
    deleteAtomicTesting(atomic.inject_id).then(() => {
      handleCloseDelete();
      if (onDelete) onDelete(atomic.inject_id);
    });
  };

  // export
  const [exportOpen, setExportOpen] = useState(false);
  const handleOpenExport = () => setExportOpen(true);
  const handleCloseExport = () => setExportOpen(false);
  const doExport = (withPlayers: boolean, withTeams: boolean, withVariableValues: boolean) => {
    const exportData: InjectExportRequestInput = { injects:
      [{ inject_id: atomic.inject_id }],
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
  };

  // Button Popover
  const entries = [];
  if (actions.includes('Duplicate') && atomic.inject_injector_contract !== null) entries.push({ label: 'Duplicate', action: () => handleOpenDuplicate() });
  if (actions.includes('Update') && atomic.inject_injector_contract !== null) entries.push({ label: 'Update', action: () => handleOpenEdit() });
  if (actions.includes('Export') && atomic.inject_injector_contract !== null) entries.push({ label: t('inject_export_json_single'), action: () => handleOpenExport() });
  if (actions.includes('Delete')) entries.push({ label: 'Delete', action: () => handleOpenDelete() });

  return (
    <>
      <ButtonPopover entries={entries} variant={inList ? 'icon' : 'toggle'} />
      {actions.includes('Duplicate')
      && (
        <DialogDuplicate
          open={duplicate}
          handleClose={handleCloseDuplicate}
          handleSubmit={submitDuplicate}
          text={`${t('Do you want to duplicate this atomic testing:')} ${atomic.inject_title} ?`}
        />
      )}
      {actions.includes(('Update'))
      && (
        <AtomicTestingUpdate
          open={edition}
          handleClose={handleCloseEdit}
          atomic={atomic}
        />
      )}
      {actions.includes('Delete')
      && (
        <DialogDelete
          open={deletion}
          handleClose={handleCloseDelete}
          handleSubmit={submitDelete}
          text={`${t('Do you want to delete this atomic testing:')} ${atomic.inject_title} ?`}
        />
      )}
      {actions.includes('Export')
      && (
        <ExportOptionsDialog
          title={t('atomic_testing_export_prompt')}
          open={exportOpen}
          onCancel={handleCloseExport}
          onClose={handleCloseExport}
          onSubmit={doExport}
        />
      )}
    </>
  );
};

export default AtomicTestingPopover;
