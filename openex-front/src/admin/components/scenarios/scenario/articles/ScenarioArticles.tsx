import { makeStyles } from '@mui/styles';
import { useParams } from 'react-router-dom';
import React from 'react';
import { useHelper } from '../../../../../store';
import useDataLoader from '../../../../../utils/ServerSideEvent';
import { fetchScenarioArticles } from '../../../../../actions/channels/article-action';
import ExerciseOrScenarioContext from '../../../../ExerciseOrScenarioContext';
import Articles from '../../../components/articles/Articles';
import type { ScenariosHelper } from '../../../../../actions/scenarios/scenario-helper';
import { useAppDispatch } from '../../../../../utils/hooks';
import DefinitionMenu from '../../../components/DefinitionMenu';
import type { ArticlesHelper } from '../../../../../actions/channels/article-helper';
import type { ScenarioStore } from '../../../../../actions/scenarios/Scenario';

const useStyles = makeStyles(() => ({
  container: {
    margin: '10px 0 50px 0',
    padding: '0 200px 0 0',
  },
}));

const ScenarioArticles = () => {
  // Standard hooks
  const classes = useStyles();
  const dispatch = useAppDispatch();
  // Fetching data
  const { scenarioId } = useParams() as { scenarioId: ScenarioStore['scenario_id'] };
  const { scenario, articles } = useHelper((helper: ScenariosHelper & ArticlesHelper) => ({
    scenario: helper.getScenario(scenarioId),
    articles: helper.getScenarioArticles(scenarioId),
  }));
  useDataLoader(() => {
    dispatch(fetchScenarioArticles(scenarioId));
  });
  return (
    <div className={classes.container}>
      <DefinitionMenu base="/admin/scenarios" id={scenarioId} />
      <ExerciseOrScenarioContext.Provider value={{ scenario }}>
        <Articles articles={articles} />
      </ExerciseOrScenarioContext.Provider>
    </div>
  );
};

export default ScenarioArticles;
