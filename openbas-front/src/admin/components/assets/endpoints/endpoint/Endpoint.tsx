import { Grid, List, Paper, Typography } from '@mui/material';
import { useParams } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { type EndpointHelper } from '../../../../../actions/assets/asset-helper';
import Empty from '../../../../../components/Empty';
import ExpandableMarkdown from '../../../../../components/ExpandableMarkdown';
import { useFormatter } from '../../../../../components/i18n';
import ItemTags from '../../../../../components/ItemTags';
import PlatformIcon from '../../../../../components/PlatformIcon';
import { useHelper } from '../../../../../store';
import { type EndpointOverviewOutput as EndpointType } from '../../../../../utils/api-types';
import AgentList from './AgentList';

const useStyles = makeStyles()(() => ({
  paper: {
    padding: 20,
  },
}));

const Endpoint = () => {
  // Standard hooks
  const { classes } = useStyles();
  const { endpointId } = useParams() as { endpointId: EndpointType['asset_id'] };
  const { t } = useFormatter();

  // Fetching data
  const { endpoint } = useHelper((helper: EndpointHelper) => ({
    endpoint: helper.getEndpoint(endpointId),
  }));
  return (
    <div>
      <Grid
        container
        spacing={3}
      >
        <Grid item xs={12} style={{ paddingTop: 15 }}>
          <Typography variant="h4">
            {t('Endpoint Information')}
          </Typography>
          <Paper classes={{ root: classes.paper }} variant="outlined">
            <Grid container spacing={3}>
              <Grid item xs={4} style={{ paddingTop: 20 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 5 }}
                >
                  {t('Description')}
                </Typography>
                <div style={{ display: 'flex', paddingTop: 5 }}>
                  <ExpandableMarkdown
                    source={endpoint.asset_description}
                    limit={300}
                  />
                </div>
              </Grid>
              <Grid item xs={3} style={{ paddingTop: 20 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 5 }}
                >
                  {t('Hostname')}
                </Typography>
                <div style={{ display: 'flex', paddingTop: 5 }}>
                  {endpoint.endpoint_hostname}
                </div>
              </Grid>
              <Grid item xs={3} style={{ paddingTop: 20 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 5 }}
                >
                  {t('Platform')}
                </Typography>
                <div style={{ display: 'flex', paddingTop: 5 }}>
                  <PlatformIcon platform={endpoint.endpoint_platform} width={20} marginRight={10} />
                  {' '}
                  {endpoint.endpoint_platform}
                </div>
              </Grid>
              <Grid item xs={2} style={{ paddingTop: 20 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 5 }}
                >
                  {t('Architecture')}
                </Typography>
                <div style={{ display: 'flex', paddingTop: 5 }}>
                  {endpoint.endpoint_arch}
                </div>
              </Grid>
              <Grid item xs={4} style={{ paddingTop: 20 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 10 }}
                >
                  {t('IP Addresses')}
                </Typography>
                <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 10, paddingTop: 5 }}>
                  {endpoint.endpoint_ips?.map((ip: string, index: number) => (
                    <div key={index} style={{ marginRight: 10 }}>
                      {ip}
                    </div>
                  ))}
                </div>
              </Grid>
              <Grid item xs={3} style={{ paddingTop: 20 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 10 }}
                >
                  {t('MAC Addresses')}
                </Typography>
                <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 10, paddingTop: 5 }}>
                  {endpoint.endpoint_mac_addresses?.map((mac: string, index: number) => (
                    <div key={index} style={{ marginRight: 10 }}>
                      {mac}
                    </div>
                  ))}
                </div>
              </Grid>
              <Grid item xs={3} style={{ paddingTop: 20 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 10 }}
                >
                  {t('Tags')}
                </Typography>
                <div style={{ display: 'flex', paddingTop: 5 }}>
                  <ItemTags variant="list" tags={endpoint.asset_tags} />
                </div>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h4" style={{ float: 'left' }}>
            {t('Agents')}
          </Typography>
          <div className="clearfix" />
          <Paper classes={{ root: classes.paper }} variant="outlined">
            {endpoint.asset_agents ? (
              <List>
                <AgentList agents={endpoint.asset_agents}></AgentList>
              </List>
            ) : (
              <Empty message={t('No agents installed.')} />
            )}
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Endpoint;
