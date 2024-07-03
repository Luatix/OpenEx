import React, { CSSProperties, useContext, useState } from 'react';
import { makeStyles } from '@mui/styles';
import { IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, Typography } from '@mui/material';
import { ArrowDropDownOutlined, ArrowDropUpOutlined, CloseRounded, EmailOutlined, KeyOutlined, PersonOutlined, SmartphoneOutlined } from '@mui/icons-material';
import * as R from 'ramda';
import { useFormatter } from '../../../../components/i18n';
import type { Theme } from '../../../../components/Theme';
import TagsFilter from '../../common/filters/TagsFilter';
import SearchFilter from '../../../../components/SearchFilter';
import ItemBoolean from '../../../../components/ItemBoolean';
import ItemTags from '../../../../components/ItemTags';
import PlayerPopover from '../../teams/players/PlayerPopover';
import TeamAddPlayers from './TeamAddPlayers';
import useDataLoader from '../../../../utils/hooks/useDataLoader';
import { fetchTeam, fetchTeamPlayers } from '../../../../actions/teams/team-actions';
import { fetchOrganizations } from '../../../../actions/Organization';
import { useAppDispatch } from '../../../../utils/hooks';
import type { Organization, Team } from '../../../../utils/api-types';
import { useHelper } from '../../../../store';
import type { OrganizationHelper, UserHelper } from '../../../../actions/helper';
import type { UserStore } from '../../teams/players/Player';
import type { Option } from '../../../../utils/Option';
import type { TeamsHelper } from '../../../../actions/teams/team-helper';
import { PermissionsContext, TeamContext } from '../../common/Context';

const useStyles = makeStyles((theme: Theme) => ({
  header: {
    backgroundColor: theme.palette.background.nav,
    padding: '20px 20px 20px 60px',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 5,
    color: 'inherit',
  },
  title: {
    float: 'left',
  },
  search: {
    float: 'right',
    width: 200,
    marginRight: 20,
  },
  tags: {
    float: 'right',
  },
  parameters: {
    float: 'right',
    marginTop: -8,
  },
  container: {
    marginTop: 10,
  },
  itemHead: {
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    height: 50,
  },
  bodyItem: {
    height: '100%',
    fontSize: 13,
  },
  icon: {
    marginRight: 10,
  },
}));

const inlineStylesHeaders: Record<string, CSSProperties> = {
  iconSort: {
    position: 'absolute',
    margin: '0 0 0 5px',
    padding: 0,
    top: '0px',
  },
  user_enabled: {
    float: 'left',
    width: '12%',
    fontSize: 12,
    fontWeight: '700',
  },
  user_email: {
    float: 'left',
    width: '30%',
    fontSize: 12,
    fontWeight: '700',
  },
  user_options: {
    float: 'left',
    width: '15%',
    fontSize: 12,
    fontWeight: '700',
  },
  user_organization: {
    float: 'left',
    width: '20%',
    fontSize: 12,
    fontWeight: '700',
  },
  user_tags: {
    float: 'left',
    width: '23%',
    fontSize: 12,
    fontWeight: '700',
  },
};

