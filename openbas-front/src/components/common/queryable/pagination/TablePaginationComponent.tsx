import { TablePagination, ToggleButtonGroup } from '@mui/material';
import { ChangeEvent, cloneElement, MouseEvent as ReactMouseEvent, ReactElement } from 'react';
import { makeStyles } from 'tss-react/mui';

import ExportButton, { ExportProps } from '../../ExportButton';
import { PaginationHelpers } from './PaginationHelpers';
import { ROWS_PER_PAGE_OPTIONS } from './usPaginationState';

const useStyles = makeStyles()(() => ({
  container: {
    display: 'flex',
    alignItems: 'center',
  },
}));

interface Props<T> {
  page: number;
  size: number;
  paginationHelpers: PaginationHelpers;
  exportProps?: ExportProps<T>;
  children?: ReactElement | null;
}

const TablePaginationComponent = <T extends object>({
  page,
  size,
  paginationHelpers,
  exportProps,
  children,
}: Props<T>) => {
  // Standard hooks
  const { classes } = useStyles();

  const handleChangePage = (
    _event: ReactMouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => paginationHelpers.handleChangePage(newPage);

  const handleChangeRowsPerPage = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => paginationHelpers.handleChangeRowsPerPage(parseInt(event.target.value, 10));

  // Children
  let component;
  if (children) {
    component = cloneElement(children as ReactElement);
  }

  return (
    <div className={classes.container}>
      <TablePagination
        component="div"
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        count={paginationHelpers.getTotalElements()}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={size}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <ToggleButtonGroup value="fake" exclusive>
        {exportProps && <ExportButton totalElements={paginationHelpers.getTotalElements()} exportProps={exportProps} />}
        {!!component && component}
      </ToggleButtonGroup>
    </div>
  );
};

export default TablePaginationComponent;
