import 'cronstrue/locales/fr';
import 'cronstrue/locales/en';
import 'cronstrue/locales/es';
import 'cronstrue/locales/zh_CN';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import moment from 'moment';
import * as PropTypes from 'prop-types';
import { useEffect } from 'react';
import { IntlProvider } from 'react-intl';

import { useHelper } from '../store';
import locale, { DEFAULT_LANG } from '../utils/BrowserLanguage';
import enOpenBAS from '../utils/lang/en.json';
import frOpenBAS from '../utils/lang/fr.json';
import zhOpenBAS from '../utils/lang/zh.json';

const langOpenBAS = {
  en: enOpenBAS,
  fr: frOpenBAS,
  zh: zhOpenBAS,
};

const momentMap = {
  en: 'en-us',
  fr: 'fr-fr',
  es: 'es-es',
  zh: 'zh-cn',
};

// Export LANG to be used in non-React code
// eslint-disable-next-line import/no-mutable-exports
export let LANG = DEFAULT_LANG;

const AppIntlProvider = (props) => {
  const { children } = props;
  const { platformName, lang } = useHelper((helper) => {
    const me = helper.getMe();
    const settings = helper.getPlatformSettings();
    const name = settings.platform_name ?? 'OpenBAS - Crisis Drills Planning Platform';
    const rawPlatformLang = settings.platform_lang ?? 'auto';
    const rawUserLang = me?.user_lang ?? 'auto';
    const platformLang = rawPlatformLang !== 'auto' ? rawPlatformLang : locale;
    const userLang = rawUserLang !== 'auto' ? rawUserLang : platformLang;
    return { platformName: name, lang: userLang };
  });
  LANG = lang;
  const baseMessages = langOpenBAS[lang] || langOpenBAS[DEFAULT_LANG];
  /*
  passser l'anglais par défaut ou le fichier approprié en fonction de la langue
   */
  const momentLocale = momentMap[lang];
  moment.locale(momentLocale);
  useEffect(() => {
    document.title = platformName;
  }, [platformName]);

  return (
    <IntlProvider
      locale={lang}
      key={lang}
      messages={baseMessages}
      onError={(err) => {
        if (err.code === 'MISSING_TRANSLATION') {
          return;
        }
        throw err;
      }}
    >
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={langOpenBAS[lang]}
      >
        {children}
      </LocalizationProvider>
    </IntlProvider>
  );
};

AppIntlProvider.propTypes = {
  children: PropTypes.node,
};

const ConnectedIntlProvider = AppIntlProvider;

export default ConnectedIntlProvider;
