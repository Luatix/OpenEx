import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Add, GroupsOutlined } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import ItemTags from '../../../../components/ItemTags';
import Transition from '../../../../components/common/Transition';
import { useFormatter } from '../../../../components/i18n';
import { findTeams } from '../../../../actions/teams/team-actions';
import type { Team, TeamOutput } from '../../../../utils/api-types';
import type { TeamStore } from '../../../../actions/teams/Team';
import SelectList, { SelectListElements } from '../../../../components/common/SelectList';
import type { EndpointStore } from '../../assets/endpoints/Endpoint';
import PaginationComponentV2 from '../../../../components/common/queryable/pagination/PaginationComponentV2';
import { useQueryable } from '../../../../components/common/queryable/useQueryableWithLocalStorage';
import { buildSearchPagination } from '../../../../components/common/queryable/QueryableUtils';
import { TeamContext } from '../../common/Context';

const useStyles = makeStyles(() => ({
  createButton: {
    float: 'left',
    marginTop: -15,
  },
}));

interface Props {
  addedTeamIds: Team['team_id'][];
  onAddTeams: (teamIds: Team['team_id'][]) => Promise<void>,
}

const AddTeams: React.FC<Props> = ({
  addedTeamIds,
  onAddTeams,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const classes = useStyles();
  const { searchTeams } = useContext(TeamContext);

  const [teams, setTeams] = useState<TeamOutput[]>([]);
  const [teamValues, setTeamValues] = useState<TeamOutput[]>([]);

  // Dialog
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setTeamValues([]);
  };

  const handleSubmit = async () => {
    setOpen(false);
    await onAddTeams(teamValues.map((v) => v.team_id));
  };

  useEffect(() => {
    findTeams(addedTeamIds).then((result) => setTeamValues(result.data));
  }, [open, addedTeamIds]);

  // Pagination
  const addTeam = (_teamId: string, team: TeamOutput) => setTeamValues([...teamValues, team]);
  const removeTeam = (teamId: string) => setTeamValues(teamValues.filter((v) => v.team_id !== teamId));

  // Headers
  const elements: SelectListElements<EndpointStore> = useMemo(() => ({
    icon: {
      value: () => <GroupsOutlined />,
    },
    headers: [
      {
        field: 'team_name',
        value: (team: TeamStore) => team.team_name,
        width: 70,
      },
      {
        field: 'team_tags',
        value: (team: TeamStore) => <ItemTags variant="reduced-view" tags={team.team_tags} />,
        width: 30,
      },
    ],
  }), []);

  const availableFilterNames = [
    'team_tags',
  ];
  const { queryableHelpers, searchPaginationInput } = useQueryable(buildSearchPagination({}));

  const paginationComponent = <PaginationComponentV2
    fetch={(input) => searchTeams(input)}
    searchPaginationInput={searchPaginationInput}
    setContent={setTeams}
    entityPrefix="team"
    availableFilterNames={availableFilterNames}
    queryableHelpers={queryableHelpers}
  />;

  return (
    <>
      <IconButton
        color="primary"
        aria-label="Add"
        onClick={() => setOpen(true)}
        classes={{ root: classes.createButton }}
        size="large"
      >
        <Add fontSize="small" />
      </IconButton>
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
        <DialogTitle>{t('Add teams')}</DialogTitle>
        <DialogContent>
          <Box sx={{ marginTop: 2 }}>
            <SelectList
              values={teams}
              selectedValues={teamValues}
              elements={elements}
              prefix="team"
              onSelect={addTeam}
              onDelete={removeTeam}
              paginationComponent={paginationComponent}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('Cancel')}</Button>
          <Button color="secondary" onClick={handleSubmit}>
            {t('Add')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddTeams;
