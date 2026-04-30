'use client'

import { useEffect, useState } from 'react'
import { X, Download, Share } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'fimihub_install_dismissed_at'
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [iosTip, setIosTip] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    if (isStandalone) return

    try {
      const last = localStorage.getItem(DISMISS_KEY)
      if (last && Date.now() - Number(last) < DISMISS_TTL_MS) return
    } catch {}

    const ua = window.navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    if (isIOS && isSafari) {
      setIosTip(true)
      setShow(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {}
    setShow(false)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome !== 'accepted') {
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()))
      } catch {}
    }
    setDeferred(null)
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] w-[min(420px,calc(100vw-1.5rem))] animate-in-up">
      <div className="glass rounded-2xl shadow-xl border border-border/60 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">Install fimihub</p>
          {iosTip ? (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Tap <Share className="inline w-3.5 h-3.5 align-text-bottom" /> Share, then
              choose <span className="font-semibold">Add to Home Screen</span> for a faster, app-like experience.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Add it to your home screen for instant access, faster loads and notifications.
            </p>
          )}
          {!iosTip && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={install}
                className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                Install app
              </button>
              <button
                onClick={dismiss}
                className="text-xs font-medium text-muted-foreground px-3 py-1.5 rounded-xl hover:bg-muted transition-colors"
              >
                Not now
              </button>
            </div>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
