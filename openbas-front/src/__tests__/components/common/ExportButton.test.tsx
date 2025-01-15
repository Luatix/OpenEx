import ExportButton from '../../../components/common/ExportButton';
import { act, render } from '@testing-library/react'; // @testing-library/dom is needed as well as it is a peer dependency of @testing-library/react
import { describe, expect, it, vi } from 'vitest';
import {createDefaultTags, createTagMap} from "../../fixtures/api-types.fixtures";
import { faker } from '@faker-js/faker';
import TestRootComponent from "../../fixtures/TestRootComponent";
import type { TagHelper as TagHelperType } from '../../../actions/helper';
import {fetchTags } from '../../../actions/Tag'
import React from "react";
import {useAppDispatch} from "../../../utils/hooks";
import useDataLoader from "../../../utils/hooks/useDataLoader";
import {fetchPlatformParameters} from "../../../actions/Application";
import { store } from '../../../store'

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
    const exportType: string = "testobj"
    const exportData: testobj[] = [
        createObjWithDefaultKeys(exportType),
        createObjWithDefaultKeys(exportType),
        createObjWithDefaultKeys(exportType)
    ]
    const numberOfElements : number = exportData.length;
    const exportKeys = [
        `${exportType}_name`,
        `${exportType}_tags`,
    ];
    const tags = createDefaultTags(5);
    const tagMap = createTagMap(tags);
    for(let obj of exportData) {
        obj[`${exportType}_tags`] = tags.map(t => t.tag_id);
    }
    vi.mock(
        '../../../actions/Tag',
        () => ({fetchTags: () => tagMap})
    );

    useAppDispatch()(fetchTags())

    it("does something", async () => {
        const { getByRole } = render(
            <TestRootComponent>
                <ExportButton totalElements={numberOfElements} exportProps={{
                    exportType: exportType,
                    exportKeys: exportKeys,
                    exportData: [createObjWithDefaultKeys(exportType)],
                    exportFileName: "export.csv"
                }} />
            </TestRootComponent>,
        );
        await act(async () => {
            const firstname = getByRole("link");
            if (firstname.onclick) {
                const toto = await firstname.onclick(new MouseEvent("click"))
                console.log("here it is");
                console.log(firstname.href)
                console.log(firstname);
            }

            expect(firstname).toBeDefined();
        });
    });
});