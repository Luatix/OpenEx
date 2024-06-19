import React, { CSSProperties, useState } from 'react';
import { makeStyles } from '@mui/styles';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { TableViewOutlined } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useFormatter } from '../../../../components/i18n';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import SortHeadersComponent from '../../../../components/common/pagination/SortHeadersComponent';
import type { RawPaginationImportMapper, SearchPaginationInput } from '../../../../utils/api-types';
import { searchMappers } from '../../../../actions/xls_formatter/xls-formatter-actions';
import { initSorting } from '../../../../components/common/pagination/Page';
import Empty from '../../../../components/Empty';
import { useHelper } from '../../../../store';
import type { UserHelper } from '../../../../actions/helper';
import DataIngestionMenu from '../DataIngestionMenu';
import XlsFormatterCreation from './xls_formatter/XlsFormatterCreation';
import PaginationComponent from '../../../../components/common/pagination/PaginationComponent';

const useStyles = makeStyles(() => ({
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
  itemHead: {
    paddingLeft: 10,
    marginBottom: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
}));

const inlineStyles: Record<string, CSSProperties> = {
  mapper_name: {
    width: '30%',
    cursor: 'default',
  },
};

const XlsFormatters = () => {
  // Standard hooks
  const classes = useStyles();
  const { t } = useFormatter();

  // Query param
  const [searchParams] = useSearchParams();
  const [search] = searchParams.getAll('search');

  const { userAdmin } = useHelper((helper: UserHelper) => ({
    userAdmin: helper.getMe()?.user_admin ?? false,
  }));

  // Headers
  const headers = [
    {
      field: 'mapper_name',
      label: 'Name',
      isSortable: true,
      value: (mapper: RawPaginationImportMapper) => mapper.import_mapper_name,
    },
  ];

  const [mappers, setMappers] = useState<RawPaginationImportMapper[]>([]);
  const [searchPaginationInput, setSearchPaginationInput] = useState<SearchPaginationInput>({
    sorts: initSorting('import_mapper_name'),
    textSearch: search,
  });

  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Settings') }, { label: t('Data ingestion') }, { label: t('Xls formatters'), current: true }]} />
      <DataIngestionMenu />
      <PaginationComponent
        fetch={searchMappers}
        searchPaginationInput={searchPaginationInput}
        setContent={setMappers}
      />
      <List>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
        >
          <ListItemIcon />
          <ListItemText
            primary={
              <SortHeadersComponent
                headers={headers}
                inlineStylesHeaders={inlineStyles}
                searchPaginationInput={searchPaginationInput}
                setSearchPaginationInput={setSearchPaginationInput}
                defaultSortAsc
              />
            }
          />
        </ListItem>
        {
          mappers.map((mapper) => {
            return (
              <ListItem
                key={mapper.import_mapper_id}
                classes={{ root: classes.item }}
                divider={true}
              >
                <ListItemIcon>
                  <TableViewOutlined color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <div className={classes.bodyItems}>
                      {headers.map((header) => (
                        <div
                          key={header.field}
                          className={classes.bodyItem}
                          style={inlineStyles[header.field]}
                        >
                          {header.value(mapper)}
                        </div>
                      ))}
                    </div>
                  }
                />
              </ListItem>

            );
          })
        }
        {!mappers ? (<Empty message={t('No data available')} />) : null}
      </List>
      {userAdmin && <XlsFormatterCreation />}
    </>
  );
};

export default XlsFormatters;
