import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '~/lib/utils'

export type BreadcrumbItem = {
  label: string
  href?: string
}

export type PageHeaderProps = {
  title: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  action?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      {breadcrumb && breadcrumb.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm">
          {breadcrumb.map((item, index) => {
            const isLast = index === breadcrumb.length - 1

            return (
              <span key={`${item.label}-${index}`} className="flex items-center gap-1">
                {index > 0 ? (
                  <ChevronRight className="h-4 w-4 text-text-muted" aria-hidden />
                ) : null}
                {item.href && !isLast ? (
                  <a
                    href={item.href}
                    className="text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span
                    className={cn(
                      isLast ? 'text-text-primary' : 'text-text-secondary'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </span>
            )
          })}
        </nav>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}
