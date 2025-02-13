import { Card, CardContent, CardHeader, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { type FunctionComponent } from 'react';

import Drawer from '../../../components/common/Drawer';
import { useFormatter } from '../../../components/i18n';
import { type InjectTestStatusOutput } from '../../../utils/api-types';
import { truncate } from '../../../utils/String';
import InjectIcon from '../common/injects/InjectIcon';
import InjectStatus from '../common/injects/status/InjectStatus';

interface Props {
  open: boolean;
  handleClose: () => void;
  test: InjectTestStatusOutput | undefined;
}

const InjectTestDetail: FunctionComponent<Props> = ({
  open,
  handleClose,
  test,
}) => {
  const theme = useTheme();
  const { t } = useFormatter();

  return (
    <Drawer
      open={open}
      handleClose={handleClose}
      title={t('Test Details')}
    >

      <div>
        <Card elevation={0} style={{ marginBottom: '20px' }}>
          {test
            ? (
                <CardHeader
                  sx={{ backgroundColor: theme.palette.background.default }}
                  avatar={(
                    <InjectIcon
                      isPayload={false}
                      type={test.inject_type}
                      variant="list"
                    />
                  )}

                />
              ) : (
                <Paper variant="outlined" style={{ padding: '20px' }}>
                  <Typography variant="body1">{t('No data available')}</Typography>
                </Paper>
              )}
          <CardContent style={{ fontSize: 18, textAlign: 'center' }}>
            {truncate(test?.inject_title, 80)}
          </CardContent>
        </Card>
        <InjectStatus injectStatus={test} />
      </div>
    </Drawer>

  );
};

export default InjectTestDetail;
