import React, { useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import { Autocomplete, Box, TextField } from '@mui/material';
import { fetchChannels } from '../../../../actions/channels/channel-action';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import ChannelIcon from './ChannelIcon';
import { useAppDispatch } from '../../../../utils/hooks';
import type { ChannelsHelper } from '../../../../actions/channels/channel-helper';
import type { ChannelOption } from './ChannelOption';
import type { Channel } from '../../../../utils/api-types';

const useStyles = makeStyles(() => ({
  icon: {
    paddingTop: 4,
    display: 'inline-block',
  },
  text: {
    display: 'inline-block',
    flexGrow: 1,
    marginLeft: 10,
  },
}));

interface Props {
  onAddChannel: (value?: ChannelOption) => void
  onClearChannel?: () => void
  onRemoveChannel: (value: string) => void
  currentChannels: ChannelOption[]
  fullWidth?: boolean
}

interface ChannelTransformed {
  id: string
  label: string
  color: string
  type: string
}

const ChannelsFilter: React.FC<Props> = (props) => {
  const classes = useStyles();
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchChannels());
  }, []);
  const channels = useHelper((helper: ChannelsHelper) => helper.getChannels());
  const { onAddChannel, onClearChannel = () => { }, fullWidth } = props;
  const channelColor = (type?: string) => {
    switch (type) {
      case 'newspaper':
        return '#3f51b5';
      case 'microblogging':
        return '#00bcd4';
      case 'tv':
        return '#ff9800';
      default:
        return '#ef41e1';
    }
  };
  const channelTransform = (n: Channel) => ({
    id: n.channel_id,
    label: n.channel_name,
    color: channelColor(n.channel_type),
    type: n.channel_type,
  });
  const channelsOptions: ChannelTransformed[] = channels.map(channelTransform);
  return (
    <div style={{ display: 'flex', float: 'right', marginTop: -15 }}>
      <Autocomplete
        sx={{ width: fullWidth ? '100%' : 250 }}
        selectOnFocus={true}
        openOnFocus={true}
        autoSelect={false}
        autoHighlight={true}
        size="small"
        options={channelsOptions}
        onChange={(event, value, reason) => {
          // When removing, a null change is fired
          // We handle directly the remove through the chip deletion.
          if (value !== null) onAddChannel(value);
          if (reason === 'clear' && fullWidth) onClearChannel();
        }}
        isOptionEqualToValue={(option, value: ChannelTransformed) => value === undefined || option.id === value.id}
        renderOption={(p, option) => (
          <Box component="li" {...p} key={option.id}>
            <div className={classes.icon} style={{ color: option.color }}>
              <ChannelIcon type={option.type} />
            </div>
            <div className={classes.text}>{option.label}</div>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            label={t('Channels')}
            variant="outlined"
            {...params}
          />
        )}
      />
    </div>
  );
};

export default ChannelsFilter;
