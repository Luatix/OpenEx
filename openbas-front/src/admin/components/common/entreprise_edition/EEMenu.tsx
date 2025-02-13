import { styled } from '@mui/material/styles';
import { type ReactElement } from 'react';

import EEChip from './EEChip';

const EEDiv = styled('div')(() => ({
  display: 'flex',
}));

const EEMenu = ({ children }: { children: ReactElement }) => {
  return (
    <EEDiv>
      {children}
      <EEChip />
    </EEDiv>
  );
};

export default EEMenu;
