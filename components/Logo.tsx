import { cn } from '@/lib/utils'

export function FimiLogo({ className }: { className?: string }) {
  return (
    <div className={cn("w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm", className)}>
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    </div>
  )
}
