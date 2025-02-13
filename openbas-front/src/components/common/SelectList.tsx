import { Box, Chip, Grid, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { ReactElement, useMemo } from 'react';

import { truncate } from '../../utils/String';

interface SelectListIcon {
  value: () => ReactElement;
}

interface SelectListHeader<T> {
  field: string;
  value: (value: T) => ReactElement | string;
  width: number;
}

export interface SelectListElements<T> {
  icon: SelectListIcon;
  headers: SelectListHeader<T>[];
}

interface Props<T> {
  values: T[];
  selectedValues: T[];
  elements: SelectListElements<T>;
  prefix: string;
  onSelect: (id: string, value: T) => void;
  onDelete: (id: string) => void;
  paginationComponent: ReactElement;
  buttonComponent?: ReactElement;
  getName?: (element: T) => string;
}

const SelectList = <T extends object>({
  values,
  selectedValues,
  elements,
  prefix,
  onSelect,
  onDelete,
  paginationComponent,
  buttonComponent,
  getName,
}: Props<T>) => {
  // @ts-expect-error: use a Record<string, unknown> is not working
  const getIdFn = (v: T) => v[`${prefix}_id`];
  // @ts-expect-error: use a Record<string, unknown> is not working
  const getNameFn = getName ? getName : (v: T) => v[`${prefix}_name`];

  const selectedIds = useMemo(
    () => selectedValues.map(v => getIdFn(v)),
    [selectedValues, prefix],
  );

  return (
    <>
      {paginationComponent}
      <Grid container spacing={3}>
        <Grid item xs={8}>
          <List>
            {values.map((value) => {
              const id = getIdFn(value);
              const disabled = selectedIds.includes(id);
              return (
                <ListItemButton
                  key={id}
                  disabled={disabled}
                  divider
                  onClick={() => onSelect(id, value)}
                >
                  <ListItemIcon>
                    {elements.icon.value()}
                  </ListItemIcon>
                  <ListItemText
                    primary={(
                      <Box sx={{ display: 'flex' }}>
                        {elements.headers.map(header => (
                          <Box
                            key={header.field}
                            sx={{
                              height: 20,
                              fontSize: 13,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              paddingRight: 1,
                              width: `${header.width}%`,
                            }}
                          >
                            {header.value(value)}
                          </Box>
                        ))}
                      </Box>
                    )}
                  />
                </ListItemButton>
              );
            })}
            {buttonComponent}
          </List>
        </Grid>
        <Grid item xs={4}>
          <Box
            sx={{
              minHeight: '100%',
              padding: 2,
              border: '1px dashed rgba(255, 255, 255, 0.3)',
            }}
          >
            {selectedValues.map((selectedValue) => {
              const id = getIdFn(selectedValue);
              const name = getNameFn(selectedValue);
              return (
                <Chip
                  key={id}
                  onDelete={() => onDelete(id)}
                  label={truncate(name, 22)}
                  sx={{ margin: '0 10px 10px 0' }}
                />
              );
            })}
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default SelectList;
