export const fallbackLng = 'en'
export const languages = [fallbackLng, 'yo', 'fr']
export const defaultNS = 'common'
export const cookieName = 'i18next'

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    supportedLngs: languages,
    fallbackLng,
    lng,
    defaultNS,
    ns,
    fallbackNS: defaultNS,
  }
}
