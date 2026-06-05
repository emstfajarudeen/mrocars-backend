import type { ReactNode } from 'react'
import { cn } from '~/lib/utils'

export type TableColumn<T> = {
  key: string
  label: string
  render?: (row: T, index: number) => ReactNode
}

export type TableProps<T extends Record<string, unknown>> = {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  skeletonRows?: number
}

function TableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-bg-hover" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  className,
  skeletonRows = 5,
}: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-border', className)}>
      <table className="w-full min-w-full text-left text-sm">
        <thead className="border-b border-border bg-bg-secondary">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-bg-card">
          {loading ? (
            <TableSkeleton columns={columns.length} rows={skeletonRows} />
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-text-secondary"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition-colors hover:bg-bg-hover">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-text-primary">
                    {column.render
                      ? column.render(row, rowIndex)
                      : String(row[column.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
