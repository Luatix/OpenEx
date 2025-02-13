import { Box, Button, Chip } from '@mui/material';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import InjectorContractSwitchFilter from '../../../../admin/components/common/filters/InjectorContractSwitchFilter';
import MitreFilter, { MITRE_FILTER_KEY } from '../../../../admin/components/common/filters/MitreFilter';
import mitreAttack from '../../../../static/images/misc/attack.png';
import type { AttackPattern, Filter, PropertySchemaDTO, SearchPaginationInput } from '../../../../utils/api-types';
import { useFormatter } from '../../../i18n';
import ClickableModeChip from '../../chips/ClickableModeChip';
import Drawer from '../../Drawer';
import FilterAutocomplete, { OptionPropertySchema } from '../filter/FilterAutocomplete';
import FilterChips from '../filter/FilterChips';
import { availableOperators, isEmptyFilter } from '../filter/FilterUtils';
import useFilterableProperties from '../filter/useFilterableProperties';
import type { Page } from '../Page';
import { QueryableHelpers } from '../QueryableHelpers';
import TextSearchComponent from '../textSearch/TextSearchComponent';
import TablePaginationComponentV2 from './TablePaginationComponentV2';

const useStyles = makeStyles()(() => ({
  topbar: {
    display: 'flex',
    alignItems: 'center',
  },
  parameters: {
    marginTop: -10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parametersWithoutPagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}));

interface Props<T> {
  fetch: (input: SearchPaginationInput) => Promise<{ data: Page<T> }>;
  searchPaginationInput: SearchPaginationInput;
  setContent: (data: T[]) => void;
  searchEnable?: boolean;
  disablePagination?: boolean;
  entityPrefix?: string;
  availableFilterNames?: string[];
  queryableHelpers: QueryableHelpers;
  topBarButtons?: React.ReactElement | null;
  attackPatterns?: AttackPattern[];
  reloadContentCount?: number;
  contextId?: string;
}

const PaginationComponentV2 = <T extends object>({
  fetch,
  searchPaginationInput,
  setContent,
  searchEnable = true,
  disablePagination,
  entityPrefix,
  availableFilterNames = [],
  queryableHelpers,
  attackPatterns,
  topBarButtons,
  reloadContentCount = 0,
  contextId,
}: Props<T>) => {
  // Standard hooks
  const { classes } = useStyles();
  const { t } = useFormatter();

  const [properties, setProperties] = useState<PropertySchemaDTO[]>([]);
  const [options, setOptions] = useState<OptionPropertySchema[]>([]);

  useEffect(() => {
    if (entityPrefix) {
      useFilterableProperties(entityPrefix, availableFilterNames).then((propertySchemas: PropertySchemaDTO[]) => {
        const newOptions = propertySchemas.filter(property => property.schema_property_name !== MITRE_FILTER_KEY)
          .map(property => (
            { id: property.schema_property_name, label: t(property.schema_property_name), operator: availableOperators(property)[0] } as OptionPropertySchema
          ))
          .sort((a, b) => a.label.localeCompare(b.label));
        setOptions(newOptions);
        setProperties(propertySchemas);
      });
    }
  }, []);

  useEffect(() => {
    // Modify URI
    if (queryableHelpers.uriHelpers) {
      queryableHelpers.uriHelpers.updateUri();
    }

    // Fetch datas
    fetch(searchPaginationInput).then((result: { data: Page<T> }) => {
      const { data } = result;
      setContent(data.content);
      queryableHelpers.paginationHelpers.handleChangeTotalElements(data.totalElements);
    });
  }, [searchPaginationInput, reloadContentCount]);

  // Filters
  const [pristine, setPristine] = useState(true);
  const [openMitreFilter, setOpenMitreFilter] = React.useState(false);

  const computeAttackPatternNameForFilter = () => {
    return searchPaginationInput.filterGroup?.filters?.filter(
      (f: Filter) => f.key === MITRE_FILTER_KEY,
    )?.[0]?.values?.map(
      (externalId: string) => attackPatterns?.find(
        (a: AttackPattern) => a.attack_pattern_external_id === externalId,
      )?.attack_pattern_name,
    );
  };

  // TopBarChildren
  let topBarButtonComponent;
  if (topBarButtons) {
    topBarButtonComponent = React.cloneElement(topBarButtons as React.ReactElement);
  }

  return (
    <>
      <div className={disablePagination ? classes.parametersWithoutPagination : classes.parameters}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {searchEnable && (
            <TextSearchComponent
              textSearch={searchPaginationInput.textSearch}
              textSearchHelpers={queryableHelpers.textSearchHelpers}
            />
          )}
          <FilterAutocomplete
            filterGroup={searchPaginationInput.filterGroup}
            helpers={queryableHelpers.filterHelpers}
            options={options}
            setPristine={setPristine}
            style={{ marginLeft: searchEnable ? 10 : 0 }}
          />
          {queryableHelpers.filterHelpers && availableFilterNames?.includes('injector_contract_attack_patterns') && (
            <>
              <div style={{ cursor: 'pointer' }} onClick={() => setOpenMitreFilter(true)}>
                <Button variant="outlined" style={{ marginLeft: searchEnable ? 10 : 0, border: '1px solid #c74227' }}>
                  <img src={mitreAttack} alt="MITRE ATT&CK" style={{ width: 60 }} />
                </Button>
              </div>
              <Drawer
                open={openMitreFilter}
                handleClose={() => setOpenMitreFilter(false)}
                title={t('ATT&CK Matrix')}
                variant="full"
              >
                <MitreFilter helpers={queryableHelpers.filterHelpers} onClick={() => setOpenMitreFilter(false)} />
              </Drawer>
            </>
          )}
          {availableFilterNames?.includes('injector_contract_players') && (
            <div style={{ marginLeft: 10 }}>
              <InjectorContractSwitchFilter filterHelpers={queryableHelpers.filterHelpers} filterGroup={searchPaginationInput.filterGroup} />
            </div>
          )}
        </div>
        <div className={classes.topbar}>
          {!disablePagination && (
            <TablePaginationComponentV2
              page={searchPaginationInput.page}
              size={searchPaginationInput.size}
              paginationHelpers={queryableHelpers.paginationHelpers}
            />
          )}
          {!!topBarButtonComponent && topBarButtonComponent}
        </div>
      </div>
      {/* Handle Mitre Filter */}
      {queryableHelpers.filterHelpers && searchPaginationInput.filterGroup && (
        <>
          {!isEmptyFilter(searchPaginationInput.filterGroup, MITRE_FILTER_KEY) && (
            <Box
              sx={{
                padding: '12px 4px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Chip
                style={{ borderRadius: 4 }}
                label={(
                  <>
                    <strong>{t('Attack Pattern')}</strong>
                    {' '}
                    =
                    {' '}
                    {computeAttackPatternNameForFilter()}
                  </>
                )}
                onDelete={() => queryableHelpers.filterHelpers.handleRemoveFilterByKey(MITRE_FILTER_KEY)}
              />
              {(searchPaginationInput.filterGroup?.filters?.filter(f => availableFilterNames?.filter(n => n !== MITRE_FILTER_KEY).includes(f.key)).length ?? 0) > 0 && (
                <ClickableModeChip
                  onClick={queryableHelpers.filterHelpers.handleSwitchMode}
                  mode={searchPaginationInput.filterGroup.mode}
                />
              )}
            </Box>
          )}
        </>
      )}
      <FilterChips
        propertySchemas={properties}
        filterGroup={searchPaginationInput.filterGroup}
        availableFilterNames={availableFilterNames?.filter(n => n !== MITRE_FILTER_KEY)}
        helpers={queryableHelpers.filterHelpers}
        pristine={pristine}
        contextId={contextId}
      />
    </>
  );
};

export default PaginationComponentV2;
