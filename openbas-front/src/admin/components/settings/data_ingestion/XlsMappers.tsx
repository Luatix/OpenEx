import { TableViewOutlined } from '@mui/icons-material';
import { List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText } from '@mui/material';
import { type CSSProperties, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { searchMappers } from '../../../../actions/mapper/mapper-actions';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import PaginationComponent from '../../../../components/common/pagination/PaginationComponent';
import SortHeadersComponent from '../../../../components/common/pagination/SortHeadersComponent';
import { initSorting } from '../../../../components/common/queryable/Page';
import { buildSearchPagination } from '../../../../components/common/queryable/QueryableUtils';
import Empty from '../../../../components/Empty';
import { useFormatter } from '../../../../components/i18n';
import { type RawPaginationImportMapper, type SearchPaginationInput } from '../../../../utils/api-types';
import DataIngestionMenu from '../DataIngestionMenu';
import ImportUploaderMapper from './ImportUploaderMapper';
import XlsMapperCreation from './xls_mapper/XlsMapperCreation';
import XlsMapperPopover from './XlsMapperPopover';

const useStyles = makeStyles()(() => ({
  container: {
    padding: '0 200px 50px 0',
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
  bodyItems: {
    display: 'flex',
    alignItems: 'center',
  },
  bodyItem: {
    height: 20,
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 10,
  },
}));

const inlineStyles: Record<string, CSSProperties> = {
  import_mapper_name: {
    width: '30%',
    cursor: 'default',
  },
};

const XlsMappers = () => {
  // Standard hooks
  const { classes } = useStyles();
  const { t } = useFormatter();

  // Headers
  const headers = [
    {
      field: 'import_mapper_name',
      label: 'Name',
      isSortable: true,
      value: (mapper: RawPaginationImportMapper) => mapper.import_mapper_name,
    },
  ];

  const [mappers, setMappers] = useState<RawPaginationImportMapper[]>([]);
  const [searchPaginationInput, setSearchPaginationInput] = useState<SearchPaginationInput>(buildSearchPagination({
    sorts: initSorting('import_mapper_name'),
  }));

  return (
    <div className={classes.container}>
      <Breadcrumbs variant="list" elements={[{ label: t('Settings') }, { label: t('Data ingestion') }, { label: t('XLS mappers'), current: true }]} />
      <DataIngestionMenu />
      <PaginationComponent
        fetch={searchMappers}
        searchPaginationInput={searchPaginationInput}
        setContent={setMappers}
      >
        <ImportUploaderMapper />
      </PaginationComponent>
      <List>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
        >
          <ListItemIcon />
          <ListItemText
            primary={(
              <SortHeadersComponent
                headers={headers}
                inlineStylesHeaders={inlineStyles}
                searchPaginationInput={searchPaginationInput}
                setSearchPaginationInput={setSearchPaginationInput}
                defaultSortAsc
              />
            )}
          />
        </ListItem>
        {
          mappers.map((mapper) => {
            return (
              <ListItem
                key={mapper.import_mapper_id}
                classes={{ root: classes.item }}
                divider
              >
                <ListItemIcon>
                  <TableViewOutlined color="primary" />
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
                          {header.value(mapper)}
                        </div>
                      ))}
                    </div>
                  )}
                />
                <ListItemSecondaryAction>
                  <XlsMapperPopover
                    mapper={mapper}
                    onDuplicate={result => setMappers([result, ...mappers])}
                    onUpdate={result => setMappers(mappers.map(existing => (existing.import_mapper_id !== result.import_mapper_id ? existing : result)))}
                    onDelete={result => setMappers(mappers.filter(existing => (existing.import_mapper_id !== result)))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            );
          })
        }
        {!mappers ? (<Empty message={t('No data available')} />) : null}
      </List>
      <XlsMapperCreation onCreate={result => setMappers([result, ...mappers])} />
    </div>
  );
};

export default XlsMappers;
