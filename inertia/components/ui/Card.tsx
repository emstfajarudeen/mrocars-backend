import type { ReactNode } from 'react'
import { cn } from '~/lib/utils'

export type CardProps = {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ title, action, children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-bg-card p-6',
        className
      )}
    >
      {title || action ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title ? <h3 className="text-lg font-semibold text-text-primary">{title}</h3> : <span />}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}
