import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'FimiHub — African Marketplace',
  description: 'Buy, sell, rent and advertise on FimiHub — the marketplace built for Africa.',
  keywords: 'marketplace, ads, buy, sell, africa, lagos, accra, nairobi',
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
      </body>
    </html>
  )
}
