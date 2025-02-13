import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup } from '@mui/material';
import { type FunctionComponent, useState } from 'react';

import { updatePlatformEnterpriseEditionParameters } from '../../../../actions/Application';
import { useFormatter } from '../../../../components/i18n';
import { type SettingsEnterpriseEditionUpdateInput } from '../../../../utils/api-types';
import { useAppDispatch } from '../../../../utils/hooks';

interface EnterpriseEditionAgreementProps {
  open: boolean;
  onClose: () => void;
}

const EnterpriseEditionAgreement: FunctionComponent<
  EnterpriseEditionAgreementProps
> = ({ open, onClose }) => {
  const { t } = useFormatter();
  const dispatch = useAppDispatch();
  const [enterpriseEditionConsent, setEnterpriseEditionConsent] = useState(false);
  const updateEnterpriseEdition = (data: SettingsEnterpriseEditionUpdateInput) => {
    dispatch(updatePlatformEnterpriseEditionParameters(data));
    onClose();
  };
  const enableEnterpriseEdition = () => updateEnterpriseEdition({ platform_enterprise_edition: 'true' });
  return (
    <Dialog
      PaperProps={{ elevation: 1 }}
      open={open}
      onClose={onClose}
      fullWidth={true}
      maxWidth="md"
    >
      <DialogTitle>
        {t('OpenBAS Enterprise Edition (EE) license agreement')}
      </DialogTitle>
      <DialogContent>
        <span>
          {t(
            'By enabling the OpenBAS Enterprise Edition, you (and your organization) agrees to the OpenBAS Enterprise Edition (EE) supplemental license terms and conditions of usage:',
          )}
        </span>
        <ul>
          <li>
            {t(
              'OpenBAS EE is free-to-use for development, testing and research purposes as well as for non-profit organizations.',
            )}
          </li>
          <li>
            {t(
              'OpenBAS EE is included for all Filigran SaaS customers without additional fee.',
            )}
          </li>
          <li>
            {t(
              'For all other usages, you (and your organization) should have entered in a',
            )}
            {' '}
            <a href="https://filigran.io/contact/" target="_blank" rel="noreferrer">
              {t('Filigran Enterprise agreement')}
            </a>
            .
          </li>
        </ul>
        <FormGroup>
          <FormControlLabel
            control={(
              <Checkbox
                checked={enterpriseEditionConsent}
                disabled={false}
                onChange={event => setEnterpriseEditionConsent(event.target.checked)}
              />
            )}
            label={(
              <>
                <span>{t('I have read and agree to the')}</span>
                {' '}
                <a
                  href="https://github.com/OpenBAS-Platform/openbas/blob/master/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('OpenBAS EE license terms')}
                </a>
                .
              </>
            )}
          />
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Cancel')}</Button>
        <Button
          color="secondary"
          onClick={enableEnterpriseEdition}
          disabled={!enterpriseEditionConsent}
        >
          {t('Enable')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnterpriseEditionAgreement;
