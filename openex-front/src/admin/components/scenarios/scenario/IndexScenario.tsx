import React, { FunctionComponent, lazy, Suspense } from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import Loader from '../../../../components/Loader';
import { errorWrapper } from '../../../../components/Error';
import { useAppDispatch } from '../../../../utils/hooks';
import { useHelper } from '../../../../store';
import { ScenariosHelper } from '../../../../actions/scenarios/scenario-helper';
import useDataLoader from '../../../../utils/ServerSideEvent';
import { fetchScenario } from '../../../../actions/scenarios/scenario-actions';
import NotFound from '../../../../components/NotFound';
import TopBar from '../../nav/TopBar';
import ScenarioHeader from './ScenarioHeader';

const Scenario = lazy(() => import('./Scenario'));

const IndexScenarioComponent: FunctionComponent<{ scenarioId: string }> = ({ scenarioId }) => {
  // Standard hooks
  const dispatch = useAppDispatch();

  // Fetching data
  const { scenario } = useHelper((helper: ScenariosHelper) => ({
    scenario: helper.getScenario(scenarioId),
  }));
  useDataLoader(() => {
    dispatch(fetchScenario(scenarioId));
  });

  if (scenario) {
    return (
      <>
        <TopBar />
        <ScenarioHeader />
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="" element={errorWrapper(Scenario)()} />
          </Routes>
        </Suspense>
      </>
    );
  }
  return (
    <>
      <TopBar />
      <NotFound />
    </>
  );
};

const IndexScenario = () => {
  // Standard hooks
  const { scenarioId } = useParams();

  if (scenarioId) {
    return (<IndexScenarioComponent scenarioId={scenarioId} />);
  }

  return (
    <NotFound></NotFound>
  );
};

export default IndexScenario;
