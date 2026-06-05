import { DateTime } from 'luxon'

export function startOfCurrentMonth(): string {
  return DateTime.now().startOf('month').toSQL()!
}

export function parseBooleanQuery(value: unknown): boolean | undefined {
  if (value === 'true' || value === true || value === '1') return true
  if (value === 'false' || value === false || value === '0') return false
  return undefined
}

export function buildStatusCounts(
  rows: { status: string; count: number | string }[],
  allStatuses: string[]
): Record<string, number> {
  const counts = Object.fromEntries(allStatuses.map((status) => [status, 0]))

  for (const row of rows) {
    counts[row.status] = Number(row.count)
  }

  return counts
}

export function sumStatusCounts(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0)
}
