import { List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText } from '@mui/material';
import { AttachMoneyOutlined } from '@mui/icons-material';
import React, { CSSProperties, FunctionComponent, useContext } from 'react';
import { makeStyles } from '@mui/styles';
import VariablePopover from './VariablePopover';
import useSearchAnFilter from '../../../../utils/SortingFiltering';
import type { Variable } from '../../../../utils/api-types';
import SearchFilter from '../../../../components/SearchFilter';
import CreateVariable from './CreateVariable';
import { PermissionsContext, VariableContext } from '../Context';

const useStyles = makeStyles(() => ({
  itemHead: {
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    height: 50,
  },
  bodyItem: {
    height: '100%',
    fontSize: 13,
  },
}));

const headerStyles: {
  iconSort: CSSProperties;
  variable_key: CSSProperties;
  variable_description: CSSProperties;
  variable_value: CSSProperties;
} = {
  iconSort: {
    position: 'absolute',
    margin: '0 0 0 5px',
    padding: 0,
    top: '0px',
  },
  variable_key: {
    float: 'left',
    width: '20%',
    fontSize: 12,
    fontWeight: '700',
  },
  variable_description: {
    float: 'left',
    width: '40%',
    fontSize: 12,
    fontWeight: '700',
  },
  variable_value: {
    float: 'left',
    width: '40%',
    fontSize: 12,
    fontWeight: '700',
  },
};

const inlineStyles: {
  variable_key: CSSProperties;
  variable_description: CSSProperties;
  variable_value: CSSProperties;
} = {
  variable_key: {
    float: 'left',
    width: '20%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  variable_description: {
    float: 'left',
    width: '40%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  variable_value: {
    float: 'left',
    width: '40%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

interface Props {
  variables: Variable[];
}

const Variables: FunctionComponent<Props> = ({
  variables,
}) => {
  // Standard hooks
  const classes = useStyles();

  // Context
  const { onEditVariable, onDeleteVariable } = useContext(VariableContext);
  const { permissions } = useContext(PermissionsContext);

  // Filter and sort hook
  const filtering = useSearchAnFilter('variable', 'key', [
    'key',
    'description',
  ]);

  const sortedVariables: [Variable] = filtering.filterAndSort(variables);
  return (
    <>
      <div>
        <div style={{ float: 'left', marginRight: 10 }}>
          <SearchFilter
            variant="small"
            onChange={filtering.handleSearch}
            keyword={filtering.keyword}
          />
        </div>
      </div>
      <div className="clearfix" />

      <List style={{ marginTop: 10 }}>
        <ListItem
          classes={{ root: classes.itemHead }}
          divider={false}
          style={{ paddingTop: 0 }}
        >
          <ListItemIcon>
            <span
              style={{ padding: '0 8px 0 10px', fontWeight: 700, fontSize: 12 }}
            >
              #
            </span>
          </ListItemIcon>
          <ListItemText
            primary={
              <div>
                {filtering.buildHeader(
                  'variable_key',
                  'Key',
                  true,
                  headerStyles,
                )}
                {filtering.buildHeader(
                  'variable_description',
                  'Description',
                  true,
                  headerStyles,
                )}
                {filtering.buildHeader(
                  'variable_value',
                  'Value',
                  true,
                  headerStyles,
                )}
              </div>
            }
          />
          <ListItemSecondaryAction>&nbsp;</ListItemSecondaryAction>
        </ListItem>
        {sortedVariables.map((variable) => (
          <ListItem
            key={variable.variable_id}
            classes={{ root: classes.item }}
            divider
          >
            <ListItemIcon>
              <AttachMoneyOutlined />
            </ListItemIcon>
            <ListItemText
              primary={
                <div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.variable_key}
                  >
                    {variable.variable_key}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.variable_description}
                  >
                    {variable.variable_description}
                  </div>
                  <div
                    className={classes.bodyItem}
                    style={inlineStyles.variable_value}
                  >
                    {variable.variable_value}
                  </div>
                </div>
              }
            />
            <ListItemSecondaryAction>
              <VariablePopover
                variable={variable}
                disabled={permissions?.readOnly}
                onEdit={onEditVariable}
                onDelete={onDeleteVariable}
              />
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      {permissions.canWrite && (
        <CreateVariable />
      )}
    </>
  );
};

export default Variables;
