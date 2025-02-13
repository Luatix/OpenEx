import { useParams } from 'react-router';

import { fetchExerciseArticles } from '../../../../../actions/channels/article-action';
import { type ArticlesHelper } from '../../../../../actions/channels/article-helper';
import { useHelper } from '../../../../../store';
import { type Exercise } from '../../../../../utils/api-types';
import { useAppDispatch } from '../../../../../utils/hooks';
import useDataLoader from '../../../../../utils/hooks/useDataLoader';
import Articles from '../../../common/articles/Articles';
import { ArticleContext } from '../../../common/Context';
import articleContextForExercise from './articleContextForExercise';

const ExerciseArticles = () => {
  // Standard hooks
  const dispatch = useAppDispatch();
  // Fetching data
  const { exerciseId } = useParams() as { exerciseId: Exercise['exercise_id'] };
  const articles = useHelper((helper: ArticlesHelper) => helper.getExerciseArticles(exerciseId));
  useDataLoader(() => {
    dispatch(fetchExerciseArticles(exerciseId));
  });
  const context = articleContextForExercise(exerciseId);
  return (
    <ArticleContext.Provider value={context}>
      <Articles articles={articles} />
    </ArticleContext.Provider>
  );
};

export default ExerciseArticles;
