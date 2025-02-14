import { KeyboardArrowRight } from '@mui/icons-material';
import { Chip, Grid, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { CSSProperties, FunctionComponent, useEffect, useMemo, useRef, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import type { AttackPatternHelper } from '../../../../actions/attack_patterns/attackpattern-helper';
import { searchInjectorContracts } from '../../../../actions/InjectorContracts';
import type { InjectorHelper } from '../../../../actions/injectors/injector-helper';
import type { KillChainPhaseHelper } from '../../../../actions/kill_chain_phases/killchainphase-helper';
import Drawer from '../../../../components/common/Drawer';
import { buildEmptyFilter } from '../../../../components/common/queryable/filter/FilterUtils';
import { initSorting } from '../../../../components/common/queryable/Page';
import PaginationComponentV2 from '../../../../components/common/queryable/pagination/PaginationComponentV2';
import SortHeadersComponentV2 from '../../../../components/common/queryable/sort/SortHeadersComponentV2';
import { useQueryableWithLocalStorage } from '../../../../components/common/queryable/useQueryableWithLocalStorage';
import { Header } from '../../../../components/common/SortHeadersList';
import { useFormatter } from '../../../../components/i18n';
import PlatformIcon from '../../../../components/PlatformIcon';
import { useHelper } from '../../../../store';
import { AttackPattern, FilterGroup, Inject, InjectorContractOutput, KillChainPhase } from '../../../../utils/api-types';
import computeAttackPatterns from '../../../../utils/injector_contract/InjectorContractUtils';
import { isNotEmptyField } from '../../../../utils/utils';
import CreateInjectDetails from './CreateInjectDetails';
import InjectIcon from './InjectIcon';

const useStyles = makeStyles()(() => ({
  itemHead: {
    textTransform: 'uppercase',
  },
  bodyItems: {
    display: 'flex',
  },
  bodyItem: {
    height: 20,
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 10,
  },
  chipInList: {
    fontSize: 12,
    height: 20,
    float: 'left',
    textTransform: 'uppercase',
    borderRadius: 4,
    width: 80,
    marginRight: 5,
  },
  goIcon: {
    position: 'absolute',
    right: -10,
  },
}));

const inlineStyles: Record<string, CSSProperties> = {
  kill_chain_phase: {
    width: '20%',
  },
  injector_contract_labels: {
    width: '45%',
  },
  injector_contract_platforms: {
    width: '15%',
  },
  attack_patterns: {
    width: '20%',
  },
};

interface Props {
  title: string;
  onCreateInject: (data: Inject) => Promise<void>;
  isAtomic?: boolean;
  open?: boolean;
  handleClose: () => void;
  presetValues?: {
    inject_depends_duration_days?: number;
    inject_depends_duration_hours?: number;
    inject_depends_duration_minutes?: number;
  };
}

const CreateInject: FunctionComponent<Props> = ({ title, onCreateInject, open = false, handleClose, isAtomic = false, presetValues, ...props }) => {
  // Standard hooks
  const { classes } = useStyles();
  const drawerRef = useRef(null);
  const { t, tPick } = useFormatter();

  // Fetching data
  const { attackPatterns, attackPatternsMap, killChainPhasesMap } = useHelper((helper: AttackPatternHelper & KillChainPhaseHelper & InjectorHelper) => ({
    attackPatterns: helper.getAttackPatterns(),
    attackPatternsMap: helper.getAttackPatternsMap(),
    killChainPhasesMap: helper.getKillChainPhasesMap(),
  }));

  // Headers
  const headers: Header[] = useMemo(() => [
    {
      field: 'kill_chain_phase',
      label: 'Kill chain phase',
      isSortable: false,
      value: (_: InjectorContractOutput, killChainPhase: KillChainPhase, __: Record<string, AttackPattern>) => {
        return <>{(killChainPhase ? killChainPhase.phase_name : t('Unknown'))}</>;
      },
    },
    {
      field: 'injector_contract_labels',
      label: 'Label',
      isSortable: false,
      value: (contract: InjectorContractOutput, _: KillChainPhase, __: Record<string, AttackPattern>) => (
        <Tooltip title={tPick(contract.injector_contract_labels)}>
          <>{tPick(contract.injector_contract_labels)}</>
        </Tooltip>
      ),
    },
    {
      field: 'injector_contract_platforms',
      label: 'Platforms',
      isSortable: false,
      value: (contract: InjectorContractOutput, _: KillChainPhase, __: Record<string, AttackPattern>) => (
        <>
          {(contract.injector_contract_platforms ?? []).map(
            (platform: string) => <PlatformIcon key={platform} width={20} platform={platform} marginRight={10} />,
          )}
        </>
      ),
    },
    {
      field: 'attack_patterns',
      label: 'Attack patterns',
      isSortable: false,
      value: (contract: InjectorContractOutput, _: KillChainPhase, contractAttackPatterns: Record<string, AttackPattern>) => (
        <>
          {Object.values(contractAttackPatterns)
            .map((contractAttackPattern: AttackPattern) => (
              <Chip
                key={`${contract.injector_contract_id}-${contractAttackPattern.attack_pattern_id}-${Math.random()}`}
                variant="outlined"
                classes={{ root: classes.chipInList }}
                color="primary"
                label={contractAttackPattern.attack_pattern_external_id}
              />
            ))}
        </>
      ),
    },
  ], []);

  // Filters
  const quickFilter: FilterGroup = {
    mode: 'and',
    filters: [
      buildEmptyFilter('injector_contract_kill_chain_phases', 'contains'),
      buildEmptyFilter('injector_contract_injector', 'contains'),
      buildEmptyFilter('injector_contract_platforms', 'contains'),
    ],
  };

  const addAtomicFilter = (filterGroup: FilterGroup) => {
    const filters = filterGroup.filters ?? [];
    if (filters.map(f => f.key).includes('injector_contract_atomic_testing')) {
      return filterGroup;
    }

    filters.push({
      key: 'injector_contract_atomic_testing',
      operator: 'eq',
      values: ['true'],
    });

    return {
      ...filterGroup,
      filters,
    };
  };

  const availableFilterNames = [
    'injector_contract_attack_patterns',
    'injector_contract_injector',
    'injector_contract_kill_chain_phases',
    'injector_contract_labels',
    'injector_contract_platforms',
    'injector_contract_players',
    'injector_contract_arch',
  ];

  // Contracts
  const [contracts, setContracts] = useState<InjectorContractOutput[]>([]);
  // as we don't know the type of the content of a contract we need to put any here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parsedContentContracts, setParsedContentContracts] = useState<any[]>([]);
  const initSearchPaginationInput = () => {
    return ({
      sorts: initSorting('injector_contract_labels'),
      filterGroup: isAtomic ? addAtomicFilter(quickFilter) : quickFilter,
      size: 100,
      page: 0,
    });
  };

  const { queryableHelpers, searchPaginationInput } = useQueryableWithLocalStorage(isAtomic ? 'injector-contracts-atomic' : 'injector-contracts', initSearchPaginationInput());

  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  const selectContract = (contract: number) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    drawerRef.current.scrollTop = 0;
    setSelectedContract(contract);
  };
  const handleCloseDrawer = () => {
    setSelectedContract(null);
    handleClose();
  };
  useEffect(() => {
    if (contracts && contracts.length > 0) {
      setParsedContentContracts(contracts.map(c => JSON.parse(c.injector_contract_content)));
    }
    setSelectedContract(null);
  }, [contracts]);

  let selectedContractKillChainPhase = null;
  let selectedContractAttackPatterns = null;
  if (selectedContract !== null && contracts[selectedContract] !== undefined) {
    selectedContractAttackPatterns = computeAttackPatterns(contracts[selectedContract], attackPatternsMap);
    // eslint-disable-next-line max-len
    const killChainPhaseforSelection = selectedContractAttackPatterns.map((contractAttackPattern: AttackPattern) => contractAttackPattern.attack_pattern_kill_chain_phases ?? []).flat().at(0);
    selectedContractKillChainPhase = killChainPhaseforSelection && killChainPhasesMap[killChainPhaseforSelection] && killChainPhasesMap[killChainPhaseforSelection].phase_name;
  }

  return (
    <>
      <Drawer
        open={open}
        handleClose={handleCloseDrawer}
        title={title}
        variant="full"
        PaperProps={{
          ref: drawerRef,
        }}
        disableEnforceFocus
      >
        <Grid container spacing={3}>
          <Grid item xs={7} style={{ paddingTop: 30 }}>
            <PaginationComponentV2
              fetch={searchInjectorContracts}
              searchPaginationInput={searchPaginationInput}
              setContent={setContracts}
              entityPrefix="injector_contract"
              availableFilterNames={availableFilterNames}
              queryableHelpers={queryableHelpers}
              disablePagination
              attackPatterns={attackPatterns}
            />
            <List>
              <ListItem
                classes={{ root: classes.itemHead }}
                divider={false}
                style={{ paddingTop: 0 }}
              >
                <ListItemIcon />
                <ListItemText
                  primary={(
                    <SortHeadersComponentV2
                      headers={headers}
                      inlineStylesHeaders={inlineStyles}
                      sortHelpers={queryableHelpers.sortHelpers}
                    />
                  )}
                />
              </ListItem>
              {contracts.map((contract, index) => {
                const contractAttackPatterns = computeAttackPatterns(contract, attackPatternsMap);
                // eslint-disable-next-line max-len
                const contractKillChainPhase = contractAttackPatterns.map((contractAttackPattern: AttackPattern) => contractAttackPattern.attack_pattern_kill_chain_phases ?? []).flat().at(0);
                const resolvedContractKillChainPhase = contractKillChainPhase && killChainPhasesMap[contractKillChainPhase];
                return (
                  <ListItemButton
                    key={contract.injector_contract_id}
                    divider
                    onClick={() => selectContract(index)}
                    selected={selectedContract === index}
                    disabled={(selectedContract !== null && selectedContract !== index)}
                  >
                    <ListItemIcon>
                      <InjectIcon
                        variant="list"
                        type={contract.injector_contract_payload_type ?? contract.injector_contract_injector_type}
                        isPayload={isNotEmptyField(contract.injector_contract_payload_type)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={(
                        <div className={classes.bodyItems}>
                          {headers.map(header => (
                            <div
                              key={header.field}
                              className={classes.bodyItem}
                              style={inlineStyles[header.field]}
                            >
                              {header.value?.(contract, resolvedContractKillChainPhase, contractAttackPatterns)}
                            </div>
                          ))}
                        </div>
                      )}
                    />
                    <ListItemIcon classes={{ root: classes.goIcon }}>
                      <KeyboardArrowRight />
                    </ListItemIcon>
                  </ListItemButton>
                );
              })}
            </List>
          </Grid>
          <Grid item xs={5} style={{ paddingTop: 10 }}>
            <CreateInjectDetails
              drawerRef={drawerRef}
              contractId={selectedContract !== null && contracts?.length ? contracts[selectedContract]?.injector_contract_id : null}
              contractContent={selectedContract !== null ? parsedContentContracts[selectedContract] : null}
              contract={selectedContract !== null ? contracts[selectedContract] : null}
              setSelectedContract={setSelectedContract}
              selectedContractKillChainPhase={selectedContractKillChainPhase}
              selectedContractAttackPatterns={selectedContractAttackPatterns}
              handleClose={handleCloseDrawer}
              onCreateInject={onCreateInject}
              isAtomic={isAtomic}
              presetValues={presetValues}
              {...props}
            />
          </Grid>
        </Grid>
      </Drawer>
    </>
  );
};

export default CreateInject;
