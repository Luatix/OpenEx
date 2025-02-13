import { type InjectExpectationsStore } from '../../../../common/injects/expectations/Expectation';

const groupedByAsset = (es: InjectExpectationsStore[]) => {
  return es.reduce((group, expectation) => {
    const { inject_expectation_asset } = expectation;
    if (inject_expectation_asset) {
      const values = group.get(inject_expectation_asset) ?? [];
      values.push(expectation);
      group.set(inject_expectation_asset, values);
    }
    return group;
  }, new Map());
};

export default groupedByAsset;
