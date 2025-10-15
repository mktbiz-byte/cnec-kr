import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationKO from './locales/ko/translation.json';
import translationEN from './locales/en/translation.json';
import translationJA from './locales/ja/translation.json';
import translationZH from './locales/zh/translation.json';

// 언어 리소스
const resources = {
  ko: {
    translation: translationKO
  },
  en: {
    translation: translationEN
  },
  ja: {
    translation: translationJA
  },
  zh: {
    translation: translationZH
  }
};

i18n
  // 브라우저 언어 감지
  .use(LanguageDetector)
  // React와 통합
  .use(initReactI18next)
  // i18n 초기화
  .init({
    resources,
    fallbackLng: 'ko', // 기본 언어
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React에서는 이미 XSS 방지가 되어 있음
    },
    
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;
