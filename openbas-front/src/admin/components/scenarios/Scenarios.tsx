import { MovieFilterOutlined } from '@mui/icons-material';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, ToggleButtonGroup } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { CSSProperties, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchStatistics } from '../../../actions/Application';
import type { TagHelper, UserHelper } from '../../../actions/helper';
import type { ScenarioStore } from '../../../actions/scenarios/Scenario';
import { searchScenarios } from '../../../actions/scenarios/scenario-actions';
import Breadcrumbs from '../../../components/Breadcrumbs';
import ExportButton from '../../../components/common/ExportButton';
import { buildEmptyFilter } from '../../../components/common/queryable/filter/FilterUtils';
import { initSorting } from '../../../components/common/queryable/Page';
import PaginationComponentV2 from '../../../components/common/queryable/pagination/PaginationComponentV2';
import { buildSearchPagination } from '../../../components/common/queryable/QueryableUtils';
import SortHeadersComponentV2 from '../../../components/common/queryable/sort/SortHeadersComponentV2';
import { useQueryableWithLocalStorage } from '../../../components/common/queryable/useQueryableWithLocalStorage';
import { useFormatter } from '../../../components/i18n';
import ItemCategory from '../../../components/ItemCategory';
import ItemSeverity from '../../../components/ItemSeverity';
import ItemTags from '../../../components/ItemTags';
import PlatformIcon from '../../../components/PlatformIcon';
import { useHelper } from '../../../store';
import type { FilterGroup } from '../../../utils/api-types';
import { useAppDispatch } from '../../../utils/hooks';
import ImportUploaderScenario from './ImportUploaderScenario';
import ScenarioPopover from './scenario/ScenarioPopover';
import ScenarioStatus from './scenario/ScenarioStatus';
import ScenarioCreation from './ScenarioCreation';

const useStyles = makeStyles(() => ({
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
  scenario_name: {
    width: '25%',
  },
  scenario_severity: {
    width: '8%',
  },
  scenario_category: {
    width: '12%',
  },
  scenario_recurrence: {
    width: '12%',
  },
  scenario_platforms: {
    width: '10%',
  },
  scenario_tags: {
    width: '18%',
  },
  scenario_updated_at: {
    width: '10%',
  },
};

const Scenarios = () => {
  // Standard hooks
  const classes = useStyles();
  const { t, nsdt } = useFormatter();

  // Fetching data
  const { userAdmin } = useHelper((helper: TagHelper & UserHelper) => ({
    userAdmin: helper.getMe()?.user_admin ?? false,
  }));

  // Headers
  const headers = useMemo(() => [
    {
      field: 'scenario_name',
      label: 'Name',
      isSortable: true,
      value: (scenario: ScenarioStore) => scenario.scenario_name,
    },
    {
      field: 'scenario_severity',
      label: 'Severity',
      isSortable: true,
      value: (scenario: ScenarioStore) => (
        <ItemSeverity
          label={t(scenario.scenario_severity ?? 'Unknown')}
          severity={scenario.scenario_severity ?? 'Unknown'}
          variant="inList"
        />
      ),
    },
    {
      field: 'scenario_category',
      label: 'Category',
      isSortable: true,
      value: (scenario: ScenarioStore) => (
        <ItemCategory
          category={scenario.scenario_category ?? 'Unknown'}
          label={t(scenario.scenario_category ?? 'Unknown')}
          size="medium"
        />
      ),
    },
    {
      field: 'scenario_recurrence',
      label: 'Status',
      isSortable: false,
      value: (scenario: ScenarioStore) => <ScenarioStatus scenario={scenario} variant="list" />,
    },
    {
      field: 'scenario_platforms',
      label: 'Platforms',
      isSortable: false,
      value: (scenario: ScenarioStore) => {
        const platforms = scenario.scenario_platforms ?? [];
        if (platforms.length === 0) {
          return <PlatformIcon platform={t('No inject in this scenario')} tooltip width={25} />;
        }
        return platforms.map(
          (platform: string) => <PlatformIcon key={platform} platform={platform} tooltip width={20} marginRight={10} />,
        );
      },
    },
    {
      field: 'scenario_tags',
      label: 'Tags',
      isSortable: false,
      value: (scenario: ScenarioStore) => <ItemTags tags={scenario.scenario_tags} variant="list" />,
    },
    {
      field: 'scenario_updated_at',
      label: 'Updated',
      isSortable: true,
      value: (scenario: ScenarioStore) => nsdt(scenario.scenario_updated_at),
    },
  ], []);

  const [scenarios, setScenarios] = useState<ScenarioStore[]>([]);

  // Filters
  const availableFilterNames = [
    'scenario_category',
    'scenario_kill_chain_phases',
    'scenario_name',
    'scenario_platforms',
    'scenario_recurrence',
    'scenario_severity',
    'scenario_tags',
    'scenario_updated_at',
  ];

  const quickFilter: FilterGroup = {
    mode: 'and',
    filters: [
      buildEmptyFilter('scenario_category', 'contains'),
      buildEmptyFilter('scenario_kill_chain_phases', 'contains'),
      buildEmptyFilter('scenario_tags', 'contains'),
    ],
  };

  const { queryableHelpers, searchPaginationInput } = useQueryableWithLocalStorage('scenarios', buildSearchPagination({
    sorts: initSorting('scenario_updated_at', 'DESC'),
    filterGroup: quickFilter,
  }));

  // Export
  const exportProps = {
    exportType: 'scenario',
    exportKeys: [
      'scenario_name',
      'scenario_severity',
      'scenario_category',
      'scenario_main_focus',
      'scenario_platforms',
      'scenario_tags',
      'scenario_updated_at',
    ],
    exportData: scenarios,
    exportFileName: `${t('Scenarios')}.csv`,
  };

  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Scenarios'), current: true }]} />
      <PaginationComponentV2
        fetch={searchScenarios}
        searchPaginationInput={searchPaginationInput}
        setContent={setScenarios}
        entityPrefix="scenario"
        availableFilterNames={availableFilterNames}
        queryableHelpers={queryableHelpers}
        topBarButtons={(
          <ToggleButtonGroup value="fake" exclusive>
            <ExportButton totalElements={queryableHelpers.paginationHelpers.getTotalElements()} exportProps={exportProps} />
            <ImportUploaderScenario />
          </ToggleButtonGroup>
        )}
      />
      <List>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
          secondaryAction={<>&nbsp;</>}
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
        {scenarios.map((scenario: ScenarioStore) => {
          return (
            <ListItem
              key={scenario.scenario_id}
              divider
              secondaryAction={(
                <ScenarioPopover
                  scenario={scenario}
                  actions={['Duplicate', 'Export', 'Delete']}
                  onDelete={result => setScenarios(scenarios.filter(e => (e.scenario_id !== result)))}
                  inList
                />
              )}
              disablePadding
            >
              <ListItemButton
                component={Link}
                to={`/admin/scenarios/${scenario.scenario_id}`}
                classes={{ root: classes.item }}
              >
                <ListItemIcon>
                  <MovieFilterOutlined color="primary" />
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
                          {header.value(scenario)}
                        </div>
                      ))}
                    </div>
                  )}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      {userAdmin && (
        <ScenarioCreation
          onCreate={(result: ScenarioStore) => {
            setScenarios([result, ...scenarios]);
            fetchStatistics();
          }}
        />
      )}
    </>
  );
};

export default Scenarios;
