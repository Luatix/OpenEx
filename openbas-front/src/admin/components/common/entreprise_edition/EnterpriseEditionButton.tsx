import { RocketLaunchOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { type UserHelper } from '../../../../actions/helper';
import { useFormatter } from '../../../../components/i18n';
import { useHelper } from '../../../../store';
import EnterpriseEditionAgreement from './EnterpriseEditionAgreement';

// Deprecated - https://mui.com/system/styles/basics/
// Do not use it for new code.
const useStyles = makeStyles()({
  button: {
    marginLeft: 20,
  },
  inLine: {
    float: 'right',
    marginTop: -12,
  },
});

const EnterpriseEditionButton = ({ inLine = false }: { inLine?: boolean }) => {
  const { t } = useFormatter();
  const { classes, cx } = useStyles();
  const [openEnterpriseEditionConsent, setOpenEnterpriseEditionConsent] = useState(false);
  const userAdmin = useHelper((helper: UserHelper) => {
    const me = helper.getMe();
    return me?.user_admin ?? false;
  });
  return (
    <>
      <EnterpriseEditionAgreement
        open={openEnterpriseEditionConsent}
        onClose={() => setOpenEnterpriseEditionConsent(false)}
      />
      <Button
        size="small"
        variant="outlined"
        color="ee"
        onClick={() => setOpenEnterpriseEditionConsent(true)}
        startIcon={<RocketLaunchOutlined />}
        classes={{
          root: cx({
            [classes.button]: true,
            [classes.inLine]: inLine,
          }),
        }}
        disabled={!userAdmin}
      >
        {t('Enable Enterprise Edition')}
      </Button>
    </>
  );
};

export default EnterpriseEditionButton;
