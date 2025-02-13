import { cloneElement, FunctionComponent, ReactElement } from 'react';
import { makeStyles } from 'tss-react/mui';

import { useFormatter } from '../../../../components/i18n';
import EEChip from './EEChip';

// Deprecated - https://mui.com/system/styles/basics/
// Do not use it for new code.
const useStyles = makeStyles()({
  labelRoot: {
    '& .MuiFormLabel-root': {
      zIndex: 1,
    },
  },
});

interface EEFieldProps {
  children: ReactElement<{ label: ReactElement }>;
}

const EEField: FunctionComponent<EEFieldProps> = ({
  children,
}) => {
  const { classes } = useStyles();
  const { t } = useFormatter();
  const component = cloneElement(children, {
    label:
      <>
        {t(children.props.label)}
        <EEChip />
      </>,
  });
  return (
    <div className={classes.labelRoot}>
      {component}
    </div>
  );
};

export default EEField;
