import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryParameter } from '../../../utils/Environment';
import LessonsPlayer from './LessonsPlayer';
import LessonsPreview from './LessonsPreview';
import { usePermissions } from '../../../utils/Exercise';
import { fetchMe } from '../../../actions/Application';
import { fetchExercise, fetchPlayerExercise } from '../../../actions/Exercise';
import {
  addLessonsAnswers,
  fetchLessonsCategories,
  fetchLessonsQuestions,
  fetchPlayerLessonsAnswers,
  fetchPlayerLessonsCategories,
  fetchPlayerLessonsQuestions,
} from '../../../actions/exercises/exercise-action';
import { ViewLessonContext, ViewLessonContextType } from '../../../admin/components/common/Context';
import { useAppDispatch } from '../../../utils/hooks';
import type { Exercise } from '../../../utils/api-types';
import type { ExercisesHelper } from '../../../actions/exercises/exercise-helper';
import type { UserHelper } from '../../../actions/helper';
import type { ExerciseStore } from '../../../actions/exercises/Exercise';
import { useHelper } from '../../../store';

const ExerciseViewLessons = () => {
  const dispatch = useAppDispatch();
  const [preview] = useQueryParameter(['preview']);
  const [userId] = useQueryParameter(['user']);
  const { exerciseId } = useParams() as { exerciseId: Exercise['exercise_id'] };

  const processToGenericSource = (exercise: ExerciseStore) => {
    return {
      id: exerciseId,
      type: 'exercise',
      name: exercise.exercise_name,
      subtitle: exercise.exercise_subtitle,
      userId,
    };
  };
  const {
    me,
    exercise,
    source,
    lessonsCategories,
    lessonsQuestions,
    lessonsAnswers,
  } = useHelper((helper: ExercisesHelper & UserHelper) => {
    const currentUser = helper.getMe();
    return {
      me: currentUser,
      exercise: helper.getExercise(exerciseId),
      source: processToGenericSource(helper.getExercise(exerciseId)),
      lessonsCategories: helper.getExerciseLessonsCategories(exerciseId),
      lessonsQuestions: helper.getExerciseLessonsQuestions(exerciseId),
      lessonsAnswers: helper.getExerciseUserLessonsAnswers(
        exerciseId,
        userId && userId !== 'null' ? userId : currentUser?.user_id,
      ),
    };
  });
  const finalUserId = userId && userId !== 'null' ? userId : me?.user_id;

  useEffect(() => {
    console.log('in hook');
    dispatch(fetchMe());
    dispatch(fetchPlayerExercise(exerciseId, userId));
    dispatch(fetchPlayerLessonsCategories(exerciseId, finalUserId));
    dispatch(fetchPlayerLessonsQuestions(exerciseId, finalUserId));
    dispatch(fetchPlayerLessonsAnswers(exerciseId, finalUserId));
    dispatch(fetchLessonsCategories(exerciseId));
    dispatch(fetchLessonsQuestions(exerciseId));
  }, [exerciseId]);
  // Pass the full exercise because the exercise is never loaded in the store at this point
  const permissions = usePermissions(exerciseId, exercise);
  const context: ViewLessonContextType = {
    onAddLessonsAnswers: (questionCategory, lessonsQuestionId, answerData) => dispatch(
      addLessonsAnswers(
        exerciseId,
        questionCategory,
        lessonsQuestionId,
        answerData,
        finalUserId,
      ),
    ),
    onFetchPlayerLessonsAnswers: () => dispatch(fetchPlayerLessonsAnswers(exerciseId, finalUserId)),
  };

  return (
    <ViewLessonContext.Provider value={context}>
      {preview === 'true' ? (
        <LessonsPreview
          source={{ ...source, finalUserId }}
          lessonsCategories={lessonsCategories}
          lessonsQuestions={lessonsQuestions}
          lessonsAnswers={lessonsAnswers}
          permissions={permissions}
        />
      ) : (
        <LessonsPlayer
          source={{ ...source, finalUserId }}
          lessonsCategories={lessonsCategories}
          lessonsQuestions={lessonsQuestions}
          lessonsAnswers={lessonsAnswers}
          permissions={permissions}
        />
      )}
    </ViewLessonContext.Provider>
  );
};

export default ExerciseViewLessons;
