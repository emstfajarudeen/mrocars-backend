import type { LucideIcon } from 'lucide-react'
import { cn } from '~/lib/utils'

export type StatCardProps = {
  icon: LucideIcon
  label: string
  value: string | number
  subValue?: string
  className?: string
}

export function StatCard({ icon: Icon, label, value, subValue, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-bg-card p-5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
          {subValue ? (
            <p className="mt-1 text-xs text-text-muted">{subValue}</p>
          ) : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  )
}
