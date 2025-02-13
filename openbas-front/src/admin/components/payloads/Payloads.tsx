import { Chip, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { type CSSProperties, useMemo, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { fetchCollectors } from '../../../actions/Collector';
import { type CollectorHelper } from '../../../actions/collectors/collector-helper';
import { fetchDocuments } from '../../../actions/Document';
import { type DocumentHelper } from '../../../actions/helper';
import { searchPayloads } from '../../../actions/Payload';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Drawer from '../../../components/common/Drawer';
import ExportButton from '../../../components/common/ExportButton';
import { buildEmptyFilter } from '../../../components/common/queryable/filter/FilterUtils';
import { initSorting } from '../../../components/common/queryable/Page';
import PaginationComponentV2 from '../../../components/common/queryable/pagination/PaginationComponentV2';
import { buildSearchPagination } from '../../../components/common/queryable/QueryableUtils';
import SortHeadersComponentV2 from '../../../components/common/queryable/sort/SortHeadersComponentV2';
import { useQueryableWithLocalStorage } from '../../../components/common/queryable/useQueryableWithLocalStorage';
import { type Header } from '../../../components/common/SortHeadersList';
import { useFormatter } from '../../../components/i18n';
import ItemTags from '../../../components/ItemTags';
import PayloadIcon from '../../../components/PayloadIcon';
import PlatformIcon from '../../../components/PlatformIcon';
import { useHelper } from '../../../store';
import { type Payload } from '../../../utils/api-types';
import { useAppDispatch } from '../../../utils/hooks';
import useDataLoader from '../../../utils/hooks/useDataLoader';
import CreatePayload from './CreatePayload';
import PayloadComponent from './PayloadComponent';
import PayloadPopover from './PayloadPopover';

const useStyles = makeStyles()(() => ({
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

const chipSx = {
  fontSize: 12,
  height: 20,
  float: 'left',
  textTransform: 'uppercase',
  borderRadius: 1,
  width: 120,
};

const fromPayloadStatusToChipColor = (payloadStatus: string) => {
  switch (payloadStatus) {
    case 'VERIFIED':
      return 'success';
    case 'UNVERIFIED':
      return 'warning';
    case 'DEPRECATED':
    default:
      return 'default';
  }
};

const Payloads = () => {
  // Standard hooks
  const { classes } = useStyles();
  const { t, nsdt } = useFormatter();
  const dispatch = useAppDispatch();

  const [selectedPayload, setSelectedPayload] = useState<Payload | null>(null);
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
      value: (payload: Payload) => (
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
      value: (payload: Payload) => <>{payload.payload_name}</>,
    },
    {
      field: 'payload_platforms',
      label: 'Platforms',
      isSortable: false,
      value: (payload: Payload) => (
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
      value: (payload: Payload) => <>{payload.payload_description}</>,
    },
    {
      field: 'payload_tags',
      label: 'Tags',
      isSortable: false,
      value: (payload: Payload) => (
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
      value: (payload: Payload) => (
        <Chip
          variant="outlined"
          sx={chipSx}
          color="primary"
          label={t(payload.payload_source ?? 'MANUAL')}
        />
      ),
    },
    {
      field: 'payload_status',
      label: 'Status',
      isSortable: false,
      value: (payload: Payload) => (
        <Chip
          variant="outlined"
          classes={{ root: classes.chipInList2 }}
          color={fromPayloadStatusToChipColor(payload.payload_status)}
          label={t(payload.payload_status ?? 'UNVERIFIED')}
        />
      ),
    },
    {
      field: 'payload_updated_at',
      label: 'Updated',
      isSortable: true,
      value: (payload: Payload) => <>{nsdt(payload.payload_updated_at)}</>,
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
    'payload_execution_arch',
  ];
  const [payloads, setPayloads] = useState<Payload[]>([]);
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
        {payloads.map((payload: Payload) => {
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
                    onUpdate={(result: Payload) => setPayloads(payloads.map(a => (a.payload_id !== result.payload_id ? a : result)))}
                    onDuplicate={(result: Payload) => setPayloads([result, ...payloads])}
                    onDelete={(result: string) => setPayloads(payloads.filter(a => (a.payload_id !== result)))}
                    disableUpdate={collector !== null}
                    disableDelete={collector !== null && payload.payload_status !== 'DEPRECATED'}
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
        onCreate={(result: Payload) => setPayloads([result, ...payloads])}
      />
      <Drawer
        open={selectedPayload !== null}
        handleClose={() => setSelectedPayload(null)}
        title={t('Selected payload')}
      >
        <PayloadComponent selectedPayload={selectedPayload} />
      </Drawer>
    </>
  );
};

export default Payloads;
