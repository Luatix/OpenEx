import { HighlightOffOutlined, KeyboardArrowRight } from '@mui/icons-material';
import { Chip, Grid, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip,
} from '@mui/material';
import { CSSProperties, FunctionComponent, useMemo, useRef, useState } from 'react';
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
import {
  AttackPattern,
  FilterGroup,
  InjectInput, InjectorContract,
  InjectorContractOutput,
  KillChainPhase,
} from '../../../../utils/api-types';
import computeAttackPatterns from '../../../../utils/injector_contract/InjectorContractUtils';
import { isNotEmptyField } from '../../../../utils/utils';
// import CreateInjectDetails from './CreateInjectDetails';
import InjectDetailsForm from './form/InjectDetailsForm';
import { InjectorContractContent } from './form/InjectFormType';
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
  onCreateInject: (data: InjectInput) => Promise<void>;
  isAtomic?: boolean;
  open?: boolean;
  handleClose: () => void;
  presetInjectDuration?: number;
}

const CreateInject: FunctionComponent<Props> = ({ title, onCreateInject, open = false, handleClose, isAtomic = false, presetInjectDuration = 0, ...props }) => {
  // Standard hooks
  const { classes } = useStyles();
  const drawerRef = useRef<HTMLDivElement | null>(null);
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
  const initSearchPaginationInput = () => {
    return ({
      sorts: initSorting('injector_contract_labels'),
      filterGroup: isAtomic ? addAtomicFilter(quickFilter) : quickFilter,
      size: 100,
      page: 0,
    });
  };

  const { queryableHelpers, searchPaginationInput } = useQueryableWithLocalStorage(isAtomic ? 'injector-contracts-atomic' : 'injector-contracts', initSearchPaginationInput());

  const [selectedContract, setSelectedContract] = useState<Omit<InjectorContractOutput, 'injector_contract_content'> & {
    injector_contract_content: InjectorContractContent;
  } | null>(null);
  const selectContract = (contract: InjectorContractOutput) => {
    if (drawerRef.current) {
      drawerRef.current.scrollTop = 0;
    }
    const parsedContract: Omit<InjectorContractOutput, 'injector_contract_content'> & {
      injector_contract_content: InjectorContractContent;
    } = { ...contract, injector_contract_content: JSON.parse(contract.injector_contract_content) };
    setSelectedContract(parsedContract);
  };

  const handleCloseDrawer = () => {
    setSelectedContract(null);
    handleClose();
  };

  let selectedContractKillChainPhase = null;
  if (selectedContract) {
    const selectedContractAttackPatterns = computeAttackPatterns(selectedContract?.injector_contract_attack_patterns, attackPatternsMap);
    const killChainPhaseForSelection = selectedContractAttackPatterns
      .flatMap((contractAttackPattern: AttackPattern) => contractAttackPattern.attack_pattern_kill_chain_phases ?? [])
      .at(0);
    selectedContractKillChainPhase = killChainPhaseForSelection && killChainPhasesMap[killChainPhaseForSelection] && killChainPhasesMap[killChainPhaseForSelection].phase_name;
  }

  return (
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
            {contracts.map((contract) => {
              const contractAttackPatterns = computeAttackPatterns(contract.injector_contract_attack_patterns, attackPatternsMap);
              const contractKillChainPhase = contractAttackPatterns
                .flatMap((contractAttackPattern: AttackPattern) => contractAttackPattern.attack_pattern_kill_chain_phases ?? [])
                .at(0);
              const resolvedContractKillChainPhase = contractKillChainPhase && killChainPhasesMap[contractKillChainPhase];
              return (
                <ListItemButton
                  key={contract.injector_contract_id}
                  divider
                  onClick={() => selectContract(contract)}
                  selected={selectedContract?.injector_contract_id === contract.injector_contract_id}
                  disabled={(selectedContract?.injector_contract_id === contract.injector_contract_id)}
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
          <InjectDetailsForm
            injectorContractLabel={selectedContract?.injector_contract_labels ? tPick(selectedContract?.injector_contract_labels) : t('Select an inject in the left panel')}
            injectContractIcon={selectedContract ? (
              <InjectIcon
                type={selectedContract?.injector_contract_injector_type}
                isPayload={false}
              />
            ) : undefined}
            injectHeaderAction={(
              <IconButton aria-label="delete" disabled={!selectedContract} onClick={() => setSelectedContract(null)}>
                <HighlightOffOutlined />
              </IconButton>
            )}
            injectHeaderTitle={selectedContractKillChainPhase || t('Kill chain phase')}
            isAtomic={isAtomic}
            disabled={!selectedContract}
            defaultInject={{
              inject_title: tPick(selectedContract?.injector_contract_labels),
              inject_description: '',
              inject_depends_duration: presetInjectDuration,
              inject_injector_contract: {
                injector_contract_id: selectedContract?.injector_contract_id ?? '',
                injector_contract_arch: selectedContract?.injector_contract_arch,
              } as InjectorContract,
              inject_type: selectedContract?.injector_contract_content?.config?.type,
              inject_teams: [],
              inject_assets: [],
              inject_asset_groups: [],
              inject_documents: [],
            }}
            injectorContractContent={selectedContract?.injector_contract_content}
            drawerRef={drawerRef}
            handleClose={handleClose}
            onSubmitInject={onCreateInject}
            isCreation
            {...props}
          />
        </Grid>
      </Grid>
    </Drawer>
  );
};

export default CreateInject;
