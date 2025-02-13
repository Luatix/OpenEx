import { GroupsOutlined } from '@mui/icons-material';
import { ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText } from '@mui/material';
import * as R from 'ramda';
import { type FunctionComponent, useContext, useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { findTeams } from '../../../../../actions/teams/team-actions';
import ItemTags from '../../../../../components/ItemTags';
import { type TeamOutput } from '../../../../../utils/api-types';
import TeamPopover from '../../../components/teams/TeamPopover';
import { PermissionsContext, TeamContext } from '../../Context';

const useStyles = makeStyles()(theme => ({
  item: {
    paddingLeft: 10,
    height: 50,
  },
  column: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 2fr',
  },
  bodyItem: {
    fontSize: theme.typography.h3.fontSize,
  },
}));

interface Props {
  teamIds: Array<string>;
  handleRemoveTeam: (teamId: string) => void;
}

const InjectTeamsList: FunctionComponent<Props> = ({
  teamIds,
  handleRemoveTeam,
}) => {
  // Standard hooks
  const { classes } = useStyles();
  const { permissions } = useContext(PermissionsContext);
  const { computeTeamUsersEnabled } = useContext(TeamContext);

  const [teams, setTeams] = useState<TeamOutput[]>([]);
  const sortTeams = R.sortWith(
    [R.ascend(R.prop('team_name'))],
  );
  useEffect(() => {
    findTeams(teamIds).then(result => setTeams(sortTeams(result.data)));
  }, [teamIds]);

  return (
    <>
      {teams.map(team => (
        <ListItem
          key={team.team_id}
          classes={{ root: classes.item }}
          divider
        >
          <ListItemIcon>
            <GroupsOutlined />
          </ListItemIcon>
          <ListItemText
            primary={(
              <div className={classes.column}>
                <div className={classes.bodyItem}>
                  {team.team_name}
                </div>
                <div className={classes.bodyItem}>
                  {team.team_users_number}
                </div>
                <div className={classes.bodyItem}>
                  {computeTeamUsersEnabled?.(team.team_id)}
                </div>
                <div className={classes.bodyItem}>
                  <ItemTags variant="reduced-view" tags={team.team_tags} />
                </div>
              </div>
            )}
          />
          <ListItemSecondaryAction>
            <TeamPopover
              team={team}
              onRemoveTeamFromInject={handleRemoveTeam}
              disabled={permissions.readOnly}
            />
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </>
  );
};

export default InjectTeamsList;
