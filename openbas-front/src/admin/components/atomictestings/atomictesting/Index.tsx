import React, { FunctionComponent, lazy, Suspense } from 'react';
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { Box, Tab, Tabs } from '@mui/material';
import Loader from '../../../../components/Loader';
import { errorWrapper } from '../../../../components/Error';
import { useAppDispatch } from '../../../../utils/hooks';
import { useHelper } from '../../../../store';
import useDataLoader from '../../../../utils/ServerSideEvent';
import NotFound from '../../../../components/NotFound';
import { useFormatter } from '../../../../components/i18n';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import AtomicTestingHeader from './Header';
import { fetchAtomicTesting } from '../../../../actions/atomictestings/atomic-testing-actions';
import type { AtomicTestingOutput } from '../../../../utils/api-types';
import type { AtomicTestingHelper } from '../../../../actions/atomictestings/atomic-testing-helper';

const AtomicTesting = lazy(() => import('./AtomicTesting'));
const AtomicTestingDetail = lazy(() => import('./detail/Detail'));

const IndexAtomicTestingComponent: FunctionComponent<{ atomic: AtomicTestingOutput }> = ({
  atomic,
}) => {
  const { t } = useFormatter();
  const location = useLocation();
  let tabValue = location.pathname;
  if (location.pathname.includes(`/admin/atomic_testings/${atomic.atomic_id}/detail`)) {
    tabValue = `/admin/atomic_testings/${atomic.atomic_id}/detail`;
  }
  return (
    <div>
      <Breadcrumbs variant="object" elements={[
        { label: t('Atomic Testings') },
        { label: atomic.atomic_title, current: true },
      ]}
      />
      <AtomicTestingHeader/>
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
            to={`/admin/atomic_testings/${atomic.atomic_id}`}
            value={`/admin/atomic_testings/${atomic.atomic_id}`}
            label={t('Response')}
          />
          <Tab
            component={Link}
            to={`/admin/atomic_testings/${atomic.atomic_id}/detail`}
            value={`/admin/atomic_testings/${atomic.atomic_id}/detail`}
            label={t('Detail')}
          />
        </Tabs>
      </Box>
      <Suspense fallback={<Loader/>}>
        <Routes>
          <Route path="" element={errorWrapper(AtomicTesting)()}/>
          <Route path="/detail" element={errorWrapper(AtomicTestingDetail)()}/>
          {/* Not found */}
          <Route path="*" element={<NotFound/>}/>
        </Routes>
      </Suspense>
    </div>
  );
};

const IndexAtomicTesting = () => {
  // Standard hooks
  const dispatch = useAppDispatch();
  // Fetching data
  const { atomicId } = useParams() as { atomicId: AtomicTestingOutput['atomic_id'] };
  const atomic = useHelper((helper: AtomicTestingHelper) => helper.getAtomicTesting(atomicId));
  useDataLoader(() => {
    dispatch(fetchAtomicTesting(atomicId));
  });
  if (atomic) {
    return <IndexAtomicTestingComponent atomic={atomic}/>;
  }
  return <Loader/>;
};

export default IndexAtomicTesting;
