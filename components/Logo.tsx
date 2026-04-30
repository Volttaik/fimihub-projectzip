import { cn } from '@/lib/utils'

export function FimiLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative w-9 h-9 rounded-xl shadow-md ring-1 ring-black/5 overflow-hidden flex items-center justify-center',
        className,
      )}
      style={{
        background:
          'linear-gradient(135deg, hsl(263, 82%, 60%) 0%, hsl(278, 78%, 48%) 55%, hsl(290, 80%, 40%) 100%)',
      }}
      aria-label="fimihub"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 25% 15%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 55%)',
        }}
      />
      <svg
        viewBox="0 0 64 64"
        className="relative w-[64%] h-[64%] drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fimi-bag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(38, 100%, 66%)" />
            <stop offset="100%" stopColor="hsl(28, 95%, 50%)" />
          </linearGradient>
          <linearGradient id="fimi-handle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1e8ff" />
          </linearGradient>
        </defs>
        <path
          d="M21 23v-3a11 11 0 0 1 22 0v3"
          fill="none"
          stroke="url(#fimi-handle)"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        <path
          d="M15 22h34l-2.8 28a5 5 0 0 1-5 4.5H22.8a5 5 0 0 1-5-4.5z"
          fill="url(#fimi-bag)"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M19 25h26"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="25" cy="33" r="1.9" fill="#ffffff" />
        <circle cx="39" cy="33" r="1.9" fill="#ffffff" />
      </svg>
    </div>
  )
}

export function FimiWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <FimiLogo />
      <span className="font-bold text-lg tracking-tight leading-none lowercase">
        fimi<span className="text-primary">hub</span>
      </span>
    </span>
  )
}
