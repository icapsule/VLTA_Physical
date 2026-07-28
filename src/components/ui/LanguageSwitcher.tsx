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
      className="flex items-center gap-1 rounded-md bg-gray-800/40 hover:bg-gray-800/80 px-2 py-0.5 text-xs font-semibold border border-gray-800 transition-colors mr-2 cursor-pointer"
      aria-label="Toggle Language"
    >
      <span className={`transition-colors ${lang === 'zh' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>中</span>
      <span className="text-gray-700">|</span>
      <span className={`transition-colors ${lang === 'en' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>EN</span>
    </button>
  )
}
