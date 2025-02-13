import { List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { type CSSProperties, useState } from 'react';
import { useSearchParams } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { searchSecurityPlatforms } from '../../../../actions/assets/securityPlatform-actions';
import { type UserHelper } from '../../../../actions/helper';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import PaginationComponent from '../../../../components/common/pagination/PaginationComponent';
import SortHeadersComponent from '../../../../components/common/pagination/SortHeadersComponent';
import { initSorting } from '../../../../components/common/queryable/Page';
import { buildSearchPagination } from '../../../../components/common/queryable/QueryableUtils';
import { useFormatter } from '../../../../components/i18n';
import ItemTags from '../../../../components/ItemTags';
import { useHelper } from '../../../../store';
import { type SearchPaginationInput, type SecurityPlatform } from '../../../../utils/api-types';
import { isNotEmptyField } from '../../../../utils/utils';
import SecurityPlatformCreation from './SecurityPlatformCreation';
import SecurityPlatformPopover from './SecurityPlatformPopover';

const useStyles = makeStyles()(() => ({
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
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 10,
  },
}));

const inlineStyles: Record<string, CSSProperties> = {
  asset_name: {
    width: '30%',
  },
  security_platform_type: {
    width: '15%',
    display: 'flex',
    alignItems: 'center',
  },
  asset_description: {
    width: '40%',
  },
  asset_tags: {
    width: '20%',
  },
};

const SecurityPlatforms = () => {
  // Standard hooks
  const { classes } = useStyles();
  const theme = useTheme();
  const { t } = useFormatter();

  // Query param
  const [searchParams] = useSearchParams();
  const [search] = searchParams.getAll('search');
  const [searchId] = searchParams.getAll('id');

  // Fetching data
  const { userAdmin } = useHelper((helper: UserHelper) => ({
    userAdmin: helper.getMe()?.user_admin ?? false,
  }));

  // Headers
  const headers = [
    { field: 'asset_name', label: 'Name', isSortable: true },
    { field: 'security_platform_type', label: 'Type', isSortable: true },
    { field: 'asset_description', label: 'Description', isSortable: true },
    { field: 'asset_tags', label: 'Tags', isSortable: true },
  ];

  const [securityPlatforms, setSecurityPlatforms] = useState<SecurityPlatform[]>([]);
  const [searchPaginationInput, setSearchPaginationInput] = useState<SearchPaginationInput>(buildSearchPagination({
    sorts: initSorting('asset_name'),
    textSearch: search,
  }));

  // Export
  const exportProps = {
    exportType: 'securityPlatform',
    exportKeys: [
      'asset_name',
      'security_platform_type',
      'asset_description',
      'asset_tags',
    ],
    exportData: securityPlatforms,
    exportFileName: `${t('Security Platforms')}.csv`,
  };

  return (
    <>
      <Breadcrumbs variant="list" elements={[{ label: t('Assets') }, { label: t('Security platforms'), current: true }]} />
      <PaginationComponent
        fetch={searchSecurityPlatforms}
        searchPaginationInput={searchPaginationInput}
        setContent={setSecurityPlatforms}
        exportProps={exportProps}
      />
      <List>
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
            primary={(
              <SortHeadersComponent
                headers={headers}
                inlineStylesHeaders={inlineStyles}
                searchPaginationInput={searchPaginationInput}
                setSearchPaginationInput={setSearchPaginationInput}
              />
            )}
          />
          <ListItemSecondaryAction> &nbsp; </ListItemSecondaryAction>
        </ListItem>
        {securityPlatforms.map((securityPlatform: SecurityPlatform) => {
          return (
            <ListItem
              key={securityPlatform.asset_id}
              classes={{ root: classes.item }}
              divider={true}
            >
              <ListItemIcon>
                <img
                  src={`/api/images/security_platforms/id/${securityPlatform.asset_id}/${theme.palette.mode}?${Date.now()}`}
                  alt={securityPlatform.asset_name}
                  style={{ width: 25, height: 25, borderRadius: 4 }}
                />
              </ListItemIcon>
              <ListItemText
                primary={(
                  <div className={classes.bodyItems}>
                    <div className={classes.bodyItem} style={inlineStyles.asset_name}>
                      {securityPlatform.asset_name}
                    </div>
                    <div className={classes.bodyItem} style={inlineStyles.security_platform_type}>
                      {securityPlatform.security_platform_type}
                    </div>
                    <div className={classes.bodyItem} style={inlineStyles.asset_description}>
                      {securityPlatform.asset_description}
                    </div>
                    <div className={classes.bodyItem} style={inlineStyles.asset_tags}>
                      <ItemTags variant="list" tags={securityPlatform.asset_tags} />
                    </div>
                  </div>
                )}
              />
              <ListItemSecondaryAction>
                <SecurityPlatformPopover
                  securityPlatform={{ ...securityPlatform, type: 'static' }}
                  onUpdate={result => setSecurityPlatforms(securityPlatforms.map(e => (e.asset_id !== result.asset_id ? e : result)))}
                  onDelete={result => setSecurityPlatforms(securityPlatforms.filter(e => (e.asset_id !== result)))}
                  openEditOnInit={securityPlatform.asset_id === searchId}
                  disabled={isNotEmptyField(securityPlatform.asset_external_reference)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
      {userAdmin && <SecurityPlatformCreation onCreate={result => setSecurityPlatforms([result, ...securityPlatforms])} />}
    </>
  );
};

export default SecurityPlatforms;
