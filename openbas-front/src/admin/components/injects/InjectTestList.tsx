import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { type CSSProperties, type FunctionComponent, useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import PaginationComponent from '../../../components/common/pagination/PaginationComponent';
import SortHeadersComponent from '../../../components/common/pagination/SortHeadersComponent';
import { type Page } from '../../../components/common/queryable/Page';
import { buildSearchPagination } from '../../../components/common/queryable/QueryableUtils';
import Empty from '../../../components/Empty';
import { useFormatter } from '../../../components/i18n';
import ItemStatus from '../../../components/ItemStatus';
import { type InjectTestStatusOutput, type SearchPaginationInput } from '../../../utils/api-types';
import InjectIcon from '../common/injects/InjectIcon';
import InjectTestDetail from './InjectTestDetail';
import InjectTestPopover from './InjectTestPopover';
import InjectTestReplayAll from './InjectTestReplayAll';

const useStyles = makeStyles()(() => ({
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
  itemHead: {
    paddingLeft: 10,
    marginBottom: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
}));

const inlineStyles: Record<string, CSSProperties> = {
  inject_title: {
    width: '40%',
    cursor: 'default',
  },
  tracking_sent_date: {
    width: '40%',
  },
  status_name: {
    width: '20%',
  },
};

interface Props {
  searchInjectTests: (exerciseOrScenarioId: string, input: SearchPaginationInput) => Promise<{ data: Page<InjectTestStatusOutput> }>;
  searchInjectTest: (testId: string) => Promise<{ data: InjectTestStatusOutput }>;
  exerciseOrScenarioId: string;
  statusId: string | undefined;
}

const InjectTestList: FunctionComponent<Props> = ({
  searchInjectTests,
  searchInjectTest,
  exerciseOrScenarioId,
  statusId,
}) => {
  // Standard hooks
  const { classes } = useStyles();
  const { t, fldt } = useFormatter();

  const [selectedTest, setSelectedTest] = useState<InjectTestStatusOutput | null>(null);

  // Fetching test
  useEffect(() => {
    if (statusId !== null && statusId !== undefined) {
      searchInjectTest(statusId).then((result: { data: InjectTestStatusOutput }) => {
        setSelectedTest(result.data);
      });
    }
  }, [statusId]);

  // Headers
  const headers = [
    {
      field: 'inject_title',
      label: 'Inject title',
      isSortable: true,
      value: (test: InjectTestStatusOutput) => test.inject_title,
    },
    {
      field: 'tracking_sent_date',
      label: 'Test execution time',
      isSortable: true,
      value: (test: InjectTestStatusOutput) => fldt(test.tracking_sent_date),
    },
    {
      field: 'status_name',
      label: 'Test status',
      isSortable: true,
      value: (test: InjectTestStatusOutput) => {
        return (<ItemStatus isInject={true} status={test.status_name} label={t(test.status_name)} variant="inList" />);
      },
    },
  ];

  // Filter and sort hook
  const [tests, setTests] = useState<InjectTestStatusOutput[] | null>([]);
  const [searchPaginationInput, setSearchPaginationInput] = useState<SearchPaginationInput>(buildSearchPagination({}));

  return (
    <>
      <PaginationComponent
        fetch={input => searchInjectTests(exerciseOrScenarioId, input)}
        searchPaginationInput={searchPaginationInput}
        setContent={setTests}
      >
        <InjectTestReplayAll
          searchPaginationInput={searchPaginationInput}
          exerciseOrScenarioId={exerciseOrScenarioId}
          injectIds={tests?.map((test: InjectTestStatusOutput) => test.inject_id!)}
          onTest={result => setTests(result)}
        />
      </PaginationComponent>
      <List style={{ marginTop: 40 }}>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
          secondaryAction={<>&nbsp;</>}
        >
          <ListItemIcon />
          <ListItemText
            primary={(
              <SortHeadersComponent
                headers={headers}
                inlineStylesHeaders={inlineStyles}
                searchPaginationInput={searchPaginationInput}
                setSearchPaginationInput={setSearchPaginationInput}
                defaultSortAsc
              />
            )}
          />
        </ListItem>
        {tests?.map((test) => {
          return (
            <ListItem
              key={test.status_id}
              divider
              secondaryAction={(
                <InjectTestPopover
                  injectTest={test}
                  onTest={result =>
                    setTests(tests?.map(existing => existing.status_id !== result.status_id ? existing : result))}
                  onDelete={injectStatusId => setTests(tests.filter(existing => (existing.status_id !== injectStatusId)))}
                />
              )}
              disablePadding
            >
              <ListItemButton
                classes={{ root: classes.item }}
                onClick={() => setSelectedTest(test)}
                selected={test.status_id === selectedTest?.status_id}
              >
                <ListItemIcon>
                  <InjectIcon
                    type={test.inject_type}
                    variant="list"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={(
                    <div className={classes.bodyItems}>
                      {headers.map(header => (
                        <div
                          key={header.field}
                          className={classes.bodyItem}
                          style={inlineStyles[header.field]}
                        >
                          {header.value(test)}
                        </div>
                      ))}
                    </div>
                  )}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
        {!tests ? (<Empty message={t('No data available')} />) : null}
      </List>
      {
        selectedTest !== null
        && <InjectTestDetail open handleClose={() => setSelectedTest(null)} test={selectedTest} />
      }
    </>
  );
};

export default InjectTestList;
