import { FunctionComponent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchPlatformParameters } from '../../../actions/Application';
import { LoggedHelper } from '../../../actions/helper';
import type { ScenarioStore } from '../../../actions/scenarios/Scenario';
import { addScenario } from '../../../actions/scenarios/scenario-actions';
import ButtonCreate from '../../../components/common/ButtonCreate';
import Drawer from '../../../components/common/Drawer';
import { useFormatter } from '../../../components/i18n';
import { useHelper } from '../../../store';
import type { PlatformSettings, ScenarioInput } from '../../../utils/api-types';
import { useAppDispatch } from '../../../utils/hooks';
import useDataLoader from '../../../utils/hooks/useDataLoader';
import ScenarioForm from './ScenarioForm';

interface Props {
  onCreate?: (result: ScenarioStore) => void;
}

const ScenarioCreation: FunctionComponent<Props> = ({
  onCreate,
}) => {
  // Standard hooks
  const [open, setOpen] = useState(false);
  const { t } = useFormatter();
  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const onSubmit = (data: ScenarioInput) => {
    dispatch(addScenario(data)).then(
      (result: { result: string; entities: { scenarios: Record<string, ScenarioStore> } }) => {
        if (result.entities) {
          if (onCreate) {
            const created = result.entities.scenarios[result.result];
            onCreate(created);
          }
          setOpen(false);
        }
        navigate(`/admin/scenarios/${result.result}`);
      },
    );
  };

  const { settings }: { settings: PlatformSettings } = useHelper((helper: LoggedHelper) => ({
    settings: helper.getPlatformSettings(),
  }));
  useDataLoader(() => {
    dispatch(fetchPlatformParameters());
  });

  const initialValues: ScenarioInput = {
    scenario_name: '',
    scenario_category: 'attack-scenario',
    scenario_main_focus: 'incident-response',
    scenario_severity: 'high',
    scenario_subtitle: '',
    scenario_description: '',
    scenario_external_reference: '',
    scenario_external_url: '',
    scenario_tags: [],
    scenario_message_header: 'SIMULATION HEADER',
    scenario_message_footer: 'SIMULATION FOOTER',
    scenario_mail_from: settings.default_mailer ? settings.default_mailer : '',
    scenario_mails_reply_to: [settings.default_reply_to ? settings.default_reply_to : ''],
  };

  return (
    <>
      <ButtonCreate onClick={() => setOpen(true)} />
      <Drawer
        open={open}
        handleClose={() => setOpen(false)}
        title={t('Create a new scenario')}
      >
        <ScenarioForm
          onSubmit={onSubmit}
          initialValues={initialValues}
          handleClose={() => setOpen(false)}
        />
      </Drawer>
    </>
  );
};
export default ScenarioCreation;
