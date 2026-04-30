'use client'

import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let hideTimer: ReturnType<typeof setTimeout> | null = null
    let removeTimer: ReturnType<typeof setTimeout> | null = null

    const hide = () => {
      setFading(true)
      removeTimer = setTimeout(() => setVisible(false), 350)
    }

    if (document.readyState === 'complete') {
      hideTimer = setTimeout(hide, 250)
    } else {
      const onLoad = () => {
        hideTimer = setTimeout(hide, 200)
      }
      window.addEventListener('load', onLoad, { once: true })
      // hard cap so it never sticks if `load` is slow
      removeTimer = setTimeout(hide, 2500)
      return () => {
        window.removeEventListener('load', onLoad)
        if (hideTimer) clearTimeout(hideTimer)
        if (removeTimer) clearTimeout(removeTimer)
      }
    }

    return () => {
      if (hideTimer) clearTimeout(hideTimer)
      if (removeTimer) clearTimeout(removeTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}
