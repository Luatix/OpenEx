import {
  addInjectForScenario,
  bulkDeleteInjectsSimple,
  bulkUpdateInjectSimple,
  deleteInjectScenario,
  fetchScenarioInjects,
  updateInjectActivationForScenario,
  updateInjectForScenario,
} from '../../../../actions/Inject';
import { type InjectOutputType, type InjectStore } from '../../../../actions/injects/Inject';
import { bulkTestInjects, searchScenarioInjectsSimple } from '../../../../actions/injects/inject-action';
import {
  dryImportXlsForScenario,
  fetchScenario,
  fetchScenarioTeams,
  importXlsForScenario,
} from '../../../../actions/scenarios/scenario-actions';
import { type Page } from '../../../../components/common/queryable/Page';
import {
  type ImportTestSummary,
  type Inject,
  type InjectBulkProcessingInput,
  type InjectBulkUpdateInputs,
  type InjectsImportInput,
  type InjectTestStatusOutput,
  type Scenario,
  type SearchPaginationInput,
} from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';

const injectContextForScenario = (scenario: Scenario) => {
  const dispatch = useAppDispatch();

  return {
    searchInjects(input: SearchPaginationInput): Promise<{ data: Page<InjectOutputType> }> {
      return searchScenarioInjectsSimple(scenario.scenario_id, input);
    },
    onAddInject(inject: Inject): Promise<{ result: string; entities: { injects: Record<string, InjectStore> } }> {
      return dispatch(addInjectForScenario(scenario.scenario_id, inject));
    },
    onBulkUpdateInject(param: InjectBulkUpdateInputs): Promise<Inject[] | void> {
      return bulkUpdateInjectSimple(param).then((result: { data: Inject[] }) => result?.data);
    },
    onUpdateInject(injectId: Inject['inject_id'], inject: Inject): Promise<{ result: string; entities: { injects: Record<string, InjectStore> } }> {
      return dispatch(updateInjectForScenario(scenario.scenario_id, injectId, inject));
    },
    onUpdateInjectActivation(injectId: Inject['inject_id'], injectEnabled: { inject_enabled: boolean }): Promise<{
      result: string;
      entities: { injects: Record<string, InjectStore> };
    }> {
      return dispatch(updateInjectActivationForScenario(scenario.scenario_id, injectId, injectEnabled));
    },
    onDeleteInject(injectId: Inject['inject_id']): Promise<void> {
      return dispatch(deleteInjectScenario(scenario.scenario_id, injectId));
    },
    onImportInjectFromXls(importId: string, input: InjectsImportInput): Promise<ImportTestSummary> {
      return importXlsForScenario(scenario.scenario_id, importId, input).then(response => new Promise((resolve, _reject) => {
        dispatch(fetchScenarioInjects(scenario.scenario_id));
        dispatch(fetchScenario(scenario.scenario_id));
        dispatch(fetchScenarioTeams(scenario.scenario_id));
        resolve(response.data);
      }));
    },
    async onDryImportInjectFromXls(importId: string, input: InjectsImportInput): Promise<ImportTestSummary> {
      return dryImportXlsForScenario(scenario.scenario_id, importId, input).then(result => result.data);
    },
    onBulkDeleteInjects(param: InjectBulkProcessingInput): Promise<Inject[]> {
      return bulkDeleteInjectsSimple(param).then((result: { data: Inject[] }) => result?.data);
    },
    bulkTestInjects(param: InjectBulkProcessingInput): Promise<{ uri: string; data: InjectTestStatusOutput[] }> {
      return bulkTestInjects(param).then(result => ({
        uri: `/admin/scenarios/${scenario.scenario_id}/tests`,
        data: result.data,
      }));
    },
  };
};

export default injectContextForScenario;
