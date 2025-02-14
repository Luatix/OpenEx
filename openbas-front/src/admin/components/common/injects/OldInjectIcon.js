import { DnsOutlined, HelpOutlineOutlined } from '@mui/icons-material';
import { ApplicationCogOutline, Console, FileImportOutline, LanConnect } from 'mdi-material-ui';
import * as PropTypes from 'prop-types';

import CustomTooltip from '../../../../components/CustomTooltip';
import { useFormatter } from '../../../../components/i18n';

const iconSelector = (type, isPayload, variant, fontSize, done, disabled, onClick) => {
  const style = {
    marginTop: variant === 'list' ? 5 : 0,
    padding: variant === 'timeline' ? 1 : 0,
    width: fontSize === 'small' || variant === 'inline' ? 20 : 24,
    height: fontSize === 'small' || variant === 'inline' ? 20 : 24,
    borderRadius: 4,
    cursor: onClick ? 'pointer' : 'default',
    filter: `${done ? 'filter:hue-rotate(100deg)' : `brightness(${disabled ? '30%' : '100%'})`}`,
  };
  if (!type) {
    return (
      <HelpOutlineOutlined onClick={onClick} style={style} />
    );
  }
  if (isPayload) {
    if (type.startsWith('openbas_')) {
      return (
        <img onClick={onClick} src={`/api/images/collectors/${type}`} alt={type} style={style} />
      );
    }
    switch (type) {
      case 'Command':
        return <Console color="primary" onClick={onClick} style={style} />;
      case 'Executable':
        return <ApplicationCogOutline color="primary" onClick={onClick} style={style} />;
      case 'FileDrop':
        return <FileImportOutline color="primary" onClick={onClick} style={style} />;
      case 'DnsResolution':
        return <DnsOutlined color="primary" onClick={onClick} style={style} />;
      case 'NetworkTraffic':
        return <LanConnect color="primary" onClick={onClick} style={style} />;
      default:
        return <HelpOutlineOutlined color="primary" onClick={onClick} style={style} />;
    }
  }
  return (
    <img
      src={`/api/images/injectors/${type}`}
      onClick={onClick}
      alt={type}
      style={{
        marginTop: variant === 'list' ? 5 : 0,
        padding: variant === 'timeline' ? 1 : 0,
        cursor: 'pointer',
        width: fontSize === 'small' || variant === 'inline' ? 20 : 24,
        height: fontSize === 'small' || variant === 'inline' ? 20 : 24,
        borderRadius: 4,
        filter: `${done ? 'filter:hue-rotate(100deg)' : `brightness(${disabled ? '30%' : '100%'})`}`,
      }}
    />

  );
};

const OldInjectIcon = (props) => {
  const { t } = useFormatter();
  const { type, isPayload, size, variant, done, disabled, onClick, tooltip } = props;
  const fontSize = size || 'medium';
  return (
    <CustomTooltip title={tooltip || (type ? t(type) : t('Unknown'))}>
      {iconSelector(type, isPayload, variant, fontSize, done, disabled, onClick)}
    </CustomTooltip>
  );
};

OldInjectIcon.propTypes = {
  type: PropTypes.string,
  size: PropTypes.string,
  variant: PropTypes.string,
  done: PropTypes.bool,
  disabled: PropTypes.bool,
  isPayload: PropTypes.bool,
  onClick: PropTypes.func,
  tooltip: PropTypes.object,
};

export default OldInjectIcon;
