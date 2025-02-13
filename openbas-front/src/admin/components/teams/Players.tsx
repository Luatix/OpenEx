import { PersonOutlined } from '@mui/icons-material';
import { List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText } from '@mui/material';
import { type CSSProperties, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { type OrganizationHelper, type UserHelper } from '../../../actions/helper';
import { fetchOrganizations } from '../../../actions/Organization';
import { searchPlayers } from '../../../actions/players/player-actions';
import Breadcrumbs from '../../../components/Breadcrumbs';
import ExportButton from '../../../components/common/ExportButton';
import { initSorting } from '../../../components/common/queryable/Page';
import PaginationComponentV2 from '../../../components/common/queryable/pagination/PaginationComponentV2';
import { buildSearchPagination } from '../../../components/common/queryable/QueryableUtils';
import SortHeadersComponentV2 from '../../../components/common/queryable/sort/SortHeadersComponentV2';
import { useQueryableWithLocalStorage } from '../../../components/common/queryable/useQueryableWithLocalStorage';
import { type Header } from '../../../components/common/SortHeadersList';
import { useFormatter } from '../../../components/i18n';
import ItemTags from '../../../components/ItemTags';
import { useHelper } from '../../../store';
import { type PlayerOutput } from '../../../utils/api-types';
import { useAppDispatch } from '../../../utils/hooks';
import useDataLoader from '../../../utils/hooks/useDataLoader';
import CreatePlayer from './players/CreatePlayer';
import PlayerPopover from './players/PlayerPopover';

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
    boxSizing: 'content-box',
  },
}));

const inlineStyles: Record<string, CSSProperties> = {
  user_email: {
    width: '25%',
  },
  user_firstname: {
    width: '15%',
  },
  user_lastname: {
    width: '15%',
  },
  user_organization: {
    width: '20%',
    cursor: 'default',
  },
  user_tags: {
    width: '25%',
  },
};

const Players = () => {
  // Standard hooks
  const { classes } = useStyles();
  const dispatch = useAppDispatch();
  const { t } = useFormatter();

  // Fetching data
  const { isPlanner, organizationsMap } = useHelper((helper: UserHelper & OrganizationHelper) => ({
    isPlanner: helper.getMe().user_is_planner,
    organizationsMap: helper.getOrganizationsMap(),
  }));

  useDataLoader(() => {
    dispatch(fetchOrganizations());
  });

  // Query param
  const [searchParams] = useSearchParams();
  const [search] = searchParams.getAll('search');
  const [searchId] = searchParams.getAll('id');

  // Headers
  const headers: Header[] = useMemo(() => [
    {
      field: 'user_email',
      label: 'Email address',
      isSortable: true,
      value: (player: PlayerOutput) => player.user_email,
    },
    {
      field: 'user_firstname',
      label: 'Firstname',
      isSortable: true,
      value: (player: PlayerOutput) => player.user_firstname || '-',
    },
    {
      field: 'user_lastname',
      label: 'Lastname',
      isSortable: true,
      value: (player: PlayerOutput) => player.user_lastname || '-',
    },
    {
      field: 'user_organization',
      label: 'Organization',
      isSortable: false,
      value: (player: PlayerOutput) => (player.user_organization ? organizationsMap[player.user_organization]?.organization_name : '-'),
    },
    {
      field: 'user_tags',
      label: 'Tags',
      isSortable: true,
      value: (player: PlayerOutput) => <ItemTags variant="list" tags={player.user_tags} />,
    },
  ], [organizationsMap]);

  const availableFilterNames = [
    'user_email',
    'user_firstname',
    'user_lastname',
    'user_organization',
    'user_tags',
  ];

  const [players, setPlayers] = useState<PlayerOutput[]>([]);
  const { queryableHelpers, searchPaginationInput } = useQueryableWithLocalStorage('players', buildSearchPagination({
    sorts: initSorting('user_email'),
    textSearch: search,
  }));

  // Export
  const exportProps = {
    exportType: 'user',
    exportKeys: [
      'user_email',
      'user_firstname',
      'user_lastname',
      'user_phone',
      'user_tags',
    ],
    exportData: players,
    exportFileName: `${t('Players')}.csv`,
  };

  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Teams') }, { label: t('Players'), current: true }]} />
      <PaginationComponentV2
        fetch={searchPlayers}
        searchPaginationInput={searchPaginationInput}
        setContent={setPlayers}
        entityPrefix="user"
        availableFilterNames={availableFilterNames}
        queryableHelpers={queryableHelpers}
        topBarButtons={
          <ExportButton totalElements={queryableHelpers.paginationHelpers.getTotalElements()} exportProps={exportProps} />
        }
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
        {players.map((player: PlayerOutput) => (
          <ListItem
            key={player.user_id}
            classes={{ root: classes.item }}
            divider
          >
            <ListItemIcon>
              <PersonOutlined color="primary" />
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
                      {header.value?.(player)}
                    </div>
                  ))}
                </div>
              )}
            />
            <ListItemSecondaryAction>
              <PlayerPopover
                user={player}
                openEditOnInit={player.user_id === searchId}
                onUpdate={result => setPlayers(players.map(p => (p.user_id !== result.user_id ? p : result)))}
                onDelete={result => setPlayers(players.filter(p => (p.user_id !== result)))}
              />
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      {isPlanner
      && (
        <CreatePlayer
          onCreate={result => setPlayers([result, ...players])}
        />
      )}
    </>
  );
};

export default Players;
