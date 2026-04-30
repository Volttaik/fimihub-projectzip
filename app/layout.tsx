import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import Header from '@/components/Header'
import PWARegister from '@/components/PWARegister'
import InstallPrompt from '@/components/InstallPrompt'

export const metadata: Metadata = {
  title: 'fimihub — the marketplace for students & business owners',
  description: 'Buy, sell, rent and advertise on fimihub — the trusted marketplace built for students and business owners.',
  keywords: 'marketplace, ads, buy, sell, students, business, rentals, services',
  manifest: '/manifest.webmanifest',
  applicationName: 'fimihub',
  appleWebApp: {
    capable: true,
    title: 'fimihub',
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
        <InstallPrompt />
      </body>
    </html>
  )
}
