import { Chip, Grid, List, Paper, Tooltip, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { fetchDocuments } from '../../../../actions/Document';
import { type DocumentHelper } from '../../../../actions/helper';
import Empty from '../../../../components/Empty';
import ExpandableMarkdown from '../../../../components/ExpandableMarkdown';
import { useFormatter } from '../../../../components/i18n';
import ItemStatus from '../../../../components/ItemStatus';
import Loader from '../../../../components/Loader';
import PlatformIcon from '../../../../components/PlatformIcon';
import SearchFilter from '../../../../components/SearchFilter';
import { useHelper } from '../../../../store';
import { type AttackPatternSimple, type InjectTargetWithResult, type KillChainPhaseSimple } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';
import useDataLoader from '../../../../utils/hooks/useDataLoader';
import useSearchAnFilter from '../../../../utils/SortingFiltering';
import { isNotEmptyField } from '../../../../utils/utils';
import InjectIcon from '../../common/injects/InjectIcon';
import ResponsePie from '../../common/injects/ResponsePie';
import { InjectResultOverviewOutputContext, type InjectResultOverviewOutputContextType } from '../InjectResultOverviewOutputContext';
import TargetListItem from './TargetListItem';
import TargetResultsDetail from './TargetResultsDetail';

const useStyles = makeStyles()(() => ({
  chip: {
    fontSize: 12,
    height: 25,
    margin: '0 7px 7px 0',
    textTransform: 'uppercase',
    borderRadius: 4,
    width: 180,
  },
  gridContainer: {
    marginBottom: 20,
  },
  paper: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: 15,
    borderRadius: 4,
  },
}));

