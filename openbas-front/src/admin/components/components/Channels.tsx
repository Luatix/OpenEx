import React, { CSSProperties } from 'react';
import { makeStyles } from '@mui/styles';
import { List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction } from '@mui/material';
import { ChevronRightOutlined } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import SearchFilter from '../../../components/SearchFilter';
import useDataLoader from '../../../utils/ServerSideEvent';
import { useHelper } from '../../../store';
import useSearchAnFilter from '../../../utils/SortingFiltering';
import { fetchChannels } from '../../../actions/channels/channel-action';
import CreateChannel from './channels/CreateChannel';
import { useFormatter } from '../../../components/i18n';
import ChannelIcon from './channels/ChannelIcon';
import type { ChannelsHelper } from '../../../actions/channels/channel-helper';
import type { UsersHelper } from '../../../actions/helper';
import { useAppDispatch } from '../../../utils/hooks';
import type { Channel } from '../../../utils/api-types';

const useStyles = makeStyles(() => ({
  parameters: {
    marginTop: -10,
  },
  container: {
    marginTop: 10,
  },
  itemHead: {
    paddingLeft: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
  bodyItem: {
    height: '100%',
    fontSize: 13,
  },
}));

const headerStyles: Record<string, CSSProperties> = {
  iconSort: {
    position: 'absolute',
    margin: '0 0 0 5px',
    padding: 0,
    top: '0px',
  },
  channel_type: {
    float: 'left',
    width: '15%',
    fontSize: 12,
    fontWeight: '700',
  },
  channel_name: {
    float: 'left',
    width: '25%',
    fontSize: 12,
    fontWeight: '700',
  },
  channel_description: {
    float: 'left',
    fontSize: 12,
    fontWeight: '700',
  },
};

const inlineStyles: Record<string, CSSProperties> = {
  channel_type: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  channel_name: {
    float: 'left',
    width: '25%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  channel_description: {
    float: 'left',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

const Channels = () => {
  // Standard hooks
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const { t } = useFormatter();
  // Filter and sort hook
  const searchColumns = ['type', 'name', 'description'];
  const filtering = useSearchAnFilter('channel', 'name', searchColumns);
  // Fetching data
  const { channels, userAdmin }: { channels: Channel[], userAdmin: boolean } = useHelper((helper: ChannelsHelper & UsersHelper) => ({
    channels: helper.getChannels(),
    userAdmin: helper.getMe()?.user_admin ?? false,
  }));
  useDataLoader(() => {
    dispatch(fetchChannels());
  });
  const sortedChannels: Channel[] = filtering.filterAndSort(channels);
  return (
    <div>
      <div className={classes.parameters}>
        <div style={{ float: 'left', marginRight: 10 }}>
          <SearchFilter
            variant="small"
            onChange={filtering.handleSearch}
            keyword={filtering.keyword}
          />
        </div>
      </div>
      <div className="clearfix" />
      <List classes={{ root: classes.container }}>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
        >
          <ListItemIcon>
            <span
              style={{ padding: '0 8px 0 8px', fontWeight: 700, fontSize: 12 }}
            >
              &nbsp;
            </span>
          </ListItemIcon>
          <ListItemText
            primary={
              <div>
                {filtering.buildHeader(
                  'channel_type',
                  'Type',
                  true,
                  headerStyles,
                )}
                {filtering.buildHeader(
                  'channel_name',
                  'Name',
                  true,
                  headerStyles,
                )}
                {filtering.buildHeader(
                  'channel_description',
                  'Subtitle',
                  true,
                  headerStyles,
                )}
              </div>
            }
          />
          <ListItemSecondaryAction>&nbsp;</ListItemSecondaryAction>
        </ListItem>
        {sortedChannels.map((channel) => (
          <ListItem
            key={channel.channel_id}
            classes={{ root: classes.item }}
            divider
            component={Link}
            button
            to={`/admin/components/channels/${channel.channel_id}`}
          >
            <ListItemIcon>
              <ChannelIcon
                type={channel.channel_type}
                tooltip={t(channel.channel_type || 'Unknown')}
              />
            </ListItemIcon>
            <ListItemText
              primary={
                <div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.channel_type}
                  >
                    {t(channel.channel_type || 'Unknown')}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.channel_name}
                  >
                    {channel.channel_name}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.channel_description}
                  >
                    {channel.channel_description}
                  </div>
                </div>
              }
            />
            <ListItemSecondaryAction>
              <ChevronRightOutlined />
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      {userAdmin && <CreateChannel />}
    </div>
  );
};

export default Channels;
