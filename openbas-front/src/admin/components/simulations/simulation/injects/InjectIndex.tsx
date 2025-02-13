import { Box, Tab, Tabs } from '@mui/material';
import { type FunctionComponent, Suspense, useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { fetchInjectResultOverviewOutput } from '../../../../../actions/atomic_testings/atomic-testing-actions';
import { fetchExercise } from '../../../../../actions/Exercise';
import { type ExercisesHelper } from '../../../../../actions/exercises/exercise-helper';
import Breadcrumbs, { BACK_LABEL, BACK_URI, type BreadcrumbsElement } from '../../../../../components/Breadcrumbs';
import { errorWrapper } from '../../../../../components/Error';
import { useFormatter } from '../../../../../components/i18n';
import Loader from '../../../../../components/Loader';
import NotFound from '../../../../../components/NotFound';
import { useHelper } from '../../../../../store';
import { type Exercise as ExerciseType, type InjectResultOverviewOutput } from '../../../../../utils/api-types';
import { usePermissions } from '../../../../../utils/Exercise';
import { useAppDispatch } from '../../../../../utils/hooks';
import useDataLoader from '../../../../../utils/hooks/useDataLoader';
import isInjectWithPayloadInfo from '../../../../../utils/inject/injectUtils';
import AtomicTesting from '../../../atomic_testings/atomic_testing/AtomicTesting';
import AtomicTestingDetail from '../../../atomic_testings/atomic_testing/AtomicTestingDetail';
import AtomicTestingPayloadInfo from '../../../atomic_testings/atomic_testing/AtomicTestingPayloadInfo';
import { InjectResultOverviewOutputContext } from '../../../atomic_testings/InjectResultOverviewOutputContext';
import { PermissionsContext, type PermissionsContextType } from '../../../common/Context';
import InjectHeader from '../../../injects/InjectHeader';

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

const InjectIndexComponent: FunctionComponent<{ exercise: ExerciseType; injectResult: InjectResultOverviewOutput }> = ({
  exercise,
  injectResult,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const { classes } = useStyles();

  // Context
  const permissionsContext: PermissionsContextType = {
    permissions: usePermissions(exercise.exercise_id),
  };

  const [searchParams] = useSearchParams();
  const backlabel = searchParams.get('backlabel');
  const backuri = searchParams.get('backuri');
  const location = useLocation();
  const tabValue = location.pathname;

  const [injectResultOverviewOutput, setInjectResultOverviewOutput] = useState<InjectResultOverviewOutput>(injectResult);

  const updateInjectResultOverviewOutput = (newData: InjectResultOverviewOutput) => {
    setInjectResultOverviewOutput(newData);
  };

  const breadcrumbs: BreadcrumbsElement[] = [
    { label: t('Simulations'), link: '/admin/simulations' },
    { label: t(exercise.exercise_name), link: `/admin/simulations/${exercise.exercise_id}` },
  ];
  if (backlabel && backuri) {
    breadcrumbs.push({ label: backlabel, link: backuri });
  }
  breadcrumbs.push({ label: t('Injects') });
  breadcrumbs.push({ label: injectResultOverviewOutput.inject_title, current: true });

  const computePath = (path: string) => {
    if (backlabel && backuri) {
      return path + `?${BACK_LABEL}=${backlabel}&${BACK_URI}=${backuri}`;
    }
    return path;
  };

  return (
    <InjectResultOverviewOutputContext.Provider value={{ injectResultOverviewOutput, updateInjectResultOverviewOutput }}>
      <PermissionsContext.Provider value={permissionsContext}>
        <Breadcrumbs variant="object" elements={breadcrumbs} />
        <InjectHeader inject={injectResult} />
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
              to={computePath(`/admin/simulations/${exercise.exercise_id}/injects/${injectResultOverviewOutput.inject_id}`)}
              value={`/admin/simulations/${exercise.exercise_id}/injects/${injectResultOverviewOutput.inject_id}`}
              label={t('Overview')}
              className={classes.item}
            />
            <Tab
              component={Link}
              to={computePath(`/admin/simulations/${exercise.exercise_id}/injects/${injectResultOverviewOutput.inject_id}/detail`)}
              value={`/admin/simulations/${exercise.exercise_id}/injects/${injectResultOverviewOutput.inject_id}/detail`}
              label={t('Execution details')}
              className={classes.item}
            />
            {
              isInjectWithPayloadInfo(injectResultOverviewOutput) && (
                <Tab
                  component={Link}
                  to={computePath(`/admin/simulations/${exercise.exercise_id}/injects/${injectResultOverviewOutput.inject_id}/payload_info`)}
                  value={`/admin/simulations/${exercise.exercise_id}/injects/${injectResultOverviewOutput.inject_id}/payload_info`}
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
      </PermissionsContext.Provider>
    </InjectResultOverviewOutputContext.Provider>
  );
};

const InjectIndex = () => {
  // Standard hooks
  const dispatch = useAppDispatch();
  // Fetching data
  const { exerciseId } = useParams() as { exerciseId: ExerciseType['exercise_id'] };
  const { injectId } = useParams() as { injectId: InjectResultOverviewOutput['inject_id'] };
  const exercise = useHelper((helper: ExercisesHelper) => helper.getExercise(exerciseId));
  useDataLoader(() => {
    dispatch(fetchExercise(exerciseId));
  });
  const [injectResultOutput, setInjectResultOverviewOutput] = useState<InjectResultOverviewOutput>();

  useEffect(() => {
    fetchInjectResultOverviewOutput(injectId).then((result: { data: InjectResultOverviewOutput }) => {
      setInjectResultOverviewOutput(result.data);
    });
  }, [injectId]);

  if (exercise && injectResultOutput) {
    return <InjectIndexComponent exercise={exercise} injectResult={injectResultOutput} />;
  }
  return <Loader />;
};

export default InjectIndex;
