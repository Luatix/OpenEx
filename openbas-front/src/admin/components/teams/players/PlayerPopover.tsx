import { MoreVert } from '@mui/icons-material';
import { Button, Dialog as MuiDialog, DialogActions, DialogContent, DialogContentText, IconButton, Menu, MenuItem } from '@mui/material';
import { FunctionComponent, MouseEvent as ReactMouseEvent, useContext, useState } from 'react';

import type { OrganizationHelper, TagHelper, UserHelper } from '../../../../actions/helper';
import { deletePlayer, updatePlayer } from '../../../../actions/User';
import DialogDelete from '../../../../components/common/DialogDelete';
import Drawer from '../../../../components/common/Drawer';
import Transition from '../../../../components/common/Transition';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import type { PlayerInput } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import { countryOption, Option, organizationOption, tagOptions } from '../../../../utils/Option';
import { TeamContext } from '../../common/Context';
import type { PlayerInputForm, UserStore } from './Player';
import PlayerForm from './PlayerForm';

interface PlayerPopoverProps {
  user: UserStore;
  teamId?: string;
  openEditOnInit?: boolean;
  onUpdate?: (result: UserStore) => void;
  onDelete?: (result: string) => void;
}

const PlayerPopover: FunctionComponent<PlayerPopoverProps> = ({
  user,
  teamId,
  openEditOnInit = false,
  onUpdate,
  onDelete,
}) => {
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  const { userAdmin, organizationsMap, tagsMap } = useHelper(
    (
      helper: UserHelper & OrganizationHelper & TagHelper,
    ) => {
      return {
        userAdmin: helper.getMe()?.user_admin,
        organizationsMap: helper.getOrganizationsMap(),
        tagsMap: helper.getTagsMap(),
      };
    },
  );

  const { onRemoveUsersTeam } = useContext(TeamContext);

  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(openEditOnInit);
  const [openRemove, setOpenRemove] = useState(false);
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

  const onSubmitEdit = (data: PlayerInputForm) => {
    const inputValues: PlayerInput = {
      ...data,
      user_organization: data.user_organization?.id,
      user_country: data.user_country?.id,
      user_tags: data.user_tags?.map((tag: Option) => tag.id),
    };
    return dispatch(updatePlayer(user.user_id, inputValues))
      .then((result: { result: string; entities: { users: Record<string, UserStore> } }) => {
        if (onUpdate) {
          const updated = result.entities.users[result.result];
          onUpdate(updated);
        }
        handleCloseEdit();
      });
  };

  // Deletion
  const handleOpenDelete = () => {
    setOpenDelete(true);
    handlePopoverClose();
  };

  const handleCloseDelete = () => setOpenDelete(false);

  const submitDelete = () => {
    dispatch(deletePlayer(user.user_id))
      .then(
        () => {
          if (onDelete) {
            onDelete(user.user_id);
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

  const submitRemove = async () => {
    await onRemoveUsersTeam?.(teamId!, [user.user_id]);
    handleCloseRemove();
  };

  const initialValues: PlayerInputForm = {
    ...user,
    user_organization: organizationOption(
      user.user_organization,
      organizationsMap,
    ),
    user_country: countryOption(user.user_country),
    user_tags: tagOptions(user.user_tags, tagsMap),
  };
  const canDelete = user.user_email !== 'admin@openbas.io' && (userAdmin || !user.user_admin);
  const canUpdateEmail = user.user_email !== 'admin@openbas.io' && (userAdmin || !user.user_admin);
  return (
    <div>
      <IconButton onClick={handlePopoverOpen} aria-haspopup="true" size="large" color="primary">
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handlePopoverClose}
      >
        <MenuItem onClick={handleOpenEdit}>{t('Update')}</MenuItem>
        {teamId && (
          <MenuItem onClick={handleOpenRemove}>
            {t('Remove from the team')}
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem onClick={handleOpenDelete}>{t('Delete')}</MenuItem>
        )}
      </Menu>
      <DialogDelete
        open={openDelete}
        handleClose={handleCloseDelete}
        handleSubmit={submitDelete}
        text={t('Do you want to delete this player?')}
      />
      <Drawer
        open={openEdit}
        handleClose={handleCloseEdit}
        title={t('Update the player')}
      >
        <PlayerForm
          initialValues={initialValues}
          handleClose={handleCloseEdit}
          onSubmit={onSubmitEdit}
          editing
          canUpdateEmail={canUpdateEmail}
        />
      </Drawer>
      <MuiDialog
        open={openRemove}
        TransitionComponent={Transition}
        onClose={handleCloseRemove}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to remove the player from the team?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemove}>{t('Cancel')}</Button>
          <Button color="secondary" onClick={submitRemove}>
            {t('Remove')}
          </Button>
        </DialogActions>
      </MuiDialog>
    </div>
  );
};

export default PlayerPopover;
