import { Card, CardContent, CardHeader, Grid, Paper, Typography } from '@mui/material';
import { FunctionComponent } from 'react';
import { makeStyles } from 'tss-react/mui';

import Drawer from '../../../components/common/Drawer';
import { useFormatter } from '../../../components/i18n';
import ItemStatus from '../../../components/ItemStatus';
import type { InjectTestStatus } from '../../../utils/api-types';
import { truncate } from '../../../utils/String';
import { isNotEmptyField } from '../../../utils/utils';
import InjectIcon from '../common/injects/InjectIcon';

const useStyles = makeStyles()(theme => ({
  paper: {
    position: 'relative',
    padding: 20,
    overflow: 'hidden',
    height: '100%',
  },
  header: {
    fontWeight: 'bold',
  },
  listItem: {
    marginBottom: 8,
  },
  injectorContract: {
    margin: '20px 0 20px 15px',
    width: '100%',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
  },
  injectorContractHeader: {
    backgroundColor: theme.palette.background.default,
  },
  injectorContractContent: {
    fontSize: 18,
    textAlign: 'center',
  },
}));

interface Props {
  open: boolean;
  handleClose: () => void;
  test: InjectTestStatus | undefined;
}

const InjectTestDetail: FunctionComponent<Props> = ({
  open,
  handleClose,
  test,
}) => {
  const { classes } = useStyles();
  const { t } = useFormatter();

  return (
    <Drawer
      open={open}
      handleClose={handleClose}
      title={t('Test Details')}
    >

      <Grid container spacing={2}>
        <Card elevation={0} classes={{ root: classes.injectorContract }}>
          {test
            ? (
                <CardHeader
                  classes={{ root: classes.injectorContractHeader }}
                  avatar={(
                    <InjectIcon
                      isPayload={isNotEmptyField(test.injector_contract?.injector_contract_payload)}
                      type={
                        test.injector_contract?.injector_contract_payload
                          ? test.injector_contract?.injector_contract_payload.payload_collector_type
                          || test.injector_contract?.injector_contract_payload.payload_type
                          : test.inject_type
                      }
                      variant="list"
                    />
                  )}

                />
              ) : (
                <Paper variant="outlined" classes={{ root: classes.paper }}>
                  <Typography variant="body1">{t('No data available')}</Typography>
                </Paper>
              )}
          <CardContent classes={{ root: classes.injectorContractContent }}>
            {truncate(test?.inject_title, 80)}
          </CardContent>
        </Card>
        <Grid item xs={12}>
          <Typography variant="h4">{t('Execution logs')}</Typography>
          {test ? (
            <Paper variant="outlined" classes={{ root: classes.paper }}>
              <Typography variant="subtitle1" className={classes.header} gutterBottom>
                {t('Execution status')}
              </Typography>
              {test.status_name
              && <ItemStatus isInject={true} status={test.status_name} label={t(test.status_name)} />}
              <Typography variant="subtitle1" className={classes.header} style={{ marginTop: 20 }} gutterBottom>
                {t('Traces')}
              </Typography>
              <pre>
                {test.tracking_sent_date ? (
                  <>
                    <Typography variant="body1" gutterBottom>
                      {t('Tracking Sent Date')}
                      :
                      {test.tracking_sent_date}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {t('Tracking End Date')}
                      :
                      {test.tracking_end_date}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body1" gutterBottom>
                    {t('No data available')}
                  </Typography>
                )}
                {(test.status_traces?.length ?? 0) > 0 && (
                  <>
                    <Typography variant="body1" gutterBottom>
                      {t('Traces')}
                      :
                    </Typography>
                    <ul>
                      {test.status_traces?.map((trace, index) => (
                        <li key={index} className={classes.listItem}>
                          {`${trace.execution_status} ${trace.execution_message}`}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </pre>
            </Paper>
          ) : (
            <Paper variant="outlined" classes={{ root: classes.paper }}>
              <Typography variant="body1">{t('No data available')}</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Drawer>

  );
};

export default InjectTestDetail;
