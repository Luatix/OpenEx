import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Tooltip } from '@mui/material';
import { type ReactElement, useState } from 'react';

import { type UserHelper } from '../../../../actions/helper';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import useAI from '../../../../utils/hooks/useAI';
import useEnterpriseEdition from '../../../../utils/hooks/useEnterpriseEdition';
import EnterpriseEditionAgreement from './EnterpriseEditionAgreement';

const EETooltip = ({
  children,
  title,
  forAi,
}: {
  children: ReactElement;
  title?: string;
  forAi?: boolean;
}) => {
  const { t } = useFormatter();
  const [feedbackCreation, setFeedbackCreation] = useState(false);
  const [openEnableAI, setOpenEnableAI] = useState(false);
  const [openConfigAI, setOpenConfigAI] = useState(false);
  const userAdmin = useHelper((helper: UserHelper) => {
    const me = helper.getMe();
    return me?.user_admin ?? false;
  });
  const isEnterpriseEdition = useEnterpriseEdition();
  const { enabled, configured } = useAI();
  if (isEnterpriseEdition && (!forAi || (forAi && enabled && configured))) {
    return <Tooltip title={title ? t(title) : undefined}>{children}</Tooltip>;
  }
  if (isEnterpriseEdition && forAi && !enabled) {
    return (
      <>
        <Tooltip title={title ? t(title) : undefined}>
          <span onClick={(e) => {
            setOpenEnableAI(true);
            e.preventDefault();
            e.stopPropagation();
          }}
          >
            {children}
          </span>
        </Tooltip>
        <Dialog
          PaperProps={{ elevation: 1 }}
          open={openEnableAI}
          onClose={() => setOpenEnableAI(false)}
          fullWidth={true}
          maxWidth="sm"
        >
          <DialogTitle>
            {t('Enable AI powered platform')}
          </DialogTitle>
          <DialogContent>
            {t('To use AI, please enable it in the configuration of your platform.')}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEnableAI(false)}>{t('Close')}</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
  if (isEnterpriseEdition && forAi && !configured) {
    return (
      <>
        <Tooltip title={title ? t(title) : undefined}>
          <span onClick={(e) => {
            setOpenConfigAI(true);
            e.preventDefault();
            e.stopPropagation();
          }}
          >
            {children}
          </span>
        </Tooltip>
        <Dialog
          PaperProps={{ elevation: 1 }}
          open={openConfigAI}
          onClose={() => setOpenConfigAI(false)}
          fullWidth={true}
          maxWidth="sm"
        >
          <DialogTitle>
            {t('Enable AI powered platform')}
          </DialogTitle>
          <DialogContent>
            {t('The token is missing in your platform configuration, please ask your Filigran representative to provide you with it or with on-premise deployment instructions. Your can open a support ticket to do so.')}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConfigAI(false)}>{t('Close')}</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
  return (
    <>
      <Tooltip title={title ? t(title) : undefined}>
        <span onClick={(e) => {
          setFeedbackCreation(true);
          e.preventDefault();
          e.stopPropagation();
        }}
        >
          {children}
        </span>
      </Tooltip>
      {userAdmin && (
        <EnterpriseEditionAgreement
          open={feedbackCreation}
          onClose={() => setFeedbackCreation(false)}
        />
      )}
    </>
  );
};

export default EETooltip;
