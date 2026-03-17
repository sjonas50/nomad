import type { HardwareFitness } from '../../types/hardware'

const CONFIG: Record<HardwareFitness, { label: string; className: string }> = {
  recommended: {
    label: 'Recommended',
    className: 'bg-green-100 text-green-800',
  },
  will_run_slow: {
    label: 'Will Run (Slow)',
    className: 'bg-yellow-100 text-yellow-800',
  },
  too_large: {
    label: 'Too Large',
    className: 'bg-red-100 text-red-800',
  },
}

export default function HardwareFitnessBadge({ fitness }: { fitness: HardwareFitness }) {
  const { label, className } = CONFIG[fitness]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
