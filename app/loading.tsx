export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
      <div
        className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
        role="status"
        aria-label="Loading"
      />
      <p className="text-sm text-muted-foreground font-medium">Loading…</p>
    </div>
  )
}
