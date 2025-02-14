import * as R from 'ramda';

import { AttackPattern, InjectorContractOutput } from '../api-types';

const computeAttackPatterns = (attackPatternIds: InjectorContractOutput['injector_contract_attack_patterns'], attackPatternsMap: Record<string, AttackPattern>) => {
  const attackPatternParents = (attackPatternIds ?? []).flatMap((attackPattern) => {
    const attackPatternParentId = attackPatternsMap[attackPattern]?.attack_pattern_parent;
    if (attackPatternParentId) {
      return [attackPatternsMap[attackPatternParentId]];
    }
    return [];
  });
  if (!R.isEmpty(attackPatternParents)) {
    return attackPatternParents;
  }
  return (attackPatternIds ?? []).map((attackPattern) => {
    return attackPatternsMap[attackPattern];
  });
};

export default computeAttackPatterns;
