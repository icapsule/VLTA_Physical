'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LanguageSwitcher({ initialLang = 'zh' }: { initialLang?: string }) {
  const [lang, setLang] = useState<string>(initialLang)
  const router = useRouter()

  const toggleLanguage = () => {
    const newLang = lang === 'zh' ? 'en' : 'zh'
    setLang(newLang)
    document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000`
    router.refresh()
  }

  return (
    <button
      onClick={toggleLanguage}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full bg-gray-800/80 px-3 py-2 text-sm font-semibold shadow-lg backdrop-blur-md transition-all hover:bg-gray-700/90 hover:scale-105 border border-gray-700/50"
      aria-label="Toggle Language"
    >
      <span className={`transition-colors ${lang === 'zh' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>中</span>
      <span className="text-gray-600">|</span>
      <span className={`transition-colors ${lang === 'en' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>EN</span>
    </button>
  )
}
