'use client'

import { createContext, useContext } from 'react'

type Locale = 'zh' | 'en'

const LocaleContext = createContext<Locale>('zh')

export function LocaleProvider({
  children,
  locale,
}: {
  children: React.ReactNode
  locale: Locale
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}

/**
 * Inline translation hook for Client Components.
 * Usage: const t = useT(); return <h1>{t("中文", "English")}</h1>
 */
export function useT() {
  const locale = useLocale()
  return (zh: string, en: string) => locale === 'en' ? en : zh
}
