import { HelpOutlineOutlined } from '@mui/icons-material';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { CSSProperties, FunctionComponent, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { type Page } from '../../../components/common/queryable/Page';
import PaginationComponentV2 from '../../../components/common/queryable/pagination/PaginationComponentV2';
import { QueryableHelpers } from '../../../components/common/queryable/QueryableHelpers';
import SortHeadersComponentV2 from '../../../components/common/queryable/sort/SortHeadersComponentV2';
import { Header } from '../../../components/common/SortHeadersList';
import Empty from '../../../components/Empty';
import { useFormatter } from '../../../components/i18n';
import ItemStatus from '../../../components/ItemStatus';
import ItemTargets from '../../../components/ItemTargets';
import PaginatedListLoader from '../../../components/PaginatedListLoader';
import type { InjectResultOutput, SearchPaginationInput } from '../../../utils/api-types';
import { isNotEmptyField } from '../../../utils/utils';
import InjectIcon from '../common/injects/InjectIcon';
import InjectorContract from '../common/injects/InjectorContract';
import AtomicTestingPopover from './atomic_testing/AtomicTestingPopover';
import AtomicTestingResult from './atomic_testing/AtomicTestingResult';

const useStyles = makeStyles()(() => ({
  itemHead: {
    textTransform: 'uppercase',
  },
  item: {
    height: 50,
  },
  bodyItems: {
    display: 'flex',
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

const inlineStyles: Record<string, CSSProperties> = {
  'inject_type': {
    width: '10%',
  },
  'inject_title': {
    width: '20%',
  },
  'inject_status.tracking_sent_date': {
    width: '15%',
  },
  'inject_status': {
    width: '10%',
  },
  'inject_targets': {
    width: '20%',
  },
  'inject_expectations': {
    width: '10%',
  },
  'inject_updated_at': {
    width: '15%',
  },
};

interface Props {
  showActions?: boolean;
  fetchInjects: (input: SearchPaginationInput) => Promise<{ data: Page<InjectResultOutput> }>;
  goTo: (injectId: string) => string;
  queryableHelpers: QueryableHelpers;
  searchPaginationInput: SearchPaginationInput;
  availableFilterNames?: string[];
}

const InjectResultList: FunctionComponent<Props> = ({
  showActions,
  fetchInjects,
  goTo,
  queryableHelpers,
  searchPaginationInput,
}) => {
  // Standard hooks
  const { classes } = useStyles();
  const { t, fldt, tPick, nsdt } = useFormatter();

  const [loading, setLoading] = useState<boolean>(true);

  // Filter and sort hook
  const availableFilterNames = [
    'inject_kill_chain_phases',
    'inject_tags',
    'inject_title',
    'inject_type',
    'inject_updated_at',
  ];
  const [injects, setInjects] = useState<InjectResultOutput[]>([]);

  // Headers
  const headers: Header[] = useMemo(() => [
    {
      field: 'inject_type',
      label: 'Type',
      isSortable: false,
      value: (injectResultOutput: InjectResultOutput) => {
        if (injectResultOutput.inject_injector_contract) {
          return (
            <InjectorContract variant="list" label={tPick(injectResultOutput.inject_injector_contract?.injector_contract_labels)} />
          );
        }
        return <InjectorContract variant="list" label={t('Deleted')} deleted={true} />;
      },
    },
    {
      field: 'inject_title',
      label: 'Title',
      isSortable: true,
      value: (injectResultOutput: InjectResultOutput) => {
        return <>{injectResultOutput.inject_title}</>;
      },
    },
    {
      field: 'inject_status.tracking_sent_date',
      label: 'Execution Date',
      isSortable: false,
      value: (injectResultOutput: InjectResultOutput) => {
        return <>{fldt(injectResultOutput.inject_status?.tracking_sent_date)}</>;
      },
    },
    {
      field: 'inject_status',
      label: 'Execution status',
      isSortable: false,
      value: (injectResultOutput: InjectResultOutput) => {
        return (<ItemStatus isInject status={injectResultOutput.inject_status?.status_name} label={t(injectResultOutput.inject_status?.status_name)} variant="inList" />);
      },
    },
    {
      field: 'inject_targets',
      label: 'Target',
      isSortable: false,
      value: (injectResultOutput: InjectResultOutput) => {
        return (<ItemTargets targets={injectResultOutput.inject_targets} />);
      },
    },
    {
      field: 'inject_expectations',
      label: 'Global score',
      isSortable: false,
      value: (injectResultOutput: InjectResultOutput) => {
        return (
          <AtomicTestingResult expectations={injectResultOutput.inject_expectation_results} />
        );
      },
    },
    {
      field: 'inject_updated_at',
      label: 'Updated',
      isSortable: true,
      value: (injectResultOutput: InjectResultOutput) => {
        return <>{nsdt(injectResultOutput.inject_updated_at)}</>;
      },
    },
  ], []);

  const search = (input: SearchPaginationInput) => {
    setLoading(true);
    return fetchInjects(input).finally(() => setLoading(false));
  };

  return (
    <>
      <PaginationComponentV2
        fetch={search}
        searchPaginationInput={searchPaginationInput}
        setContent={setInjects}
        entityPrefix="inject"
        availableFilterNames={availableFilterNames}
        queryableHelpers={queryableHelpers}
      />
      <List>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
          secondaryAction={showActions ? <>&nbsp;</> : null}
        >
          <ListItemIcon />
          <ListItemText
            primary={(
              <SortHeadersComponentV2
                headers={headers}
                inlineStylesHeaders={inlineStyles}
                sortHelpers={queryableHelpers.sortHelpers}
              />
            )}
          />
        </ListItem>
        {
          loading
            ? <PaginatedListLoader Icon={HelpOutlineOutlined} headers={headers} headerStyles={inlineStyles} />
            : injects.map((injectResultOutput, index) => {
                return (
                  <ListItem
                    key={injectResultOutput.inject_id}
                    classes={{ root: classes.item }}
                    divider={injects.length !== index + 1}
                    secondaryAction={showActions ? (
                      <AtomicTestingPopover
                        atomic={injectResultOutput}
                        actions={['Duplicate', 'Export', 'Delete']}
                        onDelete={result => setInjects(injects.filter(e => e.inject_id !== result))}
                        inList
                      />
                    ) : null}
                    disablePadding
                  >
                    <ListItemButton
                      component={Link}
                      to={goTo(injectResultOutput.inject_id)}
                    >
                      <ListItemIcon>
                        <InjectIcon
                          isPayload={isNotEmptyField(injectResultOutput.inject_injector_contract?.injector_contract_payload?.payload_id)}
                          type={
                            injectResultOutput.inject_injector_contract?.injector_contract_payload?.payload_id
                              ? injectResultOutput.inject_injector_contract.injector_contract_payload?.payload_collector_type
                              || injectResultOutput.inject_injector_contract.injector_contract_payload?.payload_type
                              : injectResultOutput.inject_type
                          }
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
                                {header.value?.(injectResultOutput)}
                              </div>
                            ))}
                          </div>
                        )}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })
        }
        {!injects ? (<Empty message={t('No data available')} />) : null}
      </List>
    </>
  );
};

export default InjectResultList;
