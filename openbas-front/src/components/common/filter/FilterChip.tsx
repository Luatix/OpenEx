import React, { FunctionComponent, useRef, useState } from 'react';
import { Chip, Tooltip } from '@mui/material';
import { FilterHelpers } from './FilterHelpers';
import FilterChipPopover from './FilterChipPopover';
import type { Filter, PropertySchemaDTO } from '../../../utils/api-types';
import { convertOperatorToIcon } from './FilterUtils';
import { useFormatter } from '../../i18n';

interface Props {
  filter: Filter;
  helpers: FilterHelpers;
  propertySchema: PropertySchemaDTO;
}

const FilterChip: FunctionComponent<Props> = ({
  filter,
  helpers,
  propertySchema,
}) => {
  // Standard hooks
  const { t } = useFormatter();

  const chipRef = useRef<HTMLAnchorElement>(null);
  const [open, setOpen] = useState(true);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChipClick = () => {
    handleOpen();
  };

  const handleRemoveFilter = () => {
    if (helpers) {
      helpers.handleRemoveFilterByKey(filter.key);
    }
  };

  const title = () => {
    return (
      <><strong>{t(filter.key)}</strong> {convertOperatorToIcon(filter.operator)} {filter.values?.join(', ')}</>
    );
  };

  return (
    <>
      <Tooltip
        title={title()}
      >
        <Chip
          label={title()}
          onClick={handleChipClick}
          onDelete={handleRemoveFilter}
          component="a"
          ref={chipRef}
        />
      </Tooltip>
      {chipRef?.current
          && <FilterChipPopover
            filter={filter}
            helpers={helpers}
            open={open}
            onClose={handleClose}
            anchorEl={chipRef.current}
            propertySchema={propertySchema}
             />
      }
    </>
  );
};
export default FilterChip;
