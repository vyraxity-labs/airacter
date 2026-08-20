'use client'

import i18next from 'i18next'
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { getOptions } from './config'

if (!i18next.isInitialized) {
  i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`../../../public/locales/${language}/${namespace}.json`),
      ),
    )
    .init({
      ...getOptions(),
      lng: undefined, // let language detector decide
      detection: {
        order: ['cookie', 'navigator', 'htmlTag'],
        caches: ['cookie'],
      },
    })
}

export function useTranslation(ns?: string) {
  return useTranslationOrg(ns)
}

export default i18next
