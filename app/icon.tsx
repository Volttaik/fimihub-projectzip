import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M168 168v-16a88 88 0 0 1 176 0v16"
            fill="none"
            stroke="#ffffff"
            strokeWidth="32"
            strokeLinecap="round"
          />
          <path
            d="M120 168h272l-22 224a40 40 0 0 1-40 36H182a40 40 0 0 1-40-36z"
            fill="hsl(35, 95%, 58%)"
            stroke="#ffffff"
            strokeWidth="18"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
