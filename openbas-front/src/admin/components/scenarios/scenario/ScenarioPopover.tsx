import { FunctionComponent, useState } from 'react';
import { useNavigate } from 'react-router';

import type { TagHelper, UserHelper } from '../../../../actions/helper';
import { deleteScenario, duplicateScenario, exportScenarioUri } from '../../../../actions/scenarios/scenario-actions';
import ButtonPopover from '../../../../components/common/ButtonPopover';
import DialogDelete from '../../../../components/common/DialogDelete';
import DialogDuplicate from '../../../../components/common/DialogDuplicate';
import ExportOptionsDialog from '../../../../components/common/export/ExportOptionsDialog';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import { Scenario } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import useScenarioPermissions from '../../../../utils/Scenario';
import ScenarioUpdate from './ScenarioUpdate';

type ScenarioActionType = 'Duplicate' | 'Update' | 'Delete' | 'Export';

interface Props {
  scenario: Scenario;
  actions: ScenarioActionType[];
  onDelete?: (result: string) => void;
  inList?: boolean;
}

const ScenarioPopover: FunctionComponent<Props> = ({
  scenario,
  actions = [],
  onDelete,
  inList = false,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const permissions = useScenarioPermissions(scenario.scenario_id);

  // Fetching data
  const { userAdmin } = useHelper((helper: TagHelper & UserHelper) => ({
    userAdmin: helper.getMe()?.user_admin ?? false,
  }));

  // Duplicate
  const [duplicate, setDuplicate] = useState(false);
  const handleOpenDuplicate = () => setDuplicate(true);
  const handleCloseDuplicate = () => setDuplicate(false);
  const submitDuplicate = () => {
    dispatch(duplicateScenario(scenario.scenario_id)).then((result: { result: string; entities: { scenarios: Record<string, Scenario> } }) => {
      handleCloseDuplicate();
      navigate(`/admin/scenarios/${result.result}`);
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
    dispatch(deleteScenario(scenario.scenario_id)).then(() => {
      handleCloseDelete();
      if (onDelete) onDelete(scenario.scenario_id);
    });
  };

  // Export
  const [exportation, setExportation] = useState(false);
  const handleOpenExport = () => setExportation(true);
  const handleCloseExport = () => setExportation(false);
  const submitExport = (exportTeams: boolean, exportPlayers: boolean, exportVariableValues: boolean) => {
    const link = document.createElement('a');
    link.href = exportScenarioUri(scenario.scenario_id, exportTeams, exportPlayers, exportVariableValues);
    link.click();
  };

  // Button Popover
  const entries = [];
  if (actions.includes('Duplicate')) entries.push({ label: 'Duplicate', action: () => handleOpenDuplicate() });
  if (actions.includes('Update')) entries.push({ label: 'Update', action: () => handleOpenEdit(), disabled: !permissions.canWrite });
  if (actions.includes('Delete')) entries.push({ label: 'Delete', action: () => handleOpenDelete(), disabled: !userAdmin });
  if (actions.includes('Export')) entries.push({ label: 'Export', action: () => handleOpenExport() });

  return (
    <>
      {actions.length > 0 && <ButtonPopover entries={entries} variant={inList ? 'icon' : 'toggle'} />}
      {actions.includes('Duplicate')
      && (
        <DialogDuplicate
          open={duplicate}
          handleClose={handleCloseDuplicate}
          handleSubmit={submitDuplicate}
          text={`${t('Do you want to duplicate this scenario:')} ${scenario.scenario_name} ?`}
        />
      )}
      {actions.includes(('Update'))
      && (
        <ScenarioUpdate
          scenario={scenario}
          open={edition}
          handleClose={handleCloseEdit}
        />
      )}
      {actions.includes('Delete')
      && (
        <DialogDelete
          open={deletion}
          handleClose={handleCloseDelete}
          handleSubmit={submitDelete}
          text={`${t('Do you want to delete this scenario:')} ${scenario.scenario_name} ?`}
        />
      )}
      {actions.includes('Export')
      && (
        <ExportOptionsDialog
          title={t('Export the scenario')}
          open={exportation}
          onCancel={handleCloseExport}
          onClose={handleCloseExport}
          onSubmit={submitExport}
        />
      )}
    </>
  );
};

export default ScenarioPopover;
