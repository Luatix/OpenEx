import * as R from 'ramda';

import { type LoggedHelper, type UserHelper } from '../actions/helper';
import { type ScenariosHelper } from '../actions/scenarios/scenario-helper';
import { useHelper } from '../store';

const useScenarioPermissions = (scenarioId: string, fullScenario = null) => {
  const { scenario, me, logged } = useHelper((helper: ScenariosHelper & UserHelper & LoggedHelper) => {
    return {
      scenario: helper.getScenario(scenarioId),
      me: helper.getMe(),
      logged: helper.logged(),
    };
  });
  if ((!fullScenario && !scenario) || !me) {
    return {
      canRead: false,
      canWrite: false,
      canPlay: false,
      readOnly: true,
      isLoggedIn: !R.isEmpty(logged),
      isRunning: false,
    };
  }
  const canRead = logged.admin
    || (scenario || fullScenario).scenario_observers?.includes(me.user_id);
  const canWrite = logged.admin
    || (scenario || fullScenario).scenario_planners?.includes(me.user_id);
  const canPlay = logged.admin
    || (scenario || fullScenario).scenario_users?.includes(me.user_id);
  return {
    canRead,
    canWrite,
    canPlay,
    readOnly: !canWrite,
    isLoggedIn: !R.isEmpty(logged),
    isRunning: false,
  };
};

export default useScenarioPermissions;
