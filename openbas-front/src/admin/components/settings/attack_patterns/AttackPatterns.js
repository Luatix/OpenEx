import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LockPattern } from 'mdi-material-ui';
import { searchAttackPatterns } from '../../../../actions/AttackPattern';
import CreateAttackPattern from './CreateAttackPattern';
import useDataLoader from '../../../../utils/ServerSideEvent';
import { useHelper } from '../../../../store';
import AttackPatternPopover from './AttackPatternPopover';
import TaxonomiesMenu from '../TaxonomiesMenu';
import { fetchKillChainPhases } from '../../../../actions/KillChainPhase';
import PaginationComponent from '../../../../components/common/pagination/PaginationComponent';
import SortHeadersComponent from '../../../../components/common/pagination/SortHeadersComponent';
import { initSorting } from '../../../../components/common/pagination/PaginationField';
import { useFormatter } from '../../../../components/i18n';

const useStyles = makeStyles(() => ({
  container: {
    margin: 0,
    padding: '0 200px 50px 0',
  },
  list: {
    marginTop: 10,
  },
  itemHead: {
    paddingLeft: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
  bodyItem: {
    height: '100%',
    fontSize: 13,
  },
}));

const headerStyles = {
  iconSort: {
    position: 'absolute',
    margin: '0 0 0 5px',
    padding: 0,
    top: '0px',
  },
  kill_chain_phase: {
    float: 'left',
    width: '20%',
    fontSize: 12,
    fontWeight: '700',
  },
  attack_pattern_external_id: {
    float: 'left',
    width: '15%',
    fontSize: 12,
    fontWeight: '700',
  },
  attack_pattern_name: {
    float: 'left',
    width: '35%',
    fontSize: 12,
    fontWeight: '700',
  },
  attack_pattern_created_at: {
    float: 'left',
    width: '12%',
    fontSize: 12,
    fontWeight: '700',
  },
  attack_pattern_updated_at: {
    float: 'left',
    width: '12%',
    fontSize: 12,
    fontWeight: '700',
  },
};

const inlineStyles = {
  kill_chain_phase: {
    float: 'left',
    width: '20%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  attack_pattern_external_id: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  attack_pattern_name: {
    float: 'left',
    width: '35%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  attack_pattern_created_at: {
    float: 'left',
    width: '12%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  attack_pattern_updated_at: {
    float: 'left',
    width: '12%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

const AttackPatterns = () => {
  // Standard hooks
  const classes = useStyles();
  const dispatch = useDispatch();
  const { t } = useFormatter();

  const { killChainPhasesMap } = useHelper((helper) => ({
    killChainPhasesMap: helper.getKillChainPhasesMap(),
  }));
  useDataLoader(() => {
    dispatch(fetchKillChainPhases());
  });

  // Headers
  const headers = [
    { field: 'kill_chain_phase', label: 'Kill chain phase', isSortable: false },
    { field: 'attack_pattern_external_id', label: 'External ID', isSortable: true },
    { field: 'attack_pattern_name', label: 'Name', isSortable: true },
    { field: 'attack_pattern_created_at', label: 'Created', isSortable: true },
    { field: 'attack_pattern_updated_at', label: 'Updated', isSortable: true },
  ];

  const [attackPatterns, setAttackPatterns] = useState([]);
  const [paginationField, setPaginationField] = useState({
    sorts: initSorting('attack_pattern_name'),
  });

  // Export
  const exportProps = {
    exportType: 'attack_pattern',
    exportKeys: [
      'attack_pattern_external_id',
      'attack_pattern_name',
      'attack_pattern_created_at',
      'attack_pattern_updated_at',
    ],
    exportData: attackPatterns,
    exportFileName: `${t('AttackPatterns')}.csv`,
  };

  return (
    <div className={classes.container}>
      <TaxonomiesMenu />
      <PaginationComponent
        fetch={searchAttackPatterns}
        paginationField={paginationField}
        setContent={setAttackPatterns}
        exportProps={exportProps}
      />
      <div className="clearfix" />
      <List classes={{ root: classes.list }}>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
        >
          <ListItemIcon>
            <span
              style={{
                padding: '0 8px 0 8px',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              &nbsp;
            </span>
          </ListItemIcon>
          <ListItemText
            primary={
              <SortHeadersComponent
                headers={headers}
                inlineStylesHeaders={headerStyles}
                paginationField={paginationField}
                setPaginationField={setPaginationField}
              />
            }
          />
          <ListItemSecondaryAction> &nbsp; </ListItemSecondaryAction>
        </ListItem>
        {attackPatterns.map((attackPattern) => (
          <ListItem
            key={attackPattern.attack_pattern_id}
            classes={{ root: classes.item }}
            divider={true}
          >
            <ListItemIcon>
              <LockPattern color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.kill_chain_phase}
                  >
                    {
                      attackPattern.attack_pattern_kill_chain_phases.at(0)
                        ? `[${killChainPhasesMap[attackPattern.attack_pattern_kill_chain_phases.at(0)]?.phase_kill_chain_name}] ${killChainPhasesMap[attackPattern.attack_pattern_kill_chain_phases.at(0)]?.phase_name}`
                        : '-'
                    }
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.attack_pattern_external_id}
                  >
                    {attackPattern.attack_pattern_external_id}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.attack_pattern_name}
                  >
                    {attackPattern.attack_pattern_name}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.attack_pattern_created_at}
                  >
                    {attackPattern.attack_pattern_created_at}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.attack_pattern_updated_at}
                  >
                    {attackPattern.attack_pattern_updated_at}
                  </div>
                </div>
              }
            />
            <ListItemSecondaryAction>
              <AttackPatternPopover
                killChainPhasesMap={killChainPhasesMap}
                attackPattern={attackPattern}
              />
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <CreateAttackPattern />
    </div>
  );
};

export default AttackPatterns;
