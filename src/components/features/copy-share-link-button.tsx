'use client'

import { useState } from 'react'

export default function CopyShareLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const url = `${window.location.origin}/report/${token}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      alert('复制失败，请手动复制链接: ' + `${window.location.origin}/report/${token}`)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        copied
          ? 'bg-green-900/50 text-green-400 border border-green-800'
          : 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50 border border-indigo-800/50'
      }`}
    >
      {copied ? '✅ 已复制链接' : '🔗 复制家长分享链接'}
    </button>
  )
}
