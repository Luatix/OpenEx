import { type FunctionComponent, useState } from 'react';
import { useParams } from 'react-router';

import { type ArticlesHelper } from '../../../../../actions/channels/article-helper';
import { type ChallengeHelper } from '../../../../../actions/helper';
import { fetchScenarioInjectsSimple } from '../../../../../actions/injects/inject-action';
import { type InjectHelper } from '../../../../../actions/injects/inject-helper';
import { fetchScenarioTeams } from '../../../../../actions/scenarios/scenario-actions';
import { type ScenariosHelper } from '../../../../../actions/scenarios/scenario-helper';
import { fetchVariablesForScenario } from '../../../../../actions/variables/variable-actions';
import { type VariablesHelper } from '../../../../../actions/variables/variable-helper';
import { useHelper } from '../../../../../store';
import { type Scenario } from '../../../../../utils/api-types';
import { useAppDispatch } from '../../../../../utils/hooks';
import useDataLoader from '../../../../../utils/hooks/useDataLoader';
import { ArticleContext, TeamContext, ViewModeContext } from '../../../common/Context';
import Injects from '../../../common/injects/Injects';
import articleContextForScenario from '../articles/articleContextForScenario';
import teamContextForScenario from '../teams/teamContextForScenario';

const ScenarioInjects: FunctionComponent = () => {
  // Standard hooks
  const dispatch = useAppDispatch();
  const { scenarioId } = useParams() as { scenarioId: Scenario['scenario_id'] };

  const availableButtons = ['chain', 'list'];

  const { scenario, teams, articles, variables } = useHelper(
    (helper: InjectHelper & ScenariosHelper & ArticlesHelper & ChallengeHelper & VariablesHelper) => {
      return {
        injects: helper.getScenarioInjects(scenarioId),
        scenario: helper.getScenario(scenarioId),
        teams: helper.getScenarioTeams(scenarioId),
        articles: helper.getScenarioArticles(scenarioId),
        variables: helper.getScenarioVariables(scenarioId),
      };
    },
  );
  useDataLoader(() => {
    dispatch(fetchScenarioInjectsSimple(scenarioId));
    dispatch(fetchScenarioTeams(scenarioId));
    dispatch(fetchVariablesForScenario(scenarioId));
  });

  const articleContext = articleContextForScenario(scenarioId);
  const teamContext = teamContextForScenario(scenarioId, []);

  const [viewMode, setViewMode] = useState(() => {
    const storedValue = localStorage.getItem('scenario_or_exercise_view_mode');
    return storedValue === null || !availableButtons.includes(storedValue) ? 'list' : storedValue;
  });

  const handleViewMode = (mode: string) => {
    setViewMode(mode);
    localStorage.setItem('scenario_or_exercise_view_mode', mode);
  };

  return (
    <>
      <ViewModeContext.Provider value={viewMode}>
        <ArticleContext.Provider value={articleContext}>
          <TeamContext.Provider value={teamContext}>
            <Injects
              exerciseOrScenarioId={scenarioId}
              teams={teams}
              articles={articles}
              variables={variables}
              uriVariable={`/admin/scenarios/${scenarioId}/definition`}
              allUsersNumber={scenario.scenario_all_users_number}
              usersNumber={scenario.scenario_users_number}
              // @ts-expect-error typing
              teamsUsers={scenario.scenario_teams_users}
              setViewMode={handleViewMode}
              availableButtons={availableButtons}
            />
          </TeamContext.Provider>
        </ArticleContext.Provider>
      </ViewModeContext.Provider>
    </>

  );
};

export default ScenarioInjects;