const inlineStyles: Record<string, CSSProperties> = {
  user_enabled: {
    float: 'left',
    width: '12%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    paddingRight: 10,
  },
  user_email: {
    float: 'left',
    width: '30%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  user_options: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  user_organization: {
    float: 'left',
    width: '20%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  user_tags: {
    float: 'left',
    width: '23%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

interface Props {
  teamId: Team['team_id']
  handleClose: () => void
}

interface UserStoreExtended extends UserStore {
  user_enabled: boolean;
}

const TeamPlayers: React.FC<Props> = ({ teamId, handleClose }) => {
  // Standard hooks
  const classes = useStyles();
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortby] = useState('user_email');
  const [orderAsc, setOrderAsc] = useState(true);
  const [tags, setTags] = useState<Option['id'][]>([]);

  const { organizationsMap, team, users }: {
    organizationsMap: Record<string, Organization>,
    team: Team,
    users: UserStore[]
  } = useHelper((helper: UserHelper & TeamsHelper & OrganizationHelper) => ({
    organizationsMap: helper.getOrganizationsMap(),
    team: helper.getTeam(teamId),
    users: helper.getTeamUsers(teamId),
  }));
  const { permissions } = useContext(PermissionsContext);
  const { onToggleUser, checkUserEnabled } = useContext(TeamContext);

  useDataLoader(() => {
    dispatch(fetchTeam(teamId));
    dispatch(fetchTeamPlayers(teamId));
    dispatch(fetchOrganizations());
  });

  const filterByKeyword = (user: UserStore) => keyword === ''
    || (user.user_email || '').toLowerCase().indexOf(keyword.toLowerCase()) !== -1
    || (user.user_firstname || '').toLowerCase().indexOf(keyword.toLowerCase()) !== -1
    || (user.user_lastname || '').toLowerCase().indexOf(keyword.toLowerCase()) !== -1
    || (user.user_phone || '').toLowerCase().indexOf(keyword.toLowerCase()) !== -1
    || (user.user_organization || '').toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
  const sort = R.sortWith(
    orderAsc ? [R.ascend(R.prop(sortBy))] : [R.descend(R.prop(sortBy))],
  );
  const sortedUsers: UserStoreExtended[] = R.pipe(
    R.filter(
      (user: UserStore) => tags.length === 0
        || R.any(
          (filter: Option['id']) => R.includes(filter, user.user_tags),
          R.pluck('id', tags),
        ),
    ),
    R.filter(filterByKeyword),
    R.map((user: UserStore) => {
      if (checkUserEnabled) {
        return ({
          user_enabled: checkUserEnabled(teamId, user.user_id),
          ...user,
        });
      }
      return user;
    }),
    sort,
  )(users);

  const sortHeader = (field: string, label: string, isSortable: boolean) => {
    const sortComponent = orderAsc ? (
      <ArrowDropDownOutlined style={inlineStylesHeaders.iconSort} />
    ) : (
      <ArrowDropUpOutlined style={inlineStylesHeaders.iconSort} />
    );
    if (isSortable) {
      return (
        <div
          style={inlineStylesHeaders[field]}
          onClick={() => {
            setSortby(field);
            setOrderAsc(!orderAsc);
          }}
        >
          <span>{t(label)}</span>
          {sortBy === field ? sortComponent : ''}
        </div>
      );
    }
    return (
      <div style={inlineStylesHeaders[field]}>
        <span>{t(label)}</span>
      </div>
    );
  };

  return (
    <>
      <div className={classes.header}>
        <IconButton
          aria-label="Close"
          className={classes.closeButton}
          onClick={handleClose}
          size="large"
          color="primary"
        >
          <CloseRounded fontSize="small" color="primary" />
        </IconButton>
        <Typography variant="h6" classes={{ root: classes.title }}>
          {R.propOr('-', 'team_name', team)}
        </Typography>
        <div className={classes.parameters}>
          <div className={classes.tags}>
            <TagsFilter
              onAddTag={(value: Option['id']) => {
                if (value) {
                  setTags([...tags, value]);
                }
              }}
              onRemoveTag={(value: Option['id']) => {
                setTags(tags.splice(tags.indexOf(value), 1));
              }}
              currentTags={tags}
              thin={true}
            />
          </div>
          <div className={classes.search}>
            <SearchFilter
              fullWidth={true}
              onChange={(value?: string) => setKeyword(value || '')}
              keyword={keyword}
            />
          </div>
        </div>
        <div className="clearfix" />
      </div>
      <List classes={{ root: classes.container }}>
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
              <>
                {onToggleUser && sortHeader('user_enabled', 'Enabled', true)}
                {sortHeader('user_email', 'Email address', true)}
                {sortHeader('user_options', 'Options', false)}
                {sortHeader('user_organization', 'Organization', true)}
                {sortHeader('user_tags', 'Tags', true)}
              </>
            }
          />
          <ListItemSecondaryAction> &nbsp; </ListItemSecondaryAction>
        </ListItem>
        {sortedUsers.map((user) => (
          <ListItem
            key={user.user_id}
            classes={{ root: classes.item }}
            divider={true}
          >
            <ListItemIcon>
              <PersonOutlined />
            </ListItemIcon>
            <ListItemText
              primary={
                <>
                  {onToggleUser && (
                    <div
                      className={classes.bodyItem}
                      style={inlineStyles.user_enabled}
                      onClick={() => onToggleUser(teamId, user.user_id, user.user_enabled)}
                    >
                      <ItemBoolean
                        status={user.user_enabled}
                        label={user.user_enabled ? t('Enabled') : t('Disabled')}
                        variant="inList"
                      />
                    </div>
                  )}
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.user_email}
                  >
                    {user.user_email}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.user_options}
                  >
                    {R.isNil(user.user_email)
                    || R.isEmpty(user.user_email) ? (
                      <EmailOutlined
                        color="warning"
                        fontSize="small"
                        className={classes.icon}
                      />
                      ) : (
                        <EmailOutlined
                          color="success"
                          fontSize="small"
                          className={classes.icon}
                        />
                      )}
                    {R.isNil(user.user_pgp_key)
                    || R.isEmpty(user.user_pgp_key) ? (
                      <KeyOutlined
                        color="warning"
                        fontSize="small"
                        className={classes.icon}
                      />
                      ) : (
                        <KeyOutlined
                          color="success"
                          fontSize="small"
                          className={classes.icon}
                        />
                      )}
                    {R.isNil(user.user_phone)
                    || R.isEmpty(user.user_phone) ? (
                      <SmartphoneOutlined
                        color="warning"
                        fontSize="small"
                        className={classes.icon}
                      />
                      ) : (
                        <SmartphoneOutlined
                          color="success"
                          fontSize="small"
                          className={classes.icon}
                        />
                      )}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.user_organization}
                  >
                    {
                      user.user_organization
                      && organizationsMap?.[user.user_organization]
                        ?.organization_name
                    }
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.user_tags}
                  >
                    <ItemTags variant="list" tags={user.user_tags} />
                  </div>
                </>
              }
            />
            <ListItemSecondaryAction>
              {permissions.canWrite
                ? (
                  <PlayerPopover
                    user={user}
                    teamId={teamId}
                  />
                )
                : <span> &nbsp; </span>
              }
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      {
        permissions.canWrite
        && (
          <TeamAddPlayers
            teamId={teamId}
            addedUsersIds={users.map((u) => u.user_id)}
          />
        )
      }
    </>
  );
};

export default TeamPlayers;
