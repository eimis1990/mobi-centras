export function Placeholder({ title }: { title: string }) {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground">Coming next.</p>
    </div>
  )
}
