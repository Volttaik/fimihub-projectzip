"use client"
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Link as LinkIcon, Mail, Check, MessageCircle, Send, Facebook, Twitter } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  title: string
  text?: string
  className?: string
}

export default function ShareMenu({ title, text, className }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') setUrl(window.location.href)
  }, [])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const shareText = text || `Check out "${title}" on FimiHub`
  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(shareText)
  const encodedTitle = encodeURIComponent(title)

  const handleClick = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, text: shareText, url })
        return
      } catch {
        // user cancelled or unsupported — fall through to dropdown
      }
    }
    setOpen((o) => !o)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 1800)
      setOpen(false)
    } catch {
      toast.error('Could not copy link')
    }
  }

  const targets = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      icon: <MessageCircle className="w-4 h-4 text-emerald-600" />,
    },
    {
      label: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: <Twitter className="w-4 h-4 text-sky-500" />,
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <Facebook className="w-4 h-4 text-blue-600" />,
    },
    {
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      icon: <Send className="w-4 h-4 text-sky-600" />,
    },
    {
      label: 'Email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`,
      icon: <Mail className="w-4 h-4 text-rose-500" />,
    },
  ]

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <Button onClick={handleClick} variant="outline" className="gap-2 w-full">
        <Share2 className="w-4 h-4" /> Share
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute z-40 right-0 mt-2 w-60 rounded-2xl border border-border/70 bg-popover shadow-xl p-1.5 animate-in-up"
        >
          {targets.map((t) => (
            <a
              key={t.label}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-muted/70 transition-colors"
            >
              <span className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center">
                {t.icon}
              </span>
              <span className="font-medium">{t.label}</span>
            </a>
          ))}
          <button
            type="button"
            onClick={copyLink}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-muted/70 transition-colors border-t border-border/60 mt-1 pt-2"
          >
            <span className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center">
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
              )}
            </span>
            <span className="font-medium">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
