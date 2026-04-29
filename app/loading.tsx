import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex gap-6">
        <div className="flex-1 max-w-2xl space-y-3">
          <Skeleton className="h-12 rounded-2xl" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="hidden lg:flex flex-col gap-4 w-64">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
