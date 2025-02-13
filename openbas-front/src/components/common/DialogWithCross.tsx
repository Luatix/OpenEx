import { Close } from '@mui/icons-material';
import { Breakpoint, Dialog as DialogMUI, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { cloneElement, FunctionComponent, ReactElement } from 'react';
import { makeStyles } from 'tss-react/mui';

import Transition from './Transition';

const useStyles = makeStyles()(theme => ({
  header: {
    backgroundColor: theme.palette.background.nav,
    display: 'inline-flex',
    alignItems: 'center',
    height: '50px',
  },
}));

interface DialogProps {
  open: boolean;
  handleClose: () => void;
  title: string;
  children: (() => ReactElement) | ReactElement | null;
  maxWidth?: Breakpoint;
}

const DialogWithCross: FunctionComponent<DialogProps> = ({
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
  const { classes } = useStyles();

  return (
    (
      <DialogMUI
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth={maxWidth}
        PaperProps={{ elevation: 1 }}
        TransitionComponent={Transition}
      >
        <div className={classes.header}>
          <IconButton
            aria-label="Close"
            onClick={handleClose}
            size="large"
            color="primary"
          >
            <Close fontSize="small" color="primary" />
          </IconButton>
          <DialogTitle>{title}</DialogTitle>
        </div>
        <DialogContent>{component}</DialogContent>
      </DialogMUI>
    )

  /*
                    <Fragment>
                      <Button variant="outlined" onClick={handleClickOpen}>
                            Open dialog
                          </Button>
                          <BootstrapDialog
                            onClose={handleClose}
                            aria-labelledby="customized-dialog-title"
                            open={open}
                          >
                            <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                              Modal title
                            </DialogTitle>
                            <IconButton
                              aria-label="close"
                              onClick={handleClose}
                              sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                              }}
                            >
                              <CloseIcon />
                            </IconButton>
                            <DialogContent dividers>
                              <Typography gutterBottom>
                                Cras mattis consectetur purus sit amet fermentum. Cras justo odio,
                                dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac
                                consectetur ac, vestibulum at eros.
                              </Typography>
                              <Typography gutterBottom>
                                Praesent commodo cursus magna, vel scelerisque nisl consectetur et.
                                Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.
                              </Typography>
                              <Typography gutterBottom>
                                Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus
                                magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec
                                ullamcorper nulla non metus auctor fringilla.
                              </Typography>
                            </DialogContent>
                            <DialogActions>
                              <Button autoFocus onClick={handleClose}>
                                Save changes
                              </Button>
                            </DialogActions>
                          </BootstrapDialog>
                        </Fragment> */
  );
};

export default DialogWithCross;
