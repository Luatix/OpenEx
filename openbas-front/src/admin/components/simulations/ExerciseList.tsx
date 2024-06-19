import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, ToggleButtonGroup } from '@mui/material';
import * as R from 'ramda';
import { Link } from 'react-router-dom';
import { KeyboardArrowRight, HubOutlined } from '@mui/icons-material';
import React, { CSSProperties, FunctionComponent } from 'react';
import { makeStyles } from '@mui/styles';
import ExerciseStatus from './simulation/ExerciseStatus';
import ItemTags from '../../../components/ItemTags';
import SearchFilter from '../../../components/SearchFilter';
import TagsFilter from '../common/filters/TagsFilter';
import useSearchAnFilter from '../../../utils/SortingFiltering';
import { useFormatter } from '../../../components/i18n';
import type { ExerciseSimpleStore, ExerciseStore } from '../../../actions/exercises/Exercise';
import AtomicTestingResult from '../atomic_testings/atomic_testing/AtomicTestingResult';
import ItemTargets from '../../../components/ItemTargets';
import ImportUploaderExercise from './ImportUploaderExercise';
import ExportButton from '../../../components/common/ExportButton';
import ExercisePopover from "./simulation/ExercisePopover";

const useStyles = makeStyles(() => ({
  parameters: {
    marginTop: -10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filters: {
    display: 'flex',
    gap: '10px',
  },
  itemHead: {
    paddingLeft: 17,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    height: 50,
  },
  bodyItems: {
    display: 'flex',
    alignItems: 'center',
  },
  bodyItem: {
    height: 20,
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 10,
  },
  goIcon: {
    position: 'absolute',
    right: -10,
  },
  actionsButton: {
    display: 'flex',
    alignItems: 'center',
  },
}));

const headerStyles: Record<string, CSSProperties> = {
  iconSort: {
    position: 'absolute',
    margin: '0 0 0 5px',
    padding: 0,
    top: '0px',
  },
  exercise_name: {
    width: '20%',
    fontSize: 12,
    fontWeight: '700',
  },
  exercise_start_date: {
    width: '15%',
    fontSize: 12,
    fontWeight: '700',
  },
  exercise_status: {
    width: '10%',
    fontSize: 12,
    fontWeight: '700',
  },
  exercise_tags: {
    width: '15%',
    fontSize: 12,
    fontWeight: '700',
  },
  exercise_targets: {
    width: '20%',
    fontSize: 12,
    fontWeight: '700',
    cursor: 'default',
  },
  exercise_global_score: {
    width: '20%',
    fontSize: 12,
    fontWeight: '700',
    cursor: 'default',
  },
};

const inlineStyles: Record<string, CSSProperties> = {
  exercise_name: {
    width: '20%',
  },
  exercise_start_date: {
    width: '15%',
  },
  exercise_status: {
    width: '10%',
  },
  exercise_tags: {
    width: '15%',
  },
  exercise_targets: {
    width: '20%',
  },
  exercise_global_score: {
    width: '20%',
  },
};

interface Props {
  exercises: ExerciseSimpleStore[];
  withoutSearch?: boolean;
  limit?: number;
}

const ExerciseList: FunctionComponent<Props> = ({
  exercises = [],
  withoutSearch,
  limit,
}) => {
  // Standard hooks
  const classes = useStyles();
  const { t, nsdt } = useFormatter();

  // Fetching data
  const searchColumns = ['name'];
  const filtering = useSearchAnFilter('exercise', 'start_date', searchColumns, { orderAsc: false });
  const sortedExercises = limit ? R.take(limit, filtering.filterAndSort(exercises)) : filtering.filterAndSort(exercises);

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
  return (
    <>
      {!withoutSearch && (
        <div className={classes.parameters}>
          <div className={classes.filters}>
            <SearchFilter
              variant="small"
              onChange={filtering.handleSearch}
              keyword={filtering.keyword}
            />
            <TagsFilter
              onAddTag={filtering.handleAddTag}
              onRemoveTag={filtering.handleRemoveTag}
              currentTags={filtering.tags}
            />
          </div>
          <div className={classes.actionsButton}>
            <ToggleButtonGroup value='fake' exclusive={true}>
              <ExportButton totalElements={sortedExercises.length} exportProps={exportProps} />
              <ImportUploaderExercise color={'primary'} />
            </ToggleButtonGroup>
          </div>
        </div>
      )}
      <div className="clearfix" />
      <List>
        {!limit && (
          <ListItem
            classes={{ root: classes.itemHead }}
            divider={false}
            style={{ paddingTop: 0 }}
          >
            <ListItemIcon />
            <ListItemText
              primary={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {filtering.buildHeader(
                    'exercise_name',
                    'Name',
                    true,
                    headerStyles,
                  )}
                  {filtering.buildHeader(
                    'exercise_start_date',
                    'Start date',
                    true,
                    headerStyles,
                  )}
                  {filtering.buildHeader(
                    'exercise_status',
                    'Status',
                    true,
                    headerStyles,
                  )}
                  {filtering.buildHeader(
                    'exercise_tags',
                    'Tags',
                    true,
                    headerStyles,
                  )}
                  {filtering.buildHeader(
                    'exercise_targets',
                    'Target',
                    false,
                    headerStyles,
                  )}
                  {filtering.buildHeader(
                    'exercise_global_score',
                    'Global score',
                    false,
                    headerStyles,
                  )}
                </div>
              }
            />
          </ListItem>
        )}
        {sortedExercises.map((exercise: ExerciseStore) => (
          <ListItemButton
            key={exercise.exercise_id}
            classes={{ root: classes.item }}
            divider={true}
            component={Link}
            to={`/admin/exercises/${exercise.exercise_id}`}
          >
            <ListItemIcon>
              <HubOutlined color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <div className={classes.bodyItems}>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.exercise_name}
                  >
                    {exercise.exercise_name}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.exercise_start_date}
                  >
                    {exercise.exercise_start_date ? (
                      nsdt(exercise.exercise_start_date)
                    ) : (
                      '-'
                    )}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.exercise_status}
                  >
                    <ExerciseStatus
                      variant="list"
                      exerciseStatus={exercise.exercise_status}
                    />
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.exercise_tags}
                  >
                    <ItemTags variant="list" tags={exercise.exercise_tags} />
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.exercise_targets}
                  >
                    <ItemTargets targets={exercise.exercise_targets} />
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.exercise_global_score}
                  >
                    <AtomicTestingResult expectations={exercise.exercise_global_score} />
                  </div>
                </div>
              }
            />
            <ListItemIcon classes={{ root: classes.goIcon }}>
              <ExercisePopover exercise={exercise} />
            </ListItemIcon>
          </ListItemButton>
        ))}
      </List>
    </>
  );
};

export default ExerciseList;
