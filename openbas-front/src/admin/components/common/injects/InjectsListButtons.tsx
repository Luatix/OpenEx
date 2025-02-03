import { BarChartOutlined, ReorderOutlined, ViewTimelineOutlined } from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { FunctionComponent, useContext } from 'react';

import { useFormatter } from '../../../../components/i18n';
import { InjectContext, ViewModeContext } from '../Context';
import ImportUploaderInjectFromXls from './ImportUploaderInjectFromXls';

const useStyles = makeStyles(() => ({
  container: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
}));

interface Props {
  setViewMode?: (mode: string) => void;
  availableButtons: string[];
  onImportedInjects?: () => void;
}

const InjectsListButtons: FunctionComponent<Props> = ({
  setViewMode,
  availableButtons,
  onImportedInjects,
}) => {
  // Standard hooks
  const classes = useStyles();
  const { t } = useFormatter();
  const injectContext = useContext(InjectContext);
  const viewModeContext = useContext(ViewModeContext);

  return (
    <div className={classes.container}>
      <ToggleButtonGroup
        size="small"
        exclusive
        style={{ float: 'right' }}
        aria-label="Change view mode"
      >
        {injectContext.onImportInjectFromXls
        && <ImportUploaderInjectFromXls onImportedInjects={onImportedInjects} />}
        {(!!setViewMode && availableButtons.includes('list'))
        && (
          <Tooltip title={t('List view')}>
            <ToggleButton
              value="list"
              onClick={() => setViewMode('list')}
              selected={viewModeContext === 'list'}
              aria-label="List view mode"
            >
              <ReorderOutlined fontSize="small" color={viewModeContext === 'list' ? 'inherit' : 'primary'} />
            </ToggleButton>
          </Tooltip>
        )}
        {(!!setViewMode && availableButtons.includes('chain'))
        && (
          <Tooltip title={t('Interactive view')}>
            <ToggleButton
              value="chain"
              onClick={() => setViewMode('chain')}
              selected={viewModeContext === 'chain'}
              aria-label="Interactive view mode"
            >
              <ViewTimelineOutlined fontSize="small" color={viewModeContext === 'chain' ? 'inherit' : 'primary'} />
            </ToggleButton>
          </Tooltip>
        )}
        {(!!setViewMode && availableButtons.includes('distribution'))
        && (
          <Tooltip title={t('Distribution view')}>
            <ToggleButton
              value="distribution"
              onClick={() => setViewMode('distribution')}
              aria-label="Distribution view mode"
            >
              <BarChartOutlined fontSize="small" color="primary" />
            </ToggleButton>
          </Tooltip>
        )}
      </ToggleButtonGroup>
    </div>
  );
};

export default InjectsListButtons;
