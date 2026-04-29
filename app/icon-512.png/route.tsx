import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, hsl(263, 78%, 56%) 0%, hsl(283, 78%, 42%) 100%)',
        }}
      >
        <svg width="380" height="380" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M168 168v-16a88 88 0 0 1 176 0v16"
            fill="none"
            stroke="#ffffff"
            strokeWidth="28"
            strokeLinecap="round"
          />
          <path
            d="M120 168h272l-22 224a40 40 0 0 1-40 36H182a40 40 0 0 1-40-36z"
            fill="hsl(35, 95%, 58%)"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinejoin="round"
          />
          <circle cx="200" cy="240" r="14" fill="#ffffff" />
          <circle cx="312" cy="240" r="14" fill="#ffffff" />
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  )
}
