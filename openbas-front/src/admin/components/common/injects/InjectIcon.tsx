import { DnsOutlined, HelpOutlineOutlined } from '@mui/icons-material';
import { ApplicationCogOutline, Console, FileImportOutline, LanConnect } from 'mdi-material-ui';
import { FunctionComponent } from 'react';

import CustomTooltip from '../../../../components/CustomTooltip';
import { useFormatter } from '../../../../components/i18n';

interface Props {
  type: string | undefined;
  size?: string;
  variant?: string;
  done?: boolean;
  disabled?: boolean;
  isPayload?: boolean;
  onClick?: () => void;
  tooltip?: object;
}

const InjectIcon: FunctionComponent<Props> = ({
  type,
  size,
  variant,
  done,
  disabled,
  isPayload,
  onClick,
  tooltip,
}) => {
  // Standard hooks
  const { t } = useFormatter();

  const fontSize = size || 'medium';

  // eslint-disable-next-line consistent-return
  const iconSelector = (type: string, isPayload: boolean, variant: string, fontSize: string, done: boolean, disabled: boolean) => {
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

  return (
    <CustomTooltip title={tooltip || (type ? t(type) : t('Unknown'))}>
      {iconSelector(type!, isPayload!, variant!, fontSize, done!, disabled!)}
    </CustomTooltip>
  );
};

export default InjectIcon;
