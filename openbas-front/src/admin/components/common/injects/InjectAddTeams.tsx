import { ControlPointOutlined, GroupsOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { FunctionComponent, useContext, useEffect, useMemo, useState } from 'react';

import { fetchTeams, findTeams } from '../../../../actions/teams/team-actions';
import { TeamsHelper } from '../../../../actions/teams/team-helper';
import PaginationComponentV2 from '../../../../components/common/queryable/pagination/PaginationComponentV2';
import { buildSearchPagination } from '../../../../components/common/queryable/QueryableUtils';
import { useQueryable } from '../../../../components/common/queryable/useQueryableWithLocalStorage';
import SelectList, { SelectListElements } from '../../../../components/common/SelectList';
import Transition from '../../../../components/common/Transition';
import { useFormatter } from '../../../../components/i18n';
import ItemTags from '../../../../components/ItemTags';
import type { Theme } from '../../../../components/Theme';
import { useHelper } from '../../../../store';
import type { TeamOutput } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import useDataLoader from '../../../../utils/hooks/useDataLoader';
import CreateTeam from '../../components/teams/CreateTeam';
import { PermissionsContext, TeamContext } from '../Context';

const useStyles = makeStyles((theme: Theme) => ({
  item: {
    paddingLeft: 10,
    height: 50,
  },
  text: {
    fontSize: 15,
    color: theme.palette.primary.main,
    fontWeight: 500,
  },
}));

interface Props {
  handleModifyTeams: (teamIds: string[]) => void;
  injectTeamsIds: string[];
  availableTeamIds: string[];
}

const InjectAddTeams: FunctionComponent<Props> = ({
  handleModifyTeams,
  injectTeamsIds,
  availableTeamIds,
}) => {
  // Standard hooks
  const dispatch = useAppDispatch();
  const { t } = useFormatter();
  const classes = useStyles();
  const { permissions } = useContext(PermissionsContext);
  const { searchTeams } = useContext(TeamContext);

  const [teamValues, setTeamValues] = useState<TeamOutput[]>([]);
  const [selectedTeamValues, setSelectedTeamValues] = useState<TeamOutput[]>([]);

  const allTeams = useHelper((helper: TeamsHelper) => helper.getTeams().filter(t => availableTeamIds.length > 0 ? availableTeamIds.includes(t.team_id) : true));
  useDataLoader(() => {
    dispatch(fetchTeams()).finally(() => {
    });
  });

  // Dialog
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setSelectedTeamValues([]);
  };

  const submitAddTeams = () => {
    handleModifyTeams(selectedTeamValues.map(v => v.team_id));
    handleClose();
  };

  useEffect(() => {
    if (open) {
      findTeams(injectTeamsIds).then(result => setSelectedTeamValues(result.data));
      setTeamValues(allTeams);
    }
  }, [open, injectTeamsIds]);

  // Pagination
  const addTeam = (_teamId: string, team: TeamOutput) => setSelectedTeamValues([...selectedTeamValues, team]);
  const removeTeam = (teamId: string) => setSelectedTeamValues(selectedTeamValues.filter(v => v.team_id !== teamId));

  // Headers
  const elements: SelectListElements<TeamOutput> = useMemo(() => ({
    icon: {
      value: () => <GroupsOutlined />,
    },
    headers: [
      {
        field: 'team_name',
        value: (team: TeamOutput) => team.team_name,
        width: 70,
      },
      {
        field: 'team_tags',
        value: (team: TeamOutput) => <ItemTags variant="reduced-view" tags={team.team_tags} />,
        width: 30,
      },
    ],
  }), []);

  const availableFilterNames = [
    'team_tags',
  ];
  const { queryableHelpers, searchPaginationInput } = useQueryable(buildSearchPagination({}));

  const paginationComponent = (
    <PaginationComponentV2
      fetch={input => searchTeams(input, true)}
      searchPaginationInput={searchPaginationInput}
      setContent={setTeamValues}
      entityPrefix="team"
      availableFilterNames={availableFilterNames}
      queryableHelpers={queryableHelpers}
    />
  );

  return (
    <div>
      <ListItemButton
        classes={{ root: classes.item }}
        divider
        onClick={() => setOpen(true)}
        color="primary"
        disabled={permissions.readOnly}
      >
        <ListItemIcon color="primary">
          <ControlPointOutlined color="primary" />
        </ListItemIcon>
        <ListItemText
          primary={t('Modify target teams')}
          classes={{ primary: classes.text }}
        />
      </ListItemButton>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        onClose={handleClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          elevation: 1,
          sx: {
            minHeight: 580,
            maxHeight: 580,
          },
        }}
      >
        <DialogTitle>{t('Modify target teams in this inject')}</DialogTitle>
        <DialogContent>
          <Box sx={{ marginTop: 2 }}>
            <SelectList
              values={teamValues}
              selectedValues={selectedTeamValues}
              elements={elements}
              prefix="team"
              onSelect={addTeam}
              onDelete={removeTeam}
              paginationComponent={paginationComponent}
              buttonComponent={(
                <CreateTeam
                  inline
                  onCreate={(team) => {
                    setTeamValues([...teamValues, team]);
                    setSelectedTeamValues([...selectedTeamValues, team]);
                  }}
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('Cancel')}</Button>
          <Button color="secondary" onClick={submitAddTeams}>
            {t('Update')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default InjectAddTeams;
