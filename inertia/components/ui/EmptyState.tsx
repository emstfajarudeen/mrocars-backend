import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '~/lib/utils'

export type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-bg-secondary px-6 py-16 text-center',
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-hover text-text-muted">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="text-lg font-medium text-text-primary">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-text-secondary">{description}</p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  )
}
