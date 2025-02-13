import { CssBaseline } from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import * as R from 'ramda';
import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import { fetchMe, fetchPlatformParameters } from './actions/Application';
import { type LoggedHelper } from './actions/helper';
import ConnectedIntlProvider from './components/AppIntlProvider';
import ConnectedThemeProvider from './components/AppThemeProvider';
import { errorWrapper } from './components/Error';
import Loader from './components/Loader';
import Message from './components/Message';
import NotFound from './components/NotFound';
import { useHelper } from './store';
import { useAppDispatch } from './utils/hooks';
import { UserContext } from './utils/hooks/useAuth';

const RootPublic = lazy(() => import('./public/Root'));
const IndexPrivate = lazy(() => import('./private/Index'));
const IndexAdmin = lazy(() => import('./admin/Index'));
const Comcheck = lazy(() => import('./public/components/comcheck/Comcheck'));
const Channel = lazy(() => import('./public/components/channels/Channel'));
const ExerciseReport = lazy(() => import('./admin/components/simulations/simulation/reports/ExerciseReportPage'));
const Challenges = lazy(() => import('./public/components/challenges/Challenges'));
const ExerciseViewLessons = lazy(() => import('./public/components/lessons/ExerciseViewLessons'));
const ScenarioViewLessons = lazy(() => import('./public/components/lessons/ScenarioViewLessons'));

const Root = () => {
  const { logged, me, settings } = useHelper((helper: LoggedHelper) => {
    return { logged: helper.logged(), me: helper.getMe(), settings: helper.getPlatformSettings() };
  });
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchMe());
    dispatch(fetchPlatformParameters());
  }, []);

  if (R.isEmpty(logged)) {
    return <div />;
  }

  if (!logged || !me || !settings) {
    return (
      <Suspense fallback={<Loader />}>
        <RootPublic />
      </Suspense>
    );
  }
  return (
    <UserContext.Provider
      value={{
        me,
        settings,
      }}
    >
      <StyledEngineProvider injectFirst>
        <ConnectedIntlProvider>
          <ConnectedThemeProvider>
            <CssBaseline />
            <Message />
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route
                  path=""
                  element={logged.isOnlyPlayer ? <Navigate to="private" replace={true} />
                    : <Navigate to="admin" replace={true} />}
                />
                <Route path="private/*" element={errorWrapper(IndexPrivate)()} />
                <Route path="admin/*" element={errorWrapper(IndexAdmin)()} />
                {/* Routes from /public/Index that need to be accessible for logged user are duplicated here */}
                <Route path="comcheck/:statusId" element={errorWrapper(Comcheck)()} />
                <Route path="channels/:exerciseId/:channelId" element={errorWrapper(Channel)()} />
                <Route path="challenges/:exerciseId" element={errorWrapper(Challenges)()} />
                <Route path="lessons/simulation/:exerciseId" element={errorWrapper(ExerciseViewLessons)()} />
                <Route path="lessons/scenario/:scenarioId" element={errorWrapper(ScenarioViewLessons)()} />
                <Route path="reports/:reportId/exercise/:exerciseId" element={errorWrapper(ExerciseReport)()} />
                {/* Not found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ConnectedThemeProvider>
        </ConnectedIntlProvider>
      </StyledEngineProvider>
    </UserContext.Provider>
  );
};

export default Root;
