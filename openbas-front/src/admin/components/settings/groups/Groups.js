import React, { useState } from 'react';
import { makeStyles } from '@mui/styles';
import { List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, Tooltip } from '@mui/material';
import { useDispatch } from 'react-redux';
import { CheckCircleOutlined, GroupsOutlined } from '@mui/icons-material';
import { useFormatter } from '../../../../components/i18n';
import { fetchUsers } from '../../../../actions/User';
import { fetchOrganizations } from '../../../../actions/Organization';
import CreateGroup from './CreateGroup';
import { searchGroups } from '../../../../actions/Group';
import { fetchExercises } from '../../../../actions/Exercise';
import { fetchTags } from '../../../../actions/Tag';
import GroupPopover from './GroupPopover';
import SecurityMenu from '../SecurityMenu';
import { fetchScenarios } from '../../../../actions/scenarios/scenario-actions';
import useDataLoader from '../../../../utils/ServerSideEvent';
import { initSorting } from '../../../../components/common/pagination/Page';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import PaginationComponent from '../../../../components/common/pagination/PaginationComponent';
import SortHeadersComponent from '../../../../components/common/pagination/SortHeadersComponent';

const useStyles = makeStyles(() => ({
  container: {
    margin: 0,
    padding: '0 200px 50px 0',
  },
  itemHead: {
    paddingLeft: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
  bodyItem: {
    height: '100%',
    fontSize: 13,
  },
}));

const headerStyles = {
  group_name: {
    width: '15%',
  },
  group_default_user_assign: {
    width: '15%',
  },
  group_default_scenario_observer: {
    width: '15%',
  },
  group_default_scenario_planner: {
    width: '15%',
  },
  group_default_exercise_observer: {
    width: '15%',
  },
  group_default_exercise_planner: {
    width: '15%',
  },
  group_users_number: {
    width: '10%',
  },
};

const inlineStyles = {
  group_name: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  group_default_user_assign: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  group_default_scenario_observer: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  group_default_scenario_planner: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  group_default_exercise_observer: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  group_default_exercise_planner: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  group_users_number: {
    float: 'left',
    width: '10%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

const Groups = () => {
  // Standard hooks
  const classes = useStyles();
  const dispatch = useDispatch();
  const { t } = useFormatter();
  useDataLoader(() => {
    dispatch(fetchOrganizations());
    dispatch(fetchUsers());
    dispatch(fetchExercises());
    dispatch(fetchScenarios());
    dispatch(fetchTags());
    dispatch(fetchOrganizations());
  });

  // Headers
  const headers = [
    { field: 'group_name', label: 'Name', isSortable: true },
    { field: 'group_default_user_assign', label: 'Auto assign', isSortable: true },
    { field: 'group_default_scenario_observer', label: 'Auto observer on scenarios', isSortable: true },
    { field: 'group_default_scenario_planner', label: 'Auto planner on scenarios', isSortable: true },
    { field: 'group_default_exercise_observer', label: 'Auto observer on exercises', isSortable: true },
    { field: 'group_default_exercise_planner', label: 'Auto planner on exercises', isSortable: true },
    { field: 'group_users_number', label: 'Users', isSortable: true },
  ];

  const [groups, setGroups] = useState([]);
  const [searchPaginationInput, setSearchPaginationInput] = useState({
    sorts: initSorting('group_name'),
  });

  // Export
  const exportProps = {
    exportType: 'tags',
    exportKeys: [
      'group_name',
      'group_default_user_assign',
      'group_users_number',
    ],
    exportData: groups,
    exportFileName: `${t('Groups')}.csv`,
  };

  return (
    <div className={classes.container}>
      <Breadcrumbs variant="list" elements={[{ label: t('Settings') }, { label: t('Security') }, { label: t('Groups'), current: true }]} />
      <SecurityMenu />
      <PaginationComponent
        fetch={searchGroups}
        searchPaginationInput={searchPaginationInput}
        setContent={setGroups}
        exportProps={exportProps}
      />
      <div className="clearfix" />
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
            primary={
              <SortHeadersComponent
                headers={headers}
                inlineStylesHeaders={headerStyles}
                searchPaginationInput={searchPaginationInput}
                setSearchPaginationInput={setSearchPaginationInput}
              />
              }
          />
          <ListItemSecondaryAction> &nbsp; </ListItemSecondaryAction>
        </ListItem>
        {groups.map((group) => (
          <ListItem
            key={group.group_id}
            classes={{ root: classes.item }}
            divider={true}
          >
            <ListItemIcon>
              <GroupsOutlined color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.group_name}
                  >
                    {group.group_name}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.group_default_user_assign}
                  >
                    {group.group_default_user_assign ? (
                      <Tooltip
                        title={t(
                          'The new users will automatically be assigned to this group.',
                        )}
                      >
                        <CheckCircleOutlined fontSize="small" />
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.group_default_scenario_observer}
                  >
                    {group.group_default_scenario_observer ? (
                      <Tooltip
                        title={t(
                          'This group will have observer permission on new scenarios.',
                        )}
                      >
                        <CheckCircleOutlined fontSize="small" />
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.group_default_scenario_planner}
                  >
                    {group.group_default_scenario_planner ? (
                      <Tooltip
                        title={t(
                          'This group will have planner permission on new scenarios.',
                        )}
                      >
                        <CheckCircleOutlined fontSize="small" />
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.group_default_exercise_observer}
                  >
                    {group.group_default_exercise_observer ? (
                      <Tooltip
                        title={t(
                          'This group will have observer permission on new simulations.',
                        )}
                      >
                        <CheckCircleOutlined fontSize="small" />
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.group_default_exercise_planner}
                  >
                    {group.group_default_exercise_planner ? (
                      <Tooltip
                        title={t(
                          'This group will have planner permission on new simulations.',
                        )}
                      >
                        <CheckCircleOutlined fontSize="small" />
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.group_users_number}
                  >
                    {group.group_users_number}
                  </div>
                </div>
                }
            />
            <ListItemSecondaryAction>
              <GroupPopover
                group={group}
                groupUsersIds={group.group_users}
                onUpdate={(result) => setGroups(groups.map((g) => (g.group_id !== result.group_id ? g : result)))}
                onDelete={(result) => setGroups(groups.filter((g) => (g.group_id !== result)))}
              />
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <CreateGroup
        onCreate={(result) => setGroups([result, ...groups])}
      />
    </div>
  );
};

export default Groups;
