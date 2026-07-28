import { cookies } from 'next/headers'

export type Locale = 'zh' | 'en'

/**
 * Safely fetches the current locale from cookies.
 * Defaults to 'zh' if not found.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value
  return (localeCookie === 'en' ? 'en' : 'zh') as Locale
}

/**
 * Returns an inline translation function for Server Components.
 * Pass the Chinese (default) string first, then the English string.
 */
export async function getTranslator() {
  const locale = await getLocale()
  
  return function t(zhText: string, enText: string): string {
    return locale === 'en' ? enText : zhText
  }
}
