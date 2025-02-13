import { type Breakpoint, Dialog as DialogMUI, DialogContent, DialogTitle } from '@mui/material';
import { cloneElement, type FunctionComponent, type ReactElement } from 'react';

import Transition from './Transition';

interface DialogProps {
  open: boolean;
  handleClose: () => void;
  title: string;
  children: (() => ReactElement) | ReactElement | null;
  maxWidth?: Breakpoint;
}

const Dialog: FunctionComponent<DialogProps> = ({
  open = false,
  handleClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  let component;
  if (children) {
    if (typeof children === 'function') {
      component = children();
    } else {
      component = cloneElement(children as ReactElement);
    }
  }

  return (
    <DialogMUI
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth={maxWidth}
      PaperProps={{ elevation: 1 }}
      TransitionComponent={Transition}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{component}</DialogContent>
    </DialogMUI>
  );
};

export default Dialog;
