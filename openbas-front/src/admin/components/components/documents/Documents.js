import { DescriptionOutlined, RowingOutlined } from '@mui/icons-material';
import { Chip, List, ListItem, ListItemButton, ListItemIcon, ListItemSecondaryAction, ListItemText, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import * as R from 'ramda';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

import { searchDocuments } from '../../../../actions/Document';
import { fetchExercises } from '../../../../actions/Exercise';
import { fetchScenarios } from '../../../../actions/scenarios/scenario-actions';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import PaginationComponent from '../../../../components/common/pagination/PaginationComponent';
import SortHeadersComponent from '../../../../components/common/pagination/SortHeadersComponent';
import { initSorting } from '../../../../components/common/queryable/Page';
import { useFormatter } from '../../../../components/i18n';
import ItemTags from '../../../../components/ItemTags';
import { useHelper } from '../../../../store';
import useDataLoader from '../../../../utils/hooks/useDataLoader';
import CreateDocument from './CreateDocument';
import DocumentPopover from './DocumentPopover';
import DocumentType from './DocumentType';

const useStyles = makeStyles(() => ({
  itemHead: {
    paddingLeft: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
  bodyItems: {
    display: 'flex',
    alignItems: 'center',
  },
  bodyItem: {
    fontSize: 13,
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  exercise: {
    fontSize: 12,
    height: 20,
    float: 'left',
    marginRight: 7,
    width: 120,
  },
  scenario: {
    fontSize: 12,
    height: 20,
    float: 'left',
    marginRight: 7,
    width: 120,
  },
}));

const inlineStyles = {
  document_name: {
    width: '20%',
  },
  document_description: {
    width: '15%',
  },
  document_exercises: {
    width: '20%',
    cursor: 'default',
  },
  document_scenarios: {
    width: '20%',
    cursor: 'default',
  },
  document_type: {
    width: '12%',
  },
  document_tags: {
    width: '13%',
  },
};

const Documents = () => {
  // Standard hooks
  const classes = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useFormatter();
  const { exercisesMap, scenariosMap, userAdmin } = useHelper(helper => ({
    exercisesMap: helper.getExercisesMap(),
    scenariosMap: helper.getScenariosMap(),
    userAdmin: helper.getMe()?.user_admin ?? false,
  }));
  useDataLoader(() => {
    dispatch(fetchExercises());
    dispatch(fetchScenarios());
  });

  // Headers
  const headers = [
    { field: 'document_name', label: 'Name', isSortable: true },
    { field: 'document_description', label: 'Description', isSortable: true },
    { field: 'document_exercises', label: 'Simulations', isSortable: false },
    { field: 'document_scenarios', label: 'Scenarios', isSortable: false },
    { field: 'document_type', label: 'Type', isSortable: true },
    { field: 'document_tags', label: 'Tags', isSortable: true },
  ];

  const [documents, setDocuments] = useState([]);
  const [searchPaginationInput, setSearchPaginationInput] = useState({
    sorts: initSorting('document_name'),
  });

  // Export
  const exportProps = {
    exportType: 'tags',
    exportKeys: [
      'document_name',
      'document_description',
      'document_type',
    ],
    exportData: documents,
    exportFileName: `${t('Documents')}.csv`,
  };

  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Components') }, { label: t('Documents'), current: true }]} />
      <PaginationComponent
        fetch={searchDocuments}
        searchPaginationInput={searchPaginationInput}
        setContent={setDocuments}
        exportProps={exportProps}
      />
      <List>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
        >
          <ListItemIcon>
            <span
              style={{
                padding: '0 8px 0 8px',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
            &nbsp;
            </span>
          </ListItemIcon>
          <ListItemText
            primary={(
              <SortHeadersComponent
                headers={headers}
                inlineStylesHeaders={inlineStyles}
                searchPaginationInput={searchPaginationInput}
                setSearchPaginationInput={setSearchPaginationInput}
              />
            )}
          />
          <ListItemSecondaryAction> &nbsp; </ListItemSecondaryAction>
        </ListItem>
        {documents.map(document => (
          <ListItem
            key={document.document_id}
            divider={true}
            secondaryAction={(
              <DocumentPopover
                document={document}
                disabled={!userAdmin}
                onUpdate={result => setDocuments(documents.map(d => (d.document_id !== result.document_id ? d : result)))}
                onDelete={result => setDocuments(documents.filter(d => (d.document_id !== result)))}
                scenariosAndExercisesFetched
                inList
              />
            )}
            disablePadding
          >
            <ListItemButton
              classes={{ root: classes.item }}
              component="a"
              href={`/api/documents/${document.document_id}/file`}
            >
              <ListItemIcon>
                <DescriptionOutlined color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={(
                  <div className={classes.bodyItems}>
                    <div
                      className={classes.bodyItem}
                      style={inlineStyles.document_name}
                    >
                      {document.document_name}
                    </div>
                    <div
                      className={classes.bodyItem}
                      style={inlineStyles.document_description}
                    >
                      {document.document_description}
                    </div>
                    <div
                      className={classes.bodyItem}
                      style={inlineStyles.document_exercises}
                    >
                      {R.take(3, document.document_exercises).map((e, i) => {
                        const exercise = exercisesMap[e];
                        if (exercise === undefined) return <div key={i} />;
                        return (
                          <Tooltip
                            key={i}
                            title={exercise.exercise_name}
                          >
                            <Chip
                              icon={<RowingOutlined style={{ fontSize: 12 }} />}
                              classes={{ root: classes.exercise }}
                              variant="outlined"
                              label={exercise.exercise_name}
                              clickable={true}
                              onClick={
                                (event) => {
                                  // prevent parent link from triggering
                                  event.stopPropagation();
                                  event.preventDefault();
                                  navigate(`/admin/simulations/${exercise.exercise_id}`);
                                }
                              }
                            />
                          </Tooltip>
                        );
                      })}
                    </div>
                    <div
                      className={classes.bodyItem}
                      style={inlineStyles.document_scenarios}
                    >
                      {R.take(3, document.document_scenarios).map((e, i) => {
                        const scenario = scenariosMap[e];
                        if (scenario === undefined) return <div key={i} />;
                        return (
                          <Tooltip
                            key={i}
                            title={scenario.scenario_name}
                          >
                            <Chip
                              icon={<RowingOutlined style={{ fontSize: 12 }} />}
                              classes={{ root: classes.scenario }}
                              variant="outlined"
                              label={scenario.scenario_name}
                              clickable={true}
                              onClick={
                                (event) => {
                                  // prevent parent link from triggering
                                  event.stopPropagation();
                                  event.preventDefault();
                                  navigate(`/admin/scenarios/${scenario.scenario_id}`);
                                }
                              }
                            />
                          </Tooltip>
                        );
                      })}
                    </div>
                    <div
                      className={classes.bodyItem}
                      style={inlineStyles.document_type}
                    >
                      <DocumentType
                        type={document.document_type}
                        variant="list"
                      />
                    </div>
                    <div
                      className={classes.bodyItem}
                      style={inlineStyles.document_tags}
                    >
                      <ItemTags variant="list" tags={document.document_tags} />
                    </div>
                  </div>
                )}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {userAdmin && (
        <CreateDocument
          onCreate={result => setDocuments([result, ...documents])}
        />
      )}
    </>
  );
};

export default Documents;
