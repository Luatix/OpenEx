import { Dialog as DialogMUI, DialogTitle, DialogContent } from '@mui/material';
import React, { FunctionComponent } from 'react';
import Transition from './Transition';

interface DialogProps {
  open: boolean;
  handleClose: () => void;
  title: string;
  children: (() => React.ReactElement) | React.ReactElement | null;
}

const Dialog: FunctionComponent<DialogProps> = ({
  open = false,
  handleClose,
  title,
  children,
}) => {
  let component;
  if (children) {
    if (typeof children === 'function') {
      component = children();
    } else {
      component = React.cloneElement(children as React.ReactElement);
    }
  }

  return (
    <DialogMUI
      open={open}
      onClose={handleClose}
      fullWidth={true}
      maxWidth="md"
      PaperProps={{ elevation: 1 }}
      TransitionComponent={Transition}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{component}</DialogContent>
    </DialogMUI>
  );
};

export default Dialog;
