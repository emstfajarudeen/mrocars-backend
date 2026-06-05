import { router, usePage } from '@inertiajs/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import { cn } from '~/lib/utils'

export type PaginationMeta = {
  current_page: number
  last_page: number
  total: number
}

export type PaginationProps = {
  meta: PaginationMeta
  queryKey?: string
  className?: string
}

function getVisiblePages(current: number, last: number): number[] {
  const pages: number[] = []
  const delta = 2
  const start = Math.max(1, current - delta)
  const end = Math.min(last, current + delta)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
}

export function Pagination({ meta, queryKey = 'page', className }: PaginationProps) {
  const { url } = usePage()

  function goToPage(page: number) {
    if (page < 1 || page > meta.last_page || page === meta.current_page) return

    const parsed = new URL(url, window.location.origin)
    const query = Object.fromEntries(parsed.searchParams.entries())

    router.get(
      parsed.pathname,
      { ...query, [queryKey]: page },
      { preserveState: true, preserveScroll: true }
    )
  }

  if (meta.last_page <= 1) return null

  const visiblePages = getVisiblePages(meta.current_page, meta.last_page)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4',
        className
      )}
    >
      <p className="text-sm text-text-secondary">
        Page {meta.current_page} of {meta.last_page}
        <span className="text-text-muted"> · {meta.total} total</span>
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page <= 1}
          onClick={() => goToPage(meta.current_page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {visiblePages[0] > 1 ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => goToPage(1)}>
              1
            </Button>
            {visiblePages[0] > 2 ? (
              <span className="px-1 text-text-muted">…</span>
            ) : null}
          </>
        ) : null}

        {visiblePages.map((page) => (
          <Button
            key={page}
            variant={page === meta.current_page ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => goToPage(page)}
            aria-current={page === meta.current_page ? 'page' : undefined}
          >
            {page}
          </Button>
        ))}

        {visiblePages[visiblePages.length - 1] < meta.last_page ? (
          <>
            {visiblePages[visiblePages.length - 1] < meta.last_page - 1 ? (
              <span className="px-1 text-text-muted">…</span>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => goToPage(meta.last_page)}>
              {meta.last_page}
            </Button>
          </>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => goToPage(meta.current_page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
