import 'cronstrue/locales/fr';
import 'cronstrue/locales/en';
import 'cronstrue/locales/zh_CN';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { enUS as dateFnsEnUSLocale, fr as dateFnsFrLocale, zhCN as dateFnsZhCNLocale } from 'date-fns/locale';
import moment from 'moment';
import { FunctionComponent, ReactElement, useEffect } from 'react';
import { IntlProvider } from 'react-intl';

import { LoggedHelper } from '../actions/helper';
import { useHelper } from '../store';
import locale, { DEFAULT_LANG } from '../utils/BrowserLanguage';
import enOpenBAS from '../utils/lang/en.json';
import frOpenBAS from '../utils/lang/fr.json';
import zhOpenBAS from '../utils/lang/zh.json';

type Lang = 'en' | 'fr' | 'zh';

const dateFnsLocaleMap = {
  en: dateFnsEnUSLocale,
  fr: dateFnsFrLocale,
  zh: dateFnsZhCNLocale,
};

const obasLocaleMap = {
  en: enOpenBAS,
  fr: frOpenBAS,
  zh: zhOpenBAS,
};

const momentMap = {
  en: 'en-us',
  fr: 'fr-fr',
  zh: 'zh-cn',
};

// Export LANG to be used in non-React code
// eslint-disable-next-line import/no-mutable-exports
export let LANG = DEFAULT_LANG;

const AppIntlProvider: FunctionComponent<{ children: ReactElement }> = ({ children }) => {
  const { platformName, lang }: { platformName: string; lang: string } = useHelper((helper: LoggedHelper) => {
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
  const baseMessages: Record<string, string> = obasLocaleMap[lang as Lang] || obasLocaleMap[DEFAULT_LANG];
  const momentLocale = momentMap[lang as Lang];
  moment.locale(momentLocale);
  useEffect(() => {
    document.title = platformName;
  }, [platformName]);

  return (
    <IntlProvider
      locale={lang}
      defaultLocale={DEFAULT_LANG}
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
        adapterLocale={dateFnsLocaleMap[lang as Lang]}
      >
        {children}
      </LocalizationProvider>
    </IntlProvider>
  );
};

export default AppIntlProvider;
