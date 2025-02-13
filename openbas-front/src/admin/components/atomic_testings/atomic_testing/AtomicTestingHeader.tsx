import { PlayArrowOutlined, SettingsOutlined } from '@mui/icons-material';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, Tooltip, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import {
  launchAtomicTesting,
  relaunchAtomicTesting,
} from '../../../../actions/atomic_testings/atomic-testing-actions';
import Transition from '../../../../components/common/Transition';
import { useFormatter } from '../../../../components/i18n';
import Loader from '../../../../components/Loader';
import { type InjectResultOverviewOutput } from '../../../../utils/api-types';
import { truncate } from '../../../../utils/String';
import { InjectResultOverviewOutputContext, type InjectResultOverviewOutputContextType } from '../InjectResultOverviewOutputContext';
import AtomicTestingPopover from './AtomicTestingPopover';
import AtomicTestingUpdate from './AtomicTestingUpdate';

const useStyles = makeStyles()(() => ({
  title: {
    float: 'left',
    marginRight: 10,
  },
  actions: {
    margin: '-6px 0 0 0',
    float: 'right',
  },
}));

const AtomicTestingHeader = () => {
  // Standard hooks
  const { t } = useFormatter();
  const { classes } = useStyles();
  const navigate = useNavigate();

  const { injectResultOverviewOutput, updateInjectResultOverviewOutput } = useContext<InjectResultOverviewOutputContextType>(InjectResultOverviewOutputContext);

  // Launch atomic testing
  const [openDialog, setOpenDialog] = useState(false);
  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);
  const [canLaunch, setCanLaunch] = useState(true);
  const handleCanLaunch = () => setCanLaunch(true);
  const handleCannotLaunch = () => setCanLaunch(false);

  const submitLaunch = async () => {
    handleCloseDialog();
    handleCannotLaunch();
    if (injectResultOverviewOutput?.inject_id) {
      await launchAtomicTesting(injectResultOverviewOutput.inject_id).then((result: { data: InjectResultOverviewOutput }) => {
        updateInjectResultOverviewOutput(result.data);
      });
    }
    handleCanLaunch();
  };

  const submitRelaunch = async () => {
    handleCloseDialog();
    handleCannotLaunch();
    if (injectResultOverviewOutput?.inject_id) {
      await relaunchAtomicTesting(injectResultOverviewOutput.inject_id).then((result) => {
        navigate(`/admin/atomic_testings/${result.data.inject_id}`);
      });
    }
    handleCanLaunch();
  };

  if (!injectResultOverviewOutput) {
    return <Loader variant="inElement" />;
  }

  // Edition
  const [edition, setEdition] = useState(false);
  const handleOpenEdit = () => setEdition(true);
  const handleCloseEdit = () => setEdition(false);

  function getActionButton(injectResultOverviewOutput: InjectResultOverviewOutput) {
    if (!injectResultOverviewOutput.inject_injector_contract) {
      return null;
    }
    if (injectResultOverviewOutput.inject_ready) {
      const launchOrRelaunchKey = !injectResultOverviewOutput.inject_status?.status_id ? 'Launch now' : 'Relaunch now';
      return (
        <Button
          style={{ marginRight: 10 }}
          startIcon={<PlayArrowOutlined />}
          variant="contained"
          color="primary"
          size="small"
          onClick={handleOpenDialog}
          disabled={!canLaunch}
        >
          {t(launchOrRelaunchKey)}
        </Button>
      );
    } else {
      return (
        <>
          <Button
            style={{ marginRight: 10 }}
            startIcon={<SettingsOutlined />}
            variant="contained"
            color="warning"
            size="small"
            onClick={handleOpenEdit}
          >
            {t('Configure')}
          </Button>
          <AtomicTestingUpdate
            open={edition}
            handleClose={handleCloseEdit}
            atomic={injectResultOverviewOutput}
          />
        </>
      );
    }
  }

  function getDialog(injectResultOverviewOutput: InjectResultOverviewOutput) {
    return (
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        TransitionComponent={Transition}
        PaperProps={{ elevation: 1 }}
      >
        <DialogContent>
          <DialogContentText>
            { injectResultOverviewOutput.inject_ready && !injectResultOverviewOutput.inject_status?.status_id
              ? t('Do you want to launch this atomic testing: {title}?', { title: injectResultOverviewOutput.inject_title })
              : t('Do you want to relaunch this atomic testing: {title}?', { title: injectResultOverviewOutput.inject_title }) }
          </DialogContentText>
          {(injectResultOverviewOutput.inject_ready && injectResultOverviewOutput.inject_status?.status_id) && (
            <Alert severity="warning" style={{ marginTop: 20 }}>
              {t('This atomic testing and its previous results will be deleted')}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {t('Cancel')}
          </Button>
          <Button
            color="secondary"
            onClick={injectResultOverviewOutput.inject_ready && !injectResultOverviewOutput.inject_status?.status_id ? submitLaunch : submitRelaunch}
          >
            {t('Confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Tooltip title={injectResultOverviewOutput.inject_title}>
        <Typography
          variant="h1"
          gutterBottom={true}
          classes={{ root: classes.title }}
        >
          {truncate(injectResultOverviewOutput.inject_title, 80)}
        </Typography>
      </Tooltip>
      <div className={classes.actions}>
        {getActionButton(injectResultOverviewOutput)}
        <AtomicTestingPopover
          atomic={injectResultOverviewOutput}
          actions={['Update', 'Duplicate', 'Delete']}
          onDelete={() => navigate('/admin/atomic_testings')}
        />
      </div>
      {getDialog(injectResultOverviewOutput)}
      <div className="clearfix" />
    </>
  );
};

export default AtomicTestingHeader;
