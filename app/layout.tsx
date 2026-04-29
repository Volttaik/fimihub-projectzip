import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import Header from '@/components/Header'
import PWARegister from '@/components/PWARegister'

export const metadata: Metadata = {
  title: 'FimiHub — African Marketplace',
  description: 'Buy, sell, rent and advertise on FimiHub — the marketplace built for Africa.',
  keywords: 'marketplace, ads, buy, sell, africa, lagos, accra, nairobi',
  manifest: '/manifest.webmanifest',
  applicationName: 'FimiHub',
  appleWebApp: {
    capable: true,
    title: 'FimiHub',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7b3fe4' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1422' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <Header />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            },
          }}
        />
        <PWARegister />
      </body>
    </html>
  )
}
