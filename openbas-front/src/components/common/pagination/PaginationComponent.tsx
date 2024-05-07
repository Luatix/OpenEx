import { TablePagination, ToggleButtonGroup } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { makeStyles } from '@mui/styles';
import SearchFilter from '../../SearchFilter';
import type { Page } from './Page';
import type { SearchPaginationInput } from '../../../utils/api-types';
import ExportButton, { ExportProps } from '../ExportButton';
import mitreAttack from '../../../static/images/misc/attack.png';

const useStyles = makeStyles(() => ({
  container: {
    display: 'flex',
    alignItems: 'center',
  },
  parameters: {
    marginTop: -10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}));

interface Props<T> {
  fetch: (input: SearchPaginationInput) => Promise<{ data: Page<T> }>;
  searchPaginationInput: SearchPaginationInput;
  setContent: (data: T[]) => void;
  exportProps?: ExportProps<T>;
  searchEnable?: boolean;
  handleOpenMitreFilter?: () => void;
  children?: React.ReactElement | null;
}

const PaginationComponent = <T extends object>({ fetch, searchPaginationInput, setContent, exportProps, searchEnable = true, handleOpenMitreFilter, children }: Props<T>) => {
  // Standard hooks
  const classes = useStyles();

  // Pagination
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(100);
  const [totalElements, setTotalElements] = useState(0);

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Text Search
  const [textSearch, setTextSearch] = React.useState(searchPaginationInput.textSearch ?? '');
  const handleTextSearch = (value?: string) => {
    setPage(0);
    setTextSearch(value || '');
  };

  useEffect(() => {
    const finalSearchPaginationInput = {
      ...searchPaginationInput,
      textSearch,
      page,
      size: rowsPerPage,
    };

    fetch(finalSearchPaginationInput).then((result: { data: Page<T> }) => {
      const { data } = result;
      setContent(data.content);
      setTotalElements(data.totalElements);
    });
  }, [searchPaginationInput, page, rowsPerPage, textSearch]);

  // Children
  let component;
  if (children) {
    component = React.cloneElement(children as React.ReactElement);
  }

  return (
    <div className={classes.parameters}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {searchEnable && (
          <SearchFilter
            variant="small"
            onChange={handleTextSearch}
            keyword={textSearch}
          />
        )}
        {handleOpenMitreFilter && (
          <div style={{ cursor: 'pointer' }} onClick={handleOpenMitreFilter}>
            <img src={mitreAttack} alt="MITRE ATT&CK" style={{ marginLeft: searchEnable ? 10 : 0, width: 60 }} />
          </div>
        )}
      </div>
      <div className={classes.container}>
        <TablePagination
          component="div"
          rowsPerPageOptions={[100, 200, 500, 1000]}
          count={totalElements}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        <ToggleButtonGroup value='fake' exclusive={true}>
          {exportProps && <ExportButton totalElements={totalElements} exportProps={exportProps} />}
          {!!component && component}
        </ToggleButtonGroup>
      </div>
    </div>
  );
};

export default PaginationComponent;
