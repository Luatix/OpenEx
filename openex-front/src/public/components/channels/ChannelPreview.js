import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from '@mui/styles';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@mui/material';
import { fetchObserverChannel } from '../../../actions/channels/channel-action';
import { useHelper } from '../../../store';
import { useQueryParameter } from '../../../utils/Environment';
import ChannelNewspaper from './ChannelNewspaper';
import ChannelMicroblogging from './ChannelMicroblogging';
import ChannelTvChannel from './ChannelTvChannel';
import { useFormatter } from '../../../components/i18n';
import { usePermissions } from '../../../utils/Exercise';
import { fetchMe } from '../../../actions/Application';
import { fetchPlayerDocuments } from '../../../actions/Document';
import Loader from '../../../components/Loader';

const useStyles = makeStyles(() => ({
  root: {
    position: 'relative',
    flexGrow: 1,
    padding: 20,
  },
}));

const ChannelPreview = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { t } = useFormatter();
  const [userId, articleId] = useQueryParameter(['user', 'article']);
  const { channelId, exerciseId } = useParams();
  const { channelReader } = useHelper((helper) => ({
    channelReader: helper.getChannelReader(channelId),
  }));
  const { channel_information: channel, channel_exercise: exercise } = channelReader ?? {};
  // Pass the full exercise because the exercise is never loaded in the store at this point
  const permissions = usePermissions(exerciseId, exercise);
  useEffect(() => {
    dispatch(fetchMe());
    dispatch(fetchObserverChannel(exerciseId, channelId));
    dispatch(fetchPlayerDocuments(exerciseId));
  }, []);
  if (channel) {
    return (
      <div className={classes.root}>
        {permissions.isLoggedIn && permissions.canRead && (
          <Button
            color="secondary"
            variant="outlined"
            component={Link}
            to={`/channels/${exerciseId}/${channelId}?article=${articleId}&user=${userId}&preview=false`}
            style={{ position: 'absolute', top: 20, right: 20 }}
          >
            {t('Switch to player mode')}
          </Button>
        )}
        {permissions.isLoggedIn && permissions.canRead && (
          <Button
            color="primary"
            variant="outlined"
            component={Link}
            to={`/admin/exercises/${exerciseId}/definition/channel`}
            style={{ position: 'absolute', top: 20, left: 20 }}
          >
            {t('Back to administration')}
          </Button>
        )}
        {channel.channel_type === 'newspaper' && (
          <ChannelNewspaper channelReader={channelReader} />
        )}
        {channel.channel_type === 'microblogging' && (
          <ChannelMicroblogging channelReader={channelReader} />
        )}
        {channel.channel_type === 'tv' && (
          <ChannelTvChannel channelReader={channelReader} />
        )}
      </div>
    );
  }
  return <Loader />;
};

export default ChannelPreview;
