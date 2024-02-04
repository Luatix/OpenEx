import React from 'react';
import { makeStyles, useTheme } from '@mui/styles';
import { Typography, Grid, Card, CardHeader, Skeleton } from '@mui/material';

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  logo: {
    maxHeight: 200,
    maxWidth: 300,
  },
}));

const ChannelOverviewMicroblogging = ({ channel }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const logo = isDark ? channel.logoDark : channel.logoLight;
  return (
    <div className={classes.root}>
      {logo && channel.channel_mode !== 'title' && (
        <div
          style={{ margin: '0 auto', textAlign: 'center', marginBottom: 15 }}
        >
          <img
            src={`/api/documents/${logo.document_id}/file`}
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
      <Card sx={{ width: '100%' }} style={{ marginBottom: 20 }}>
        <CardHeader
          avatar={
            <Skeleton
              animation={false}
              variant="circular"
              width={40}
              height={40}
            />
          }
          title={
            <Skeleton
              animation={false}
              height={10}
              width="80%"
              style={{ marginBottom: 6 }}
            />
          }
          subheader={
            <React.Fragment>
              <Skeleton
                animation={false}
                height={10}
                style={{ marginBottom: 6 }}
              />
              <Skeleton animation={false} height={10} width="80%" />
            </React.Fragment>
          }
        />
      </Card>
      <Card sx={{ width: '100%' }} style={{ marginBottom: 20 }}>
        <CardHeader
          avatar={
            <Skeleton
              animation={false}
              variant="circular"
              width={40}
              height={40}
            />
          }
          title={
            <Skeleton
              animation={false}
              height={10}
              width="80%"
              style={{ marginBottom: 6 }}
            />
          }
          subheader={
            <React.Fragment>
              <Skeleton
                animation={false}
                height={10}
                style={{ marginBottom: 6 }}
              />
              <Skeleton animation={false} height={10} width="80%" />
            </React.Fragment>
          }
        />
      </Card>
      <Card sx={{ width: '100%' }} style={{ marginBottom: 20 }}>
        <CardHeader
          avatar={
            <Skeleton
              animation={false}
              variant="circular"
              width={40}
              height={40}
            />
          }
          title={
            <Skeleton
              animation={false}
              height={10}
              width="80%"
              style={{ marginBottom: 6 }}
            />
          }
          subheader={
            <React.Fragment>
              <Skeleton
                animation={false}
                height={10}
                style={{ marginBottom: 6 }}
              />
              <Skeleton animation={false} height={10} width="80%" />
            </React.Fragment>
          }
        />
        <Grid container={true} spacing={3}>
          <Grid item={true} xs={4}>
            <Skeleton
              sx={{ height: 180 }}
              animation={false}
              variant="rectangular"
            />
          </Grid>
          <Grid item={true} xs={4}>
            <Skeleton
              sx={{ height: 180 }}
              animation={false}
              variant="rectangular"
            />
          </Grid>
          <Grid item={true} xs={4}>
            <Skeleton
              sx={{ height: 180 }}
              animation={false}
              variant="rectangular"
            />
          </Grid>
        </Grid>
      </Card>
      <Card sx={{ width: '100%' }} style={{ marginBottom: 20 }}>
        <CardHeader
          avatar={
            <Skeleton
              animation={false}
              variant="circular"
              width={40}
              height={40}
            />
          }
          title={
            <Skeleton
              animation={false}
              height={10}
              width="80%"
              style={{ marginBottom: 6 }}
            />
          }
          subheader={
            <React.Fragment>
              <Skeleton
                animation={false}
                height={10}
                style={{ marginBottom: 6 }}
              />
              <Skeleton animation={false} height={10} width="80%" />
            </React.Fragment>
          }
        />
      </Card>
      <Card sx={{ width: '100%' }} style={{ marginBottom: 20 }}>
        <CardHeader
          avatar={
            <Skeleton
              animation={false}
              variant="circular"
              width={40}
              height={40}
            />
          }
          title={
            <Skeleton
              animation={false}
              height={10}
              width="80%"
              style={{ marginBottom: 6 }}
            />
          }
          subheader={
            <React.Fragment>
              <Skeleton
                animation={false}
                height={10}
                style={{ marginBottom: 6 }}
              />
              <Skeleton animation={false} height={10} width="80%" />
            </React.Fragment>
          }
        />
      </Card>
    </div>
  );
};

export default ChannelOverviewMicroblogging;
