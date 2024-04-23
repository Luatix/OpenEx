import React from 'react';
import { useFormatter } from '../../../components/i18n';
import { fetchExercises } from '../../../actions/Exercise';
import { useHelper } from '../../../store';
import useDataLoader from '../../../utils/ServerSideEvent';
import Breadcrumbs from '../../../components/Breadcrumbs';
import ExerciseCreation from './ExerciseCreation';
import ExerciseList from './ExerciseList';
import { useAppDispatch } from '../../../utils/hooks';
import type { ExercisesHelper } from '../../../actions/exercises/exercise-helper';
import type { UsersHelper } from '../../../actions/helper';

const Exercises = () => {
  // Standard hooks
  const dispatch = useAppDispatch();
  const { t } = useFormatter();

  // Fetching data
  const { exercises, userAdmin } = useHelper((helper: ExercisesHelper & UsersHelper) => ({
    exercises: helper.getExercises(),
    userAdmin: helper.getMe()?.user_admin ?? false,
  }));

  useDataLoader(() => {
    dispatch(fetchExercises());
  });

  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Simulations'), current: true }]} />
      <ExerciseList exercises={exercises} />
      {userAdmin && <ExerciseCreation />}
    </>
  );
};

export default Exercises;
