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
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-2 text-sm font-semibold shadow-2xl transition-all hover:bg-gray-700 hover:scale-105 border border-gray-600"
      aria-label="Toggle Language"
    >
      <span className={`transition-colors ${lang === 'zh' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>中</span>
      <span className="text-gray-600">|</span>
      <span className={`transition-colors ${lang === 'en' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>EN</span>
    </button>
  )
}
