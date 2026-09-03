import { Search, X } from 'lucide-react'

export function SearchInput({ value, onChange, placeholder, className = '' }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" strokeWidth={1.5} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onKeyDown={e => e.key === 'Escape' && onChange('')}
        className="w-full h-9 pl-9 pr-9 rounded-md border border-border bg-card text-[13px] outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition" />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition">
          <X className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
