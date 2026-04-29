import { cn } from '@/lib/utils'

export function FimiLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative w-9 h-9 rounded-xl shadow-sm overflow-hidden flex items-center justify-center',
        className,
      )}
      style={{
        background:
          'linear-gradient(135deg, hsl(263, 78%, 56%) 0%, hsl(283, 78%, 42%) 100%)',
      }}
      aria-label="FimiHub"
    >
      <svg
        viewBox="0 0 64 64"
        className="w-[62%] h-[62%]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M21 22v-2a11 11 0 0 1 22 0v2"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M15 22h34l-2.8 28a5 5 0 0 1-5 4.5H22.8a5 5 0 0 1-5-4.5z"
          fill="hsl(35, 95%, 58%)"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="25" cy="32" r="1.8" fill="#ffffff" />
        <circle cx="39" cy="32" r="1.8" fill="#ffffff" />
      </svg>
    </div>
  )
}

export function FimiWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <FimiLogo />
      <span className="font-bold text-lg tracking-tight leading-none">
        Fimi<span className="text-primary">Hub</span>
      </span>
    </span>
  )
}
