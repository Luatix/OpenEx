import { Box, Tab, Tabs } from '@mui/material';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useParams } from 'react-router';
import { interval } from 'rxjs';
import { makeStyles } from 'tss-react/mui';

import { fetchInjectResultOverviewOutput } from '../../../../actions/atomic_testings/atomic-testing-actions';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import { errorWrapper } from '../../../../components/Error';
import { useFormatter } from '../../../../components/i18n';
import Loader from '../../../../components/Loader';
import NotFound from '../../../../components/NotFound';
import { type InjectResultOverviewOutput } from '../../../../utils/api-types';
import isInjectWithPayloadInfo from '../../../../utils/inject/injectUtils';
import { FIVE_SECONDS } from '../../../../utils/Time';
import { TeamContext } from '../../common/Context';
import { InjectResultOverviewOutputContext } from '../InjectResultOverviewOutputContext';
import AtomicTestingHeader from './AtomicTestingHeader';
import AtomicTestingPayloadInfo from './AtomicTestingPayloadInfo';
import teamContextForAtomicTesting from './context/TeamContextForAtomicTesting';

const interval$ = interval(FIVE_SECONDS);

const useStyles = makeStyles()(() => ({
  item: {
    height: 30,
    fontSize: 13,
    float: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 10,
  },
}));

const AtomicTesting = lazy(() => import('./AtomicTesting'));
const AtomicTestingDetail = lazy(() => import('./AtomicTestingDetail'));

const Index = () => {
  const { classes } = useStyles();
  const { t } = useFormatter();
  const location = useLocation();
  let tabValue = location.pathname;

  // Fetching data
  const { injectId } = useParams() as { injectId: InjectResultOverviewOutput['inject_id'] };
  const [injectResultOverviewOutput, setInjectResultOverviewOutput] = useState<InjectResultOverviewOutput>();

  const updateInjectResultOverviewOutput = () => {
    fetchInjectResultOverviewOutput(injectId).then((result: { data: InjectResultOverviewOutput }) => {
      setInjectResultOverviewOutput(result.data);
    });
  };

  useEffect(() => {
    fetchInjectResultOverviewOutput(injectId).then((result: { data: InjectResultOverviewOutput }) => {
      setInjectResultOverviewOutput(result.data);
    });
  }, [injectId]);

  useEffect(() => {
    const subscription = interval$.subscribe(() => {
      fetchInjectResultOverviewOutput(injectId).then((result: { data: InjectResultOverviewOutput }) => {
        if (result.data.inject_updated_at !== injectResultOverviewOutput?.inject_updated_at) {
          setInjectResultOverviewOutput(result.data);
        }
      });
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [injectResultOverviewOutput]);

  if (injectResultOverviewOutput) {
    if (location.pathname.includes(`/admin/atomic_testings/${injectResultOverviewOutput.inject_id}/detail`)) {
      tabValue = `/admin/atomic_testings/${injectResultOverviewOutput.inject_id}/detail`;
    }
    return (
      <TeamContext.Provider value={teamContextForAtomicTesting()}>
        <InjectResultOverviewOutputContext.Provider value={{ injectResultOverviewOutput, updateInjectResultOverviewOutput }}>
          <Breadcrumbs
            variant="object"
            elements={[
              { label: t('Atomic testings'), link: '/admin/atomic_testings' },
              { label: injectResultOverviewOutput.inject_title, current: true },
            ]}
          />
          <AtomicTestingHeader />
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              marginBottom: 4,
            }}
          >
            <Tabs value={tabValue}>
              <Tab
                component={Link}
                to={`/admin/atomic_testings/${injectResultOverviewOutput.inject_id}`}
                value={`/admin/atomic_testings/${injectResultOverviewOutput.inject_id}`}
                label={t('Overview')}
                className={classes.item}
              />
              <Tab
                component={Link}
                to={`/admin/atomic_testings/${injectResultOverviewOutput.inject_id}/detail`}
                value={`/admin/atomic_testings/${injectResultOverviewOutput.inject_id}/detail`}
                label={t('Execution details')}
                className={classes.item}
              />
              {
                isInjectWithPayloadInfo(injectResultOverviewOutput) && (
                  <Tab
                    component={Link}
                    to={`/admin/atomic_testings/${injectResultOverviewOutput.inject_id}/payload_info`}
                    value={`/admin/atomic_testings/${injectResultOverviewOutput.inject_id}/payload_info`}
                    label={t('Payload info')}
                    className={classes.item}
                  />
                )
              }
            </Tabs>
          </Box>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="" element={errorWrapper(AtomicTesting)()} />
              <Route path="detail" element={errorWrapper(AtomicTestingDetail)()} />
              <Route path="payload_info" element={errorWrapper(AtomicTestingPayloadInfo)()} />
              {/* Not found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </InjectResultOverviewOutputContext.Provider>
      </TeamContext.Provider>
    );
  }
  return <Loader />;
};

export default Index;
