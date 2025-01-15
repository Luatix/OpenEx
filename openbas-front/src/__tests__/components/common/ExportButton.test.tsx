import ExportButton from '../../../components/common/ExportButton';
import { act, render } from '@testing-library/react'; // @testing-library/dom is needed as well as it is a peer dependency of @testing-library/react
import { describe, expect, it, vi } from 'vitest';
import { getDefaultTags } from "../../fixtures/api-types.fixtures";
import { faker } from '@faker-js/faker';

/* eslint-disable  @typescript-eslint/no-explicit-any */
type testobj = { [key: string]: any };
function createObjWithDefaultKeys(objtype: string): testobj {
    const obj: testobj = {};
    ['name', 'extra_prop_1', 'extra_prop_2'].forEach((prop) => {
        obj[`${objtype}_${prop}`] = faker.lorem.sentence();
    });
    return obj;
}

describe('Generic export button', () => {
    const numberOfElements : number = 10;
    const numberOfTags : number = 5;
    const exportType: string = "testobj"
    const exportKeys = [
        `${exportType}_name`,
    ];
    vi.mock(
        '../../../../../../src/actions/Tag',
        () => ({ fetchTags: () => getDefaultTags(numberOfTags)})
    );

    it("does something", () => {
        const { getByDisplayValue } = render(
          <ExportButton totalElements={numberOfElements} exportProps={{
              exportType: exportType,
              exportKeys: exportKeys,
              exportData: [createObjWithDefaultKeys(exportType)],
              exportFileName: "export"
              }} />,
        );
        act(() => {
            const firstname = getByDisplayValue("Export this list");
            expect(firstname).toBeDefined();
        });
    });
});