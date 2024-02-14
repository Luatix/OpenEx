import React from 'react';
import { makeStyles, useTheme } from '@mui/styles';
import { Typography, Grid, Card, CardHeader, CardContent, Avatar, CardMedia, Button } from '@mui/material';
import { ChatBubbleOutlineOutlined, FavoriteBorderOutlined, ShareOutlined } from '@mui/icons-material';
import { useFormatter } from '../../../components/i18n';
import { useHelper } from '../../../store';
import ExpandableMarkdown from '../../../components/ExpandableMarkdown';
import { useQueryParameter } from '../../../utils/Environment';
import Empty from '../../../components/Empty';

const useStyles = makeStyles(() => ({
  container: {
    margin: '0 auto',
    width: 900,
  },
  card: {
    position: 'relative',
    marginBottom: 15,
  },
  logo: {
    maxHeight: 200,
    maxWidth: 300,
  },
  footer: {
    width: '100%',
    position: 'absolute',
    padding: '0 15px 0 15px',
    left: 0,
    bottom: 10,
  },
}));

const ChannelMicroblogging = ({ channelReader }) => {
  const classes = useStyles();
  const theme = useTheme();
  const [userId] = useQueryParameter(['user']);
  const { t, fldt } = useFormatter();
  const isDark = theme.palette.mode === 'dark';
  const {
    channel_exercise: exercise,
    channel_articles: articles,
    channel_information: channel,
  } = channelReader;
  const { documentsMap } = useHelper((helper) => ({
    documentsMap: helper.getDocumentsMap(),
  }));
  const logo = isDark ? channel.channel_logo_dark : channel.channel_logo_light;
  const queryParams = userId && userId.length > 0 && userId !== 'null' ? `?userId=${userId}` : '';
  return (
    <div className={classes.container}>
      {logo && channel.channel_mode !== 'title' && (
        <div
          style={{ margin: '0 auto', textAlign: 'center', marginBottom: 15 }}
        >
          <img
            src={`/api/player/${exercise.exercise_id}/documents/${logo}/file${queryParams}`}
            className={classes.logo}
          />
        </div>
      )}
      {channel.channel_mode !== 'logo' && (
        <Typography
          variant="h1"
          style={{
            textAlign: 'center',
            color: isDark
              ? channel.channel_primary_color_dark
              : channel.channel_primary_color_light,
            fontSize: 40,
          }}
        >
          {channel.channel_name}
        </Typography>
      )}
      <Typography
        variant="h2"
        style={{
          textAlign: 'center',
        }}
      >
        {channel.channel_description}
      </Typography>
      {articles.length === 0 && (
        <div style={{ marginTop: 150 }}>
          <Empty message={t('No channel pressure entry in this channel yet.')} />
        </div>
      )}
      {articles.map((article) => {
        const docs = article.article_documents
          .map((docId) => (documentsMap[docId] ? documentsMap[docId] : undefined))
          .filter((d) => d !== undefined)
          .filter(
            (d) => d.document_type.includes('image/')
              || d.document_type.includes('video/'),
          );
        let columns = 12;
        if (docs.length === 2) {
          columns = 6;
        } else if (docs.length === 3) {
          columns = 4;
        } else if (docs.length >= 4) {
          columns = 3;
        }
        return (
          <Card
            key={article.article_id}
            variant="outlined"
            classes={{ root: classes.card }}
            sx={{ width: '100%' }}
          >
            <CardHeader
              avatar={
                <Avatar>
                  {(article.article_author || t('Unknown')).charAt(0)}
                </Avatar>
              }
              title={article.article_author || t('Unknown')}
              subheader={fldt(article.article_virtual_publication)}
            />
            <CardContent style={{ marginTop: -20, paddingBottom: 50 }}>
              <ExpandableMarkdown
                source={article.article_content}
                limit={200}
                controlled={true}
              />
              <Grid container={true} spacing={3}>
                {docs.map((doc) => (
                  <Grid key={doc.document_id} item={true} xs={columns}>
                    {doc.document_type.includes('image/') && (
                      <CardMedia
                        component="img"
                        height="150"
                        src={`/api/player/${exercise.exercise_id}/documents/${doc.document_id}/file${queryParams}`}
                      />
                    )}
                    {doc.document_type.includes('video/') && (
                      <CardMedia
                        component="video"
                        height="150"
                        src={`/api/player/${exercise.exercise_id}/documents/${doc.document_id}/file${queryParams}`}
                        controls={true}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
              <div className={classes.footer}>
                <div style={{ float: 'right' }}>
                  <Button
                    size="small"
                    startIcon={<ChatBubbleOutlineOutlined />}
                  >
                    {article.article_comments || 0}
                  </Button>
                  <Button size="small" startIcon={<ShareOutlined />}>
                    {article.article_shares || 0}
                  </Button>
                  <Button size="small" startIcon={<FavoriteBorderOutlined />}>
                    {article.article_likes || 0}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ChannelMicroblogging;
