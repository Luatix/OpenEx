import * as R from 'ramda';
import { useHelper } from '../store';
import type { ScenariosHelper } from '../actions/scenarios/scenario-helper';
import type { LoggedHelper, UsersHelper } from '../actions/helper';

const useScenarioPermissions = (scenarioId: string, fullScenario = null) => {
  const { scenario, me, logged } = useHelper((helper: ScenariosHelper & UsersHelper & LoggedHelper) => {
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
  };
};

export default useScenarioPermissions;
