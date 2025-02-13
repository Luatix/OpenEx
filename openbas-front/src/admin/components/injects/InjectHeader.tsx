import { Tooltip, Typography } from '@mui/material';
import { type FunctionComponent } from 'react';

import { type InjectResultOverviewOutput } from '../../../utils/api-types';
import { truncate } from '../../../utils/String';

interface Props {
  inject: InjectResultOverviewOutput;
}

const InjectHeader: FunctionComponent<Props> = ({
  inject,
}) => {
  return (
    <Tooltip title={inject.inject_title}>
      <Typography variant="h1" gutterBottom>
        {truncate(inject.inject_title, 80)}
      </Typography>
    </Tooltip>
  );
};

export default InjectHeader;
