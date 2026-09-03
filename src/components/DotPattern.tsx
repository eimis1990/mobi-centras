import { useId } from 'react'

// Tiled dot grid as an ambient page background. Colour comes from a fill-* class.
export function DotPattern({ className = '', size = 16, r = 1 }: { className?: string; size?: number; r?: number }) {
  const id = useId()
  return (
    <svg aria-hidden="true" className={`pointer-events-none absolute inset-0 size-full fill-neutral-400/80 ${className}`}>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
          <circle cx={r} cy={r} r={r} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  )
}
