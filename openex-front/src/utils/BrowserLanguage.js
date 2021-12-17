import * as R from 'ramda';
// These window.navigator contain language information
// eslint-disable-next-line max-len
// 1. languages -> Array of preferred languages (eg ["en-US", "zh-CN", "ja-JP"]) Firefox^32, Chrome^32
// 2. language  -> Preferred language as String (eg "en-US") Firefox^5, IE^11, Safari,
//                 Chrome sends Browser UI language
// 3. browserLanguage -> UI Language of IE
// 4. userLanguage    -> Language of Windows Regional Options
// 5. systemLanguage  -> UI Language of Windows
const browserLanguagePropertyKeys = [
  'languages',
  'language',
  'browserLanguage',
  'userLanguage',
  'systemLanguage',
];

const availableLanguages = ['fr', 'en'];

const detectedLocale = R.pipe(
  R.pick(browserLanguagePropertyKeys), // Get only language properties
  R.values(), // Get values of the properties
  R.flatten(), // flatten all arrays
  R.reject(R.isNil), // Remove undefined values
  R.map((x) => x.substr(0, 2)),
  R.find((x) => R.contains(x, availableLanguages)), // Returns first language
);

// eslint-disable-next-line import/prefer-default-export
export const locale = detectedLocale(window.navigator) || 'en'; // If no locale is detected, fallback to 'en'
