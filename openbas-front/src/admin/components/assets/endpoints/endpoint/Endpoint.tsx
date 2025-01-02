import { Grid, List, Paper, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Empty from '../../../../../components/Empty';
import ExpandableMarkdown from '../../../../../components/ExpandableMarkdown';
import { useFormatter } from '../../../../../components/i18n';
import SearchFilter from '../../../../../components/SearchFilter';
import { useAppDispatch } from '../../../../../utils/hooks';

const useStyles = makeStyles(() => ({
  chip: {
    fontSize: 12,
    height: 25,
    margin: '0 7px 7px 0',
    textTransform: 'uppercase',
    borderRadius: 4,
    width: 180,
  },
  gridContainer: {
    marginBottom: 20,
  },
  paper: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: 15,
    borderRadius: 4,
  },
}));

const Endpoint = () => {
  // Standard hooks
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const { t, tPick, fldt } = useFormatter();

  // Fetching data
  return (
    <Grid
      container
      spacing={3}
      classes={{ container: classes.gridContainer }}
    >
      <Grid item style={{ paddingTop: 10 }}>
        <Typography variant="h4" gutterBottom>
          {t('Endpoint Information')}
        </Typography>
        <Paper classes={{ root: classes.paper }} variant="outlined">
          <Grid container spacing={3}>
            <Grid item xs={5} style={{ paddingTop: 10 }}>
              <Typography
                variant="h3"
                gutterBottom
                style={{ marginTop: 20 }}
              >
                {t('Description')}
              </Typography>
              <ExpandableMarkdown
                source={'fefe'}
                limit={300}
              />
            </Grid>
            <Grid item xs={3} style={{ paddingTop: 10 }}>
              <Typography
                variant="h3"
                gutterBottom
                style={{ marginTop: 20 }}
              >
                {t('Host name')}
              </Typography>
              <div style={{ display: 'flex' }}>
                {'host name'}
              </div>
            </Grid>
            <Grid item xs={2} style={{ paddingTop: 10 }}>
              <Typography
                variant="h3"
                gutterBottom
                style={{ marginTop: 20 }}
              >
                {t('Platform')}
              </Typography>
              <div style={{ display: 'flex' }}>
                {'platform'}
              </div>
            </Grid>
            <Grid item xs={2} style={{ paddingTop: 10 }}>
              <Typography
                variant="h3"
                gutterBottom
                style={{ marginTop: 20 }}
              >
                {t('Architecture')}
              </Typography>
              <div style={{ display: 'flex' }}>
                {'architecture'}
              </div>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      <Grid item style={{ marginTop: 30 }}>
        <Typography variant="h4" gutterBottom style={{ float: 'left' }}>
          {t('Agents')}
        </Typography>
        <div style={{ float: 'right', marginTop: -15 }}>
          <SearchFilter
            placeholder={t('Search')}
          />
        </div>
        <div className="clearfix" />
        <Paper classes={{ root: classes.paper }} variant="outlined">
          {true ? (
            <List>
            </List>
          ) : (
            <Empty message={t('No agents installed.')} />
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Endpoint;
