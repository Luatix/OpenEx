import { Chip, Grid, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper,Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { CSSProperties, useMemo, useState } from 'react';

import { fetchCollectors } from '../../../actions/Collector';
import type { CollectorHelper } from '../../../actions/collectors/collector-helper';
import { fetchDocuments } from '../../../actions/Document';
import type { DocumentHelper } from '../../../actions/helper';
import { searchPayloads } from '../../../actions/Payload';
import type { PayloadStore } from '../../../actions/payloads/Payload';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Drawer from '../../../components/common/Drawer';
import ExportButton from '../../../components/common/ExportButton';
import { buildEmptyFilter } from '../../../components/common/queryable/filter/FilterUtils';
import { initSorting } from '../../../components/common/queryable/Page';
import PaginationComponentV2 from '../../../components/common/queryable/pagination/PaginationComponentV2';
import { buildSearchPagination } from '../../../components/common/queryable/QueryableUtils';
import SortHeadersComponentV2 from '../../../components/common/queryable/sort/SortHeadersComponentV2';
import { useQueryableWithLocalStorage } from '../../../components/common/queryable/useQueryableWithLocalStorage';
import { Header } from '../../../components/common/SortHeadersList';
import { useFormatter } from '../../../components/i18n';
import ItemCopy from '../../../components/ItemCopy';
import ItemTags from '../../../components/ItemTags';
import PayloadIcon from '../../../components/PayloadIcon';
import PlatformIcon from '../../../components/PlatformIcon';
import { useHelper } from '../../../store';
import { AttackPattern, PayloadPrerequisite, PayloadArgument } from '../../../utils/api-types';
import { useAppDispatch } from '../../../utils/hooks';
import useDataLoader from '../../../utils/hooks/useDataLoader';
import { emptyFilled } from '../../../utils/String';
import CreatePayload from './CreatePayload';
import PayloadPopover from './PayloadPopover';

const useStyles = makeStyles(() => ({
  itemHead: {
    textTransform: 'uppercase',
  },
  item: {
    height: 50,
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
    boxSizing: 'content-box',
  },
  chip: {
    fontSize: 12,
    height: 25,
    margin: '0 7px 7px 0',
    textTransform: 'uppercase',
    borderRadius: 4,
    width: 180,
  },
  chipInList: {
    fontSize: 12,
    height: 20,
    float: 'left',
    textTransform: 'uppercase',
    borderRadius: 4,
    width: 150,
  },
  chipInList2: {
    fontSize: 12,
    height: 20,
    float: 'left',
    textTransform: 'uppercase',
    borderRadius: 4,
    width: 120,
  },
}));

const inlineStyles: Record<string, CSSProperties> = {
  payload_type: {
    width: '10%',
  },
  payload_name: {
    width: '20%',
  },
  payload_platforms: {
    width: '10%',
  },
  payload_description: {
    width: '10%',
  },
  payload_tags: {
    width: '20%',
  },
  payload_source: {
    width: '10%',
  },
  payload_status: {
    width: '10%',
  },
  payload_updated_at: {
    width: '10%',
  },
};

const Payloads = () => {
  // Standard hooks
  const classes = useStyles();
  const { t, nsdt } = useFormatter();
  const dispatch = useAppDispatch();

  const [selectedPayload, setSelectedPayload] = useState<PayloadStore | null>(null);
  const { documentsMap, collectorsMap } = useHelper((helper: DocumentHelper & CollectorHelper) => ({
    documentsMap: helper.getDocumentsMap(),
    collectorsMap: helper.getCollectorsMap(),
  }));
  useDataLoader(() => {
    dispatch(fetchDocuments());
    dispatch(fetchCollectors());
  });

  // Headers
  const headers: Header[] = useMemo(() => [
    {
      field: 'payload_type',
      label: 'Type',
      isSortable: false,
      value: (payload: PayloadStore) => (
        <Chip
          variant="outlined"
          classes={{ root: classes.chipInList }}
          color="primary"
          label={t(payload.payload_type)}
        />
      ),
    },
    {
      field: 'payload_name',
      label: 'Name',
      isSortable: true,
      value: (payload: PayloadStore) => <>{payload.payload_name}</>,
    },
    {
      field: 'payload_platforms',
      label: 'Platforms',
      isSortable: false,
      value: (payload: PayloadStore) => (
        <>
          {payload.payload_platforms?.map(
            platform => <PlatformIcon key={platform} platform={platform} tooltip width={20} marginRight={10} />,
          )}
        </>
      ),
    },
    {
      field: 'payload_description',
      label: 'Description',
      isSortable: true,
      value: (payload: PayloadStore) => <>{payload.payload_description}</>,
    },
    {
      field: 'payload_tags',
      label: 'Tags',
      isSortable: false,
      value: (payload: PayloadStore) => (
        <ItemTags
          variant="reduced-view"
          tags={payload.payload_tags}
        />
      ),
    },
    {
      field: 'payload_source',
      label: 'Source',
      isSortable: true,
      value: (payload: PayloadStore) => (
        <Chip
          variant="outlined"
          classes={{ root: classes.chipInList2 }}
          color="primary"
          label={t(payload.payload_source ?? 'MANUAL')}
        />
      ),
    },
    {
      field: 'payload_status',
      label: 'Status',
      isSortable: false,
      value: (payload: PayloadStore) => (
        <Chip
          variant="outlined"
          classes={{ root: classes.chipInList2 }}
          color={payload.payload_status === 'VERIFIED' ? 'success' : 'warning'}
          label={t(payload.payload_status ?? 'UNVERIFIED')}
        />
      ),
    },
    {
      field: 'payload_updated_at',
      label: 'Updated',
      isSortable: true,
      value: (payload: PayloadStore) => <>{nsdt(payload.payload_updated_at)}</>,
    },
  ], []);

  const availableFilterNames = [
    'payload_attack_patterns',
    'payload_description',
    'payload_name',
    'payload_platforms',
    'payload_source',
    'payload_status',
    'payload_tags',
    'payload_updated_at',
    'executable_arch',
  ];
  const [payloads, setPayloads] = useState<PayloadStore[]>([]);
  const { queryableHelpers, searchPaginationInput } = useQueryableWithLocalStorage('payloads', buildSearchPagination({
    sorts: initSorting('payload_name'),
    filterGroup: {
      mode: 'and',
      filters: [
        buildEmptyFilter('payload_attack_patterns', 'contains'),
        buildEmptyFilter('payload_platforms', 'contains'),
      ],
    },
  }));

  // Export
  const exportProps = {
    exportType: 'payloads',
    exportKeys: [
      'payload_type',
      'payload_name',
      'payload_description',
      'payload_source',
      'payload_status',
      'payload_created_at',
      'payload_updated_at',
    ],
    exportData: payloads,
    exportFileName: `${t('Payloads')}.csv`,
  };

  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Components') }, { label: t('Payloads'), current: true }]} />
      <PaginationComponentV2
        fetch={searchPayloads}
        searchPaginationInput={searchPaginationInput}
        setContent={setPayloads}
        entityPrefix="payload"
        availableFilterNames={availableFilterNames}
        queryableHelpers={queryableHelpers}
        topBarButtons={
          <ExportButton totalElements={queryableHelpers.paginationHelpers.getTotalElements()} exportProps={exportProps} />
        }
      />
      <List>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
          secondaryAction={<>&nbsp;</>}
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
        {payloads.map((payload: PayloadStore) => {
          const collector = payload.payload_collector ? collectorsMap[payload.payload_collector] : null;
          return (
            (
              <ListItem
                key={payload.payload_id}
                divider
                secondaryAction={(
                  <PayloadPopover
                    documentsMap={documentsMap}
                    payload={payload}
                    onUpdate={(result: PayloadStore) => setPayloads(payloads.map(a => (a.payload_id !== result.payload_id ? a : result)))}
                    onDuplicate={(result: PayloadStore) => setPayloads([result, ...payloads])}
                    onDelete={(result: string) => setPayloads(payloads.filter(a => (a.payload_id !== result)))}
                    disabled={collector !== null}
                  />
                )}
                disablePadding
              >
                <ListItemButton
                  classes={{ root: classes.item }}
                  onClick={() => setSelectedPayload(payload)}
                >
                  <ListItemIcon>
                    {collector ? (
                      <img
                        src={`/api/images/collectors/${collector.collector_type}`}
                        alt={collector.collector_type}
                        style={{
                          padding: 0,
                          cursor: 'pointer',
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                        }}
                      />
                    ) : (
                      <PayloadIcon payloadType={payload.payload_type ?? ''} />
                    )}
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
                            {header.value?.(payload)}
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </ListItemButton>
              </ListItem>
            )
          );
        })}
      </List>
      <CreatePayload
        onCreate={(result: PayloadStore) => setPayloads([result, ...payloads])}
      />
      <Drawer
        open={selectedPayload !== null}
        handleClose={() => setSelectedPayload(null)}
        title={t('Selected payload')}
      >
        <Grid container spacing={3}>
          <Grid item xs={10} style={{ paddingTop: 10 }}>
            <Typography
              variant="h2"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {selectedPayload?.payload_name}
            </Typography>

            <Typography
              variant="body2"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {emptyFilled(selectedPayload?.payload_description)}
            </Typography>
          </Grid>

          <Grid item xs={6} style={{ paddingTop: 10 }}>
            <Typography
              variant="h3"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {t('Platforms')}
            </Typography>
            {(selectedPayload?.payload_platforms ?? []).length === 0 ? (
              <PlatformIcon platform={t('No inject in this scenario')} tooltip width={25} />
            ) : selectedPayload?.payload_platforms?.map(
              platform => <PlatformIcon key={platform} platform={platform} tooltip width={25} marginRight={10} />,
            )}
            {(selectedPayload?.executable_arch) && (
              <>
                <Typography
                  variant="h3"
                  gutterBottom
                  style={{ marginTop: 20 }}
                >
                  {t('Architecture')}
                </Typography>
                {selectedPayload?.executable_arch}
              </>
            )}
            <Typography
              variant="h3"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {t('Tags')}
            </Typography>
            <ItemTags
              variant="reduced-view"
              tags={selectedPayload?.payload_tags}
            />
          </Grid>
          <Grid item xs={6} style={{ paddingTop: 10 }}>
            <Typography
              variant="h3"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {t('Attack patterns')}
            </Typography>
            {(selectedPayload?.payload_attack_patterns ?? []).length === 0 ? '-' : selectedPayload?.payload_attack_patterns?.map((attackPattern: AttackPattern) => (
              <Tooltip key={attackPattern.attack_pattern_id} title={`[${attackPattern.attack_pattern_external_id}] ${attackPattern.attack_pattern_name}`}>
                <Chip
                  variant="outlined"
                  classes={{ root: classes.chip }}
                  color="primary"
                  label={`[${attackPattern.attack_pattern_external_id}] ${attackPattern.attack_pattern_name}`}
                />
              </Tooltip>
            ))}
            <Typography
              variant="h3"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {t('External ID')}
            </Typography>
            {selectedPayload?.payload_external_id && selectedPayload?.payload_external_id.length > 0 ? (
              <pre>
                <ItemCopy content={selectedPayload?.payload_external_id} />
              </pre>
            ) : '-'}
          </Grid>
          <Grid item xs={12} style={{ paddingTop: 10 }}>
            <Typography
              variant="h3"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {t('Command executor')}
            </Typography>
            {selectedPayload?.command_executor}
            <Typography
              variant="h3"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {t('Content')}
            </Typography>
            <pre>
              <ItemCopy content={
                selectedPayload?.command_content ?? selectedPayload?.dns_resolution_hostname ?? selectedPayload?.file_drop_file ?? selectedPayload?.executable_file ?? ''
              }
              />
            </pre>
            <Typography
              variant="h3"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {t('Arguments')}
            </Typography>
            {
              selectedPayload?.payload_arguments && selectedPayload?.payload_arguments.length === 0 ? '-'
                : (
                    <TableContainer component={Paper}>
                      <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                          <TableRow sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                            <TableCell width="30%">{t('Type')}</TableCell>
                            <TableCell width="30%">{t('Key')}</TableCell>
                            <TableCell width="30%">{t('Default value')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedPayload?.payload_arguments?.map((argument: PayloadArgument) => {
                            return (
                              <>
                                <TableRow
                                  key={argument.key}
                                >
                                  <TableCell>
                                    {argument.type}
                                  </TableCell>
                                  <TableCell>
                                    {argument.key}
                                  </TableCell>
                                  <TableCell>
                                    {argument.default_value}
                                  </TableCell>
                                </TableRow>
                              </>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )
            }

            <Typography
              variant="h3"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {t('Prerequisites')}
            </Typography>
            {
              selectedPayload?.payload_prerequisites && selectedPayload?.payload_prerequisites.length === 0 ? '-'
                : (
                    <TableContainer component={Paper}>
                      <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                          <TableRow sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                            <TableCell width="30%">{t('Command executor')}</TableCell>
                            <TableCell width="30%">{t('Get command')}</TableCell>
                            <TableCell width="30%">{t('Check command')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedPayload?.payload_prerequisites?.map((prerequisite: PayloadPrerequisite) => {
                            return (
                              <>
                                <TableRow
                                  key={prerequisite.executor}
                                >
                                  <TableCell>
                                    {prerequisite.executor}
                                  </TableCell>
                                  <TableCell>
                                    {prerequisite.get_command}
                                  </TableCell>
                                  <TableCell>
                                    {prerequisite.check_command}
                                  </TableCell>
                                </TableRow>
                              </>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )
            }
            <Typography
              variant="h3"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {t('Cleanup executor')}
            </Typography>
            {selectedPayload?.payload_cleanup_executor}
            <Typography
              variant="h3"
              gutterBottom
              style={{ marginTop: 20 }}
            >
              {t('Cleanup command')}
            </Typography>
            {selectedPayload?.payload_cleanup_command && selectedPayload?.payload_cleanup_command.length > 0
              ? <pre><ItemCopy content={selectedPayload?.payload_cleanup_command} /></pre> : '-'}

          </Grid>
        </Grid>
      </Drawer>
    </>
  );
};

export default Payloads;
