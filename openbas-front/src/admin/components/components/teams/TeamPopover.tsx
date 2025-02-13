import { MoreVert } from '@mui/icons-material';
import { Button, Dialog as MuiDialog, DialogActions, DialogContent, DialogContentText, IconButton, Menu, MenuItem } from '@mui/material';
import { FunctionComponent, MouseEvent as ReactMouseEvent, useContext, useState } from 'react';

import type { ExercisesHelper } from '../../../../actions/exercises/exercise-helper';
import type { OrganizationHelper, TagHelper } from '../../../../actions/helper';
import { TeamInputForm } from '../../../../actions/teams/Team';
import { deleteTeam, updateTeam } from '../../../../actions/teams/team-actions';
import type { TeamsHelper } from '../../../../actions/teams/team-helper';
import Dialog from '../../../../components/common/Dialog';
import Transition from '../../../../components/common/Transition';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import type { Team, TeamOutput, TeamUpdateInput } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import { Option, organizationOption, tagOptions } from '../../../../utils/Option';
import { TeamContext } from '../../common/Context';
import TeamForm from './TeamForm';

interface TeamPopoverProps {
  team: Team | TeamOutput;
  managePlayers?: () => void;
  disabled?: boolean;
  openEditOnInit?: boolean;
  onRemoveTeamFromInject?: (teamId: string) => void;
  onUpdate?: (result: Team) => void;
  onDelete?: (result: string) => void;
}

const TeamPopover: FunctionComponent<TeamPopoverProps> = ({
  team,
  managePlayers,
  disabled,
  openEditOnInit = false,
  onRemoveTeamFromInject = null,
  onUpdate,
  onDelete,
}) => {
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  const { organizationsMap, tagsMap } = useHelper(
    (
      helper: ExercisesHelper & TeamsHelper & OrganizationHelper & TagHelper,
    ) => {
      return {
        organizationsMap: helper.getOrganizationsMap(),
        tagsMap: helper.getTagsMap(),
      };
    },
  );

  const { onRemoveTeam } = useContext(TeamContext);

  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(openEditOnInit);
  const [openRemove, setOpenRemove] = useState(false);
  const [openRemoveFromInject, setOpenRemoveFromInject] = useState(false);
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  // Popover
  const handlePopoverOpen = (event: ReactMouseEvent) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => setAnchorEl(null);

  // Edition
  const handleOpenEdit = () => {
    setOpenEdit(true);
    handlePopoverClose();
  };

  const handleCloseEdit = () => setOpenEdit(false);

  const onSubmitEdit = (data: TeamInputForm) => {
    const inputValues: TeamUpdateInput = {
      ...data,
      team_organization: data.team_organization?.id,
      team_tags: data.team_tags?.map((tag: Option) => tag.id),
    };
    return dispatch(updateTeam(team.team_id, inputValues)).then(
      (result: { result: string; entities: { teams: Record<string, Team> } }) => {
        if (result.entities) {
          if (onUpdate) {
            const updated = result.entities.teams[result.result];
            onUpdate(updated);
          }
        }
        handleCloseEdit();
        return result;
      },
    );
  };

  // Deletion
  const handleOpenDelete = () => {
    setOpenDelete(true);
    handlePopoverClose();
  };

  const handleCloseDelete = () => setOpenDelete(false);

  const submitDelete = () => {
    dispatch(deleteTeam(team.team_id)).then(
      () => {
        if (onDelete) {
          onDelete(team.team_id);
        }
        handleCloseDelete();
      },
    );
  };

  // Remove
  const handleOpenRemove = () => {
    setOpenRemove(true);
    handlePopoverClose();
  };

  const handleCloseRemove = () => setOpenRemove(false);

  const submitRemove = () => {
    return onRemoveTeam!(team.team_id).then(() => handleCloseRemove());
  };

  // Remove
  const handleOpenRemoveFromInject = () => {
    setOpenRemoveFromInject(true);
    handlePopoverClose();
  };

  const handleCloseRemoveFromInject = () => setOpenRemoveFromInject(false);

  const submitRemoveFromInject = () => {
    onRemoveTeamFromInject!(team.team_id);
    handleCloseRemoveFromInject();
  };

  const initialValues: TeamInputForm = {
    ...team,
    team_organization: organizationOption(
      team.team_organization,
      organizationsMap,
    ),
    team_tags: tagOptions(team.team_tags, tagsMap),
  };

  return (
    <>
      <IconButton onClick={handlePopoverOpen} aria-haspopup="true" size="large" color="primary" disabled={disabled}>
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handlePopoverClose}
      >
        <MenuItem onClick={handleOpenEdit}>{t('Update')}</MenuItem>
        {managePlayers && (
          <MenuItem onClick={() => {
            handlePopoverClose();
            managePlayers();
          }}
          >
            {t('Manage players')}
          </MenuItem>
        )}
        {onRemoveTeam && !onRemoveTeamFromInject && !team.team_contextual && (
          <MenuItem onClick={handleOpenRemove}>
            {' '}
            {t('Remove from the context')}
          </MenuItem>
        )}
        {onRemoveTeamFromInject && (
          <MenuItem onClick={handleOpenRemoveFromInject}>
            {' '}
            {t('Remove from the inject')}
          </MenuItem>
        )}
        <MenuItem onClick={handleOpenDelete}>{t('Delete')}</MenuItem>
      </Menu>
      <MuiDialog
        open={openDelete}
        TransitionComponent={Transition}
        onClose={handleCloseDelete}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to delete this team?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>{t('Cancel')}</Button>
          <Button color="secondary" onClick={submitDelete}>
            {t('Delete')}
          </Button>
        </DialogActions>
      </MuiDialog>
      <Dialog
        open={openEdit}
        handleClose={handleCloseEdit}
        title={t('Update the team')}
      >
        <TeamForm
          initialValues={initialValues}
          handleClose={handleCloseEdit}
          onSubmit={onSubmitEdit}
          editing
        />
      </Dialog>
      <MuiDialog
        open={openRemove}
        TransitionComponent={Transition}
        onClose={handleCloseRemove}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to remove the team from this context?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemove}>{t('Cancel')}</Button>
          <Button color="secondary" onClick={submitRemove}>
            {t('Remove')}
          </Button>
        </DialogActions>
      </MuiDialog>
      <MuiDialog
        open={openRemoveFromInject}
        TransitionComponent={Transition}
        onClose={handleCloseRemoveFromInject}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to remove the team from this inject?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemoveFromInject}>{t('Cancel')}</Button>
          <Button color="secondary" onClick={submitRemoveFromInject}>
            {t('Remove')}
          </Button>
        </DialogActions>
      </MuiDialog>
    </>
  );
};

export default TeamPopover;
