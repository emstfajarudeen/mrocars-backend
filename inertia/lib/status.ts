export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export function statusToBadge(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    new: 'info',
    accepted: 'success',
    confirmed: 'success',
    pending: 'warning',
    delivered: 'success',
    cancelled: 'danger',
    rejected: 'danger',
    paid: 'success',
    unpaid: 'warning',
    active: 'success',
    inactive: 'danger',
    approved: 'success',
    'pending approval': 'warning',
  }
  return map[status.toLowerCase()] ?? 'neutral'
}

export function formatStatusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
