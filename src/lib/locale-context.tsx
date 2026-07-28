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

/**
 * SINGLE SOURCE OF TRUTH for metric name translations.
 * Keys are name_zh (Chinese DB value), values are the English display name.
 * Add new entries here whenever a new metric is added to the DB.
 */
export const METRIC_NAME_EN: Record<string, string> = {
  // Speed
  '10米冲刺': '10m Sprint',
  '20米': '20m Sprint',
  '100米': '100m',
  '200米': '200m',
  // Endurance
  '400米': '400m',
  '800米': '800m',
  '1000米': '1000m',
  '1500米': '1500m',
  '3000米': '3000m',
  'Yo-Yo Test (Beep Test)': 'Yo-Yo Test (Beep Test)',
  // Power
  '立定跳远': 'Standing Long Jump',
  '实心球': 'Medicine Ball Throw (2kg)',
  // Agility
  '10x5m Shuttle Run': '10x5m Shuttle Run',
  '10x5 折返跑': '10x5m Shuttle Run',
  '10x5折返跑': '10x5m Shuttle Run',
  // Flexibility
  '坐位体前屈': 'Sit-and-Reach',
  // Strength
  '引体向上': 'Pull-ups',
  'Push-Up': 'Push-Up',
  '俯卧撑': 'Push-Up',
  '直臂悬垂': 'Dead Hang',
  'Dead Hang': 'Dead Hang',
  '平板支撑': 'Plank Hold',
  // Rope Jump
  '3分钟双摇跳': '3-Min Double Unders',
  '1分钟双摇跳': '1-Min Double Unders',
  '1分钟单摇跳': '1-Min Single Unders',
}

/**
 * Hook: returns a function that translates a metric's name_zh to English if locale=en.
 * Falls back to name_zh if no mapping exists (graceful degradation).
 */
export function useMetricName() {
  const locale = useLocale()
  return (nameZh: string) => locale === 'en' ? (METRIC_NAME_EN[nameZh] ?? nameZh) : nameZh
}
