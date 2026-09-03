import { useState } from 'react'

// Shows /public/logo.png when present; falls back to the letter mark if the file is missing.
export function Logo({ className = '', letter = 'M' }: { className?: string; letter?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <span aria-hidden="true" className={`grid place-items-center bg-primary text-primary-foreground font-semibold shrink-0 ${className}`}>{letter}</span>
  }
  return <img src="/logo.png" alt="" onError={() => setFailed(true)} className={`object-contain shrink-0 ${className}`} />
}
