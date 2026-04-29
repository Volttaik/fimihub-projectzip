import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center animate-in-up">
        <p className="text-8xl font-black text-primary/20 mb-4">404</p>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/"><Button className="gap-2"><Home className="w-4 h-4" /> Go Home</Button></Link>
          <Link href="/"><Button variant="outline" className="gap-2"><Search className="w-4 h-4" /> Browse Ads</Button></Link>
        </div>
      </div>
    </div>
  )
}
