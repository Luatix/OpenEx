import { ToggleButtonGroup } from '@mui/material';
import { useState } from 'react';

import { searchExercises } from '../../../actions/Exercise';
import { type ExercisesHelper } from '../../../actions/exercises/exercise-helper';
import { type UserHelper } from '../../../actions/helper';
import Breadcrumbs from '../../../components/Breadcrumbs';
import ExportButton from '../../../components/common/ExportButton';
import { buildEmptyFilter } from '../../../components/common/queryable/filter/FilterUtils';
import { initSorting } from '../../../components/common/queryable/Page';
import PaginationComponentV2 from '../../../components/common/queryable/pagination/PaginationComponentV2';
import { buildSearchPagination } from '../../../components/common/queryable/QueryableUtils';
import { useQueryableWithLocalStorage } from '../../../components/common/queryable/useQueryableWithLocalStorage';
import { useFormatter } from '../../../components/i18n';
import { useHelper } from '../../../store';
import { type ExerciseSimple, type FilterGroup, type SearchPaginationInput } from '../../../utils/api-types';
import ExerciseList from './ExerciseList';
import ImportUploaderExercise from './ImportUploaderExercise';
import ExerciseCreation from './simulation/ExerciseCreation';
import ExercisePopover from './simulation/ExercisePopover';

const Exercises = () => {
  // Standard hooks
  const { t } = useFormatter();

  // Fetching data
  const { userAdmin } = useHelper((helper: ExercisesHelper & UserHelper) => ({
    userAdmin: helper.getMe()?.user_admin ?? false,
  }));

  const [loading, setLoading] = useState<boolean>(true);
  const [exercises, setExercises] = useState<ExerciseSimple[]>([]);

  // Filters
  const availableFilterNames = [
    'exercise_kill_chain_phases',
    'exercise_name',
    'exercise_scenario',
    'exercise_start_date',
    'exercise_status',
    'exercise_tags',
    'exercise_updated_at',
  ];

  const quickFilter: FilterGroup = {
    mode: 'and',
    filters: [
      buildEmptyFilter('exercise_kill_chain_phases', 'contains'),
      buildEmptyFilter('exercise_scenario', 'contains'),
      buildEmptyFilter('exercise_tags', 'contains'),
    ],
  };
  const { queryableHelpers, searchPaginationInput } = useQueryableWithLocalStorage('simulations', buildSearchPagination({
    sorts: initSorting('exercise_updated_at', 'DESC'),
    filterGroup: quickFilter,
  }));

  // Export
  const exportProps = {
    exportType: 'exercise',
    exportKeys: [
      'exercise_name',
      'exercise_subtitle',
      'exercise_description',
      'exercise_status',
      'exercise_tags',
    ],
    exportData: exercises,
    exportFileName: `${t('Simulations')}.csv`,
  };

  const secondaryAction = (exercise: ExerciseSimple) => (
    <ExercisePopover
      // @ts-expect-error: should pass Exercise model IF we have update as action
      exercise={exercise}
      actions={['Duplicate', 'Export', 'Delete']}
      onDelete={result => setExercises(exercises.filter(e => (e.exercise_id !== result)))}
      inList
    />
  );

  const search = (input: SearchPaginationInput) => {
    setLoading(true);
    return searchExercises(input).finally(() => {
      setLoading(false);
    });
  };

  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Simulations'), current: true }]} />
      <PaginationComponentV2
        fetch={search}
        searchPaginationInput={searchPaginationInput}
        setContent={setExercises}
        entityPrefix="exercise"
        availableFilterNames={availableFilterNames}
        queryableHelpers={queryableHelpers}
        topBarButtons={(
          <ToggleButtonGroup value="fake" exclusive>
            <ExportButton totalElements={queryableHelpers.paginationHelpers.getTotalElements()} exportProps={exportProps} />
            <ImportUploaderExercise />
          </ToggleButtonGroup>
        )}
      />
      <ExerciseList
        exercises={exercises}
        queryableHelpers={queryableHelpers}
        secondaryAction={secondaryAction}
        loading={loading}
      />
      {userAdmin && <ExerciseCreation />}
    </>
  );
};

export default Exercises;
