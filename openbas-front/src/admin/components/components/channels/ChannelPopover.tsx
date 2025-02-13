import { MoreVert } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Menu, MenuItem, type PopoverProps } from '@mui/material';
import { type FunctionComponent, type MouseEvent as ReactMouseEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { deleteChannel, updateChannel } from '../../../../actions/channels/channel-action';
import Transition from '../../../../components/common/Transition';
import { useFormatter } from '../../../../components/i18n';
import { type Channel, type ChannelUpdateInput } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import ChannelForm from './ChannelForm';

const useStyles = makeStyles()(() => ({
  button: {
    float: 'left',
    margin: '-10px 0 0 5px',
  },
}));

interface Props {
  channel: Channel;
}

const ChannelPopover: FunctionComponent<Props> = ({ channel }) => {
  const [anchorEl, setAnchorEl] = useState<PopoverProps['anchorEl']>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const { classes } = useStyles();
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handlePopoverOpen = (event: ReactMouseEvent) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => setAnchorEl(null);

  const handleOpenEdit = () => {
    setOpenEdit(true);
    handlePopoverClose();
  };

  const handleOpenDelete = () => {
    setOpenDelete(true);
    handlePopoverClose();
  };

  const onSubmitEdit = async (data: ChannelUpdateInput) => {
    await dispatch(updateChannel(channel.channel_id, data));
    setOpenEdit(false);
  };

  const submitDelete = async () => {
    await dispatch(deleteChannel(channel.channel_id));
    setOpenDelete(false);
    navigate('/admin/components/channels');
  };

  const initialValues = {
    channel_type: channel.channel_type,
    channel_name: channel.channel_name,
    channel_description: channel.channel_description,
  };

  return (
    <div>
      <IconButton
        color="primary"
        classes={{ root: classes.button }}
        onClick={handlePopoverOpen}
        aria-haspopup="true"
        size="large"
      >
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handlePopoverClose}
      >
        <MenuItem onClick={handleOpenEdit}>{t('Update')}</MenuItem>
        <MenuItem onClick={handleOpenDelete}>{t('Delete')}</MenuItem>
      </Menu>
      <Dialog
        open={openDelete}
        TransitionComponent={Transition}
        onClose={() => setOpenDelete(false)}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            {t('Do you want to delete this channel?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>{t('Cancel')}</Button>
          <Button color="secondary" onClick={submitDelete}>
            {t('Delete')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        TransitionComponent={Transition}
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        fullWidth={true}
        maxWidth="md"
        PaperProps={{ elevation: 1 }}
      >
        <DialogTitle>{t('Update the channel')}</DialogTitle>
        <DialogContent>
          <ChannelForm
            initialValues={initialValues}
            editing={true}
            onSubmit={onSubmitEdit}
            handleClose={() => setOpenEdit(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChannelPopover;
