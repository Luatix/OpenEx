import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { HubOutlined } from '@mui/icons-material';
import React, { CSSProperties, FunctionComponent, useState } from 'react';
import { makeStyles } from '@mui/styles';
import ExerciseStatus from './simulation/ExerciseStatus';
import ItemTags from '../../../components/ItemTags';
import { useFormatter } from '../../../components/i18n';
import type { ExerciseSimpleStore, ExerciseStore } from '../../../actions/exercises/Exercise';
import AtomicTestingResult from '../atomic_testings/atomic_testing/AtomicTestingResult';
import ItemTargets from '../../../components/ItemTargets';
import SortHeadersComponent from '../../../components/common/pagination/SortHeadersComponent';
import type { ExerciseSimple, SearchPaginationInput } from '../../../utils/api-types';
import useDataLoader from '../../../utils/hooks/useDataLoader';
import { fetchTags } from '../../../actions/Tag';
import { useAppDispatch } from '../../../utils/hooks';
import ExercisePopover from './simulation/ExercisePopover';

const useStyles = makeStyles(() => ({
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
}));

const getInlineStyles = (variant: string): Record<string, CSSProperties> => ({
  exercise_name: {
    width: variant === 'reduced-view' ? '15%' : '15%',
  },
  exercise_start_date: {
    width: variant === 'reduced-view' ? '12%' : '13%',
  },
  exercise_status: {
    width: variant === 'reduced-view' ? '12%' : '10%',
  },
  exercise_targets: {
    width: variant === 'reduced-view' ? '15%' : '17%',
  },
  exercise_global_score: {
    width: variant === 'reduced-view' ? '16%' : '10%',
  },
  exercise_tags: {
    width: variant === 'reduced-view' ? '14%' : '19%',
  },
  exercise_updated_at: {
    width: variant === 'reduced-view' ? '12%' : '13%',
  },
});

interface Props {
  exercises: ExerciseSimpleStore[];
  searchPaginationInput: SearchPaginationInput;
  setSearchPaginationInput: (datas: SearchPaginationInput) => void;
  hasHeader?: boolean;
  variant?: string,
}

const ExerciseList: FunctionComponent<Props> = ({
  exercises = [],
  searchPaginationInput,
  setSearchPaginationInput,
  hasHeader = true,
  variant = 'list',
}) => {
  // Standard hooks
  const dispatch = useAppDispatch();
  const classes = useStyles();
  const inlineStyles = getInlineStyles(variant);
  const { nsdt } = useFormatter();

  // Fetching data
  useDataLoader(() => {
    dispatch(fetchTags());
  });

  // Headers
  const headers = [
    {
      field: 'exercise_name',
      label: 'Name',
      isSortable: true,
      value: (exercise: ExerciseSimple) => exercise.exercise_name,
    },
    {
      field: 'exercise_start_date',
      label: 'Start date',
      isSortable: true,
      value: (exercise: ExerciseSimple) => (exercise.exercise_start_date ? (nsdt(exercise.exercise_start_date)) : ('-')),
    },
    {
      field: 'exercise_status',
      label: 'Status',
      isSortable: true,
      value: (exercise: ExerciseSimple) => <ExerciseStatus variant="list" exerciseStatus={exercise.exercise_status} />,
    },
    {
      field: 'exercise_targets',
      label: 'Target',
      isSortable: false,
      value: (exercise: ExerciseSimple) => <ItemTargets variant={variant} targets={exercise.exercise_targets} />,
    },
    {
      field: 'exercise_global_score',
      label: 'Global score',
      isSortable: false,
      value: (exercise: ExerciseSimple) => <AtomicTestingResult expectations={exercise.exercise_global_score} />,
    },
    {
      field: 'exercise_tags',
      label: 'Tags',
      isSortable: true,
      value: (exercise: ExerciseSimple) => <ItemTags variant={variant} tags={exercise.exercise_tags} />,
    },
    {
      field: 'exercise_updated_at',
      label: 'Updated',
      isSortable: true,
      value: (exercise: ExerciseSimple) => nsdt(exercise.exercise_updated_at),
    },
  ];

  // Duplicate
  const [openDuplicateId, setOpenDuplicateId] = useState<string | null>(null);
  const handleOpenDuplicate = (scenarioId: string) => {
    setOpenDuplicateId(scenarioId);
  };
  const handleCloseDuplicate = () => {
    setOpenDuplicateId(null);
  };

  // Export
  const [openExportId, setOpenExportId] = useState<string | null>(null);
  const handleOpenExport = (scenarioId: string) => {
    setOpenExportId(scenarioId);
  };
  const handleCloseExport = () => {
    setOpenExportId(null);
  };

  // Delete
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null);
  const handleOpenDelete = (scenarioId: string) => {
    setOpenDeleteId(scenarioId);
  };
  const handleCloseDelete = () => {
    setOpenDeleteId(null);
  };

  return (
    <List>
      {hasHeader
        && <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
           >
          <ListItemIcon />
          <ListItemText
            primary={
              <SortHeadersComponent
                headers={headers}
                inlineStylesHeaders={inlineStyles}
                searchPaginationInput={searchPaginationInput}
                setSearchPaginationInput={setSearchPaginationInput}
                defaultSortAsc={searchPaginationInput.sorts?.[0].direction === 'DESC'}
              />
            }
          />
        </ListItem>}
      {exercises.map((exercise: ExerciseStore) => (
        <ListItem
          key={exercise.exercise_id}
          classes={{ root: classes.item }}
          secondaryAction={
            <ExercisePopover
              exercise={exercise}
              entries={[
                { label: 'Duplicate', action: () => handleOpenDuplicate(exercise.exercise_id) },
                { label: 'Export', action: () => handleOpenExport(exercise.exercise_id) },
                { label: 'Delete', action: () => handleOpenDelete(exercise.exercise_id) },
              ]}
              openExport={openExportId === exercise.exercise_id}
              setOpenExport={handleCloseExport}
              openDuplicate={openDuplicateId === exercise.exercise_id}
              setOpenDuplicate={handleCloseDuplicate}
              openDelete={openDeleteId === exercise.exercise_id}
              setOpenDelete={handleCloseDelete}
              variantButtonPopover={'icon'}
            />
          }
          disablePadding={true}
        >
          <ListItemButton
            classes={{ root: classes.item }}
            divider
            href={`/admin/exercises/${exercise.exercise_id}`}
          >
            <ListItemIcon>
              <HubOutlined color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <div className={classes.bodyItems}>
                  {headers.map((header) => (
                    <div
                      key={header.field}
                      className={classes.bodyItem}
                      style={inlineStyles[header.field]}
                    >
                      {header.value(exercise)}
                    </div>
                  ))}
                </div>
              }
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default ExerciseList;
