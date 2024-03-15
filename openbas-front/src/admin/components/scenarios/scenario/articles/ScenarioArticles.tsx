import { useParams } from 'react-router-dom';
import React from 'react';
import { useHelper } from '../../../../../store';
import useDataLoader from '../../../../../utils/ServerSideEvent';
import { addScenarioArticle, deleteScenarioArticle, fetchScenarioArticles, updateScenarioArticle } from '../../../../../actions/channels/article-action';
import Articles from '../../../components/articles/Articles';
import { useAppDispatch } from '../../../../../utils/hooks';
import DefinitionMenu from '../../../components/DefinitionMenu';
import type { ArticlesHelper } from '../../../../../actions/channels/article-helper';
import type { ScenarioStore } from '../../../../../actions/scenarios/Scenario';
import type { ArticleStore, FullArticleStore } from '../../../../../actions/channels/Article';
import type { ArticleCreateInput, ArticleUpdateInput } from '../../../../../utils/api-types';
import { ArticleContext } from '../../../components/Context';

export const articleContextForScenario = (scenarioId: ScenarioStore['scenario_id']) => {
  const dispatch = useAppDispatch();

  return {
    previewArticleUrl: (article: FullArticleStore) => `/channels/${scenarioId}/${article.article_fullchannel.channel_id}?preview=true`,
    onAddArticle: (data: ArticleCreateInput) => dispatch(addScenarioArticle(scenarioId, data)),
    onUpdateArticle: (article: ArticleStore, data: ArticleUpdateInput) => dispatch(
      updateScenarioArticle(scenarioId, article.article_id, data),
    ),
    onDeleteArticle: (article: ArticleStore) => dispatch(
      deleteScenarioArticle(scenarioId, article.article_id),
    ),
  };
};

const ScenarioArticles = () => {
  // Standard hooks
  const dispatch = useAppDispatch();
  // Fetching data
  const { scenarioId } = useParams() as { scenarioId: ScenarioStore['scenario_id'] };
  const articles = useHelper((helper: ArticlesHelper) => helper.getScenarioArticles(scenarioId));
  useDataLoader(() => {
    dispatch(fetchScenarioArticles(scenarioId));
  });

  const context = articleContextForScenario(scenarioId);

  return (
    <ArticleContext.Provider value={context}>
      <DefinitionMenu base="/admin/scenarios" id={scenarioId} />
      <Articles articles={articles} />
    </ArticleContext.Provider>
  );
};

export default ScenarioArticles;