const AtomicTesting = () => {
  // Standard hooks
  const { classes } = useStyles();
  const dispatch = useAppDispatch();
  const { t, tPick, fldt } = useFormatter();
  const [selectedTarget, setSelectedTarget] = useState<InjectTargetWithResult>();
  const [currentParentTarget, setCurrentParentTarget] = useState<InjectTargetWithResult>();
  const filtering = useSearchAnFilter('', 'name', ['name']);

  const { documentMap } = useHelper((helper: DocumentHelper) => ({
    documentMap: helper.getDocumentsMap(),
  }));
  useDataLoader(() => {
    dispatch(fetchDocuments());
  });

  // Fetching data
  const { injectResultOverviewOutput } = useContext<InjectResultOverviewOutputContextType>(InjectResultOverviewOutputContext);
  useEffect(() => {
    setSelectedTarget(selectedTarget || currentParentTarget || injectResultOverviewOutput?.inject_targets ? injectResultOverviewOutput?.inject_targets[0] : undefined);
  }, [injectResultOverviewOutput]);

  const sortedTargets: InjectTargetWithResult[] = filtering.filterAndSort(injectResultOverviewOutput?.inject_targets ?? []);

  // Handles
  const handleTargetClick = (target: InjectTargetWithResult, currentParent?: InjectTargetWithResult) => {
    setSelectedTarget(target);
    setCurrentParentTarget(currentParent);
  };

  if (!injectResultOverviewOutput) {
    return <Loader variant="inElement" />;
  }

  return (
    <Grid
      container
      spacing={3}
      classes={{ container: classes.gridContainer }}
    >
      <Grid item xs={6} style={{ paddingTop: 10 }}>
        <Typography variant="h4" gutterBottom>
          {t('Information')}
        </Typography>
        <Paper classes={{ root: classes.paper }} variant="outlined">
          <Grid container spacing={3}>
            <Grid item xs={8} style={{ paddingTop: 10 }}>
              <Typography
                variant="h3"
                gutterBottom
                style={{ marginTop: 20 }}
              >
                {t('Description')}
              </Typography>
              <ExpandableMarkdown
                source={injectResultOverviewOutput.inject_description}
                limit={300}
              />
            </Grid>
            <Grid item xs={4} style={{ paddingTop: 10 }}>
              <Typography
                variant="h3"
                gutterBottom
                style={{ marginTop: 20 }}
              >
                {t('Execution status')}
              </Typography>
              <ItemStatus
                isInject={true}
                status={injectResultOverviewOutput.inject_status?.status_name}
                label={t(injectResultOverviewOutput.inject_status?.status_name ?? 'Unknown')}
              />
            </Grid>
            <Grid item xs={4} style={{ paddingTop: 10 }}>
              <Typography
                variant="h3"
                gutterBottom
                style={{ marginTop: 20 }}
              >
                {t('Type')}
              </Typography>
              <div style={{ display: 'flex' }}>
                <InjectIcon
                  isPayload={isNotEmptyField(injectResultOverviewOutput.inject_injector_contract?.injector_contract_payload)}
                  type={
                    injectResultOverviewOutput.inject_injector_contract?.injector_contract_payload
                      ? injectResultOverviewOutput.inject_injector_contract.injector_contract_payload?.payload_collector_type
                      || injectResultOverviewOutput.inject_injector_contract.injector_contract_payload?.payload_type
                      : injectResultOverviewOutput.inject_type
                  }
                />
                <Tooltip title={tPick(injectResultOverviewOutput.inject_injector_contract?.injector_contract_labels)}>
                  <div style={{
                    marginLeft: 10,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  >
                    {tPick(injectResultOverviewOutput.inject_injector_contract?.injector_contract_labels)}
                  </div>
                </Tooltip>
              </div>
            </Grid>
            <Grid item xs={4} style={{ paddingTop: 10 }}>
              <Typography
                variant="h3"
                gutterBottom
                style={{ marginTop: 20 }}
              >
                {t('Last execution date')}
              </Typography>
              <div style={{ display: 'flex' }}>
                {fldt(injectResultOverviewOutput.inject_updated_at)}
              </div>
            </Grid>
            <Grid item xs={4} style={{ paddingTop: 10 }}>
              <Typography variant="h3" gutterBottom style={{ marginTop: 20 }}>
                {t('Documents')}
              </Typography>
              {
                injectResultOverviewOutput.injects_documents !== undefined && injectResultOverviewOutput.injects_documents.length > 0
                  ? injectResultOverviewOutput.injects_documents.map((documentId) => {
                      const document = documentMap[documentId];
                      return (
                        <Typography key={documentId} variant="body1">
                          {document?.document_name ?? '-'}
                        </Typography>
                      );
                    }) : (
                      <Typography variant="body1" gutterBottom>
                        -
                      </Typography>
                    )
              }
            </Grid>
            <Grid item xs={4} style={{ paddingTop: 10 }}>
              <Typography
                variant="h3"
                gutterBottom
                style={{ marginTop: 20 }}
              >
                {t('Platforms')}
              </Typography>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {injectResultOverviewOutput.inject_injector_contract?.injector_contract_platforms?.map((platform: string) => (
                  <div key={platform} style={{ display: 'flex', marginRight: 15 }}>
                    <PlatformIcon width={20} platform={platform} marginRight={5} />
                    {platform}
                  </div>
                ))}
              </div>
            </Grid>
            <Grid item xs={4} style={{ paddingTop: 10 }}>
              <Typography
                variant="h3"
                gutterBottom
                style={{ marginTop: 20 }}
              >
                {t('Kill Chain Phases')}
              </Typography>
              {(injectResultOverviewOutput.inject_kill_chain_phases ?? []).length === 0 && '-'}
              {injectResultOverviewOutput.inject_kill_chain_phases?.map((killChainPhase: KillChainPhaseSimple) => (
                <Chip
                  key={killChainPhase.phase_id}
                  variant="outlined"
                  classes={{ root: classes.chip }}
                  color="error"
                  label={killChainPhase.phase_name}
                />
              ))}
            </Grid>
            <Grid item xs={4} style={{ paddingTop: 10 }}>
              <Typography
                variant="h3"
                gutterBottom
                style={{ marginTop: 20 }}
              >
                {t('Attack Patterns')}
              </Typography>
              {(injectResultOverviewOutput.inject_attack_patterns ?? []).length === 0 && '-'}
              {injectResultOverviewOutput.inject_attack_patterns?.map((attackPattern: AttackPatternSimple) => (
                <Tooltip key={attackPattern.attack_pattern_id} title={`[${attackPattern.attack_pattern_external_id}] ${attackPattern.attack_pattern_name}`}>
                  <Chip
                    variant="outlined"
                    classes={{ root: classes.chip }}
                    color="primary"
                    label={`[${attackPattern.attack_pattern_external_id}] ${attackPattern.attack_pattern_name}`}
                  />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={6} style={{ paddingTop: 10 }}>
        <Typography variant="h4" gutterBottom>
          {t('Results')}
        </Typography>
        <Paper classes={{ root: classes.paper }} variant="outlined" style={{ display: 'flex', alignItems: 'center' }}>
          <ResponsePie expectationResultsByTypes={injectResultOverviewOutput.inject_expectation_results} />
        </Paper>
      </Grid>
      <Grid item xs={6} style={{ marginTop: 30 }}>
        <Typography variant="h4" gutterBottom style={{ float: 'left' }}>
          {t('Targets')}
        </Typography>
        <div style={{ float: 'right', marginTop: -15 }}>
          <SearchFilter
            onChange={filtering.handleSearch}
            keyword={filtering.keyword}
            placeholder={t('Search by target name')}
          />
        </div>
        <div className="clearfix" />
        <Paper classes={{ root: classes.paper }} variant="outlined">
          {sortedTargets.length > 0 ? (
            <List>
              {sortedTargets.map(target => (
                <div key={target?.id} style={{ marginBottom: 15 }}>
                  <TargetListItem
                    onClick={() => handleTargetClick(target, undefined)}
                    target={target}
                    selected={selectedTarget?.id === target.id && currentParentTarget?.id === undefined}
                  />
                  <List component="div" disablePadding>
                    {target?.children?.map(child => (
                      <TargetListItem
                        key={child?.id}
                        isChild
                        onClick={() => handleTargetClick(child, target)}
                        target={child}
                        selected={selectedTarget?.id === child.id && currentParentTarget?.id === target.id}
                      />
                    ))}
                  </List>
                </div>
              ))}
            </List>
          ) : (
            <Empty message={t('No target configured.')} />
          )}
        </Paper>
      </Grid>
      <Grid item xs={6} style={{ marginTop: 29 }}>
        <Typography variant="h4" gutterBottom>
          {t('Results by target')}
        </Typography>
        <Paper classes={{ root: classes.paper }} variant="outlined" style={{ marginTop: 18 }}>
          {selectedTarget && !!injectResultOverviewOutput.inject_type && (
            <TargetResultsDetail
              inject={injectResultOverviewOutput}
              parentTargetId={currentParentTarget?.id}
              target={selectedTarget}
              lastExecutionStartDate={injectResultOverviewOutput.inject_status?.tracking_sent_date || ''}
              lastExecutionEndDate={injectResultOverviewOutput.inject_status?.tracking_end_date || ''}
            />
          )}
          {!selectedTarget && (
            <Empty message={t('No target data available.')} />
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AtomicTesting;
