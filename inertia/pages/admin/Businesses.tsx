import { Head, Link } from '@inertiajs/react'
import { Eye, Plus } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { PageHeader } from '~/components/ui/PageHeader'
import { Pagination } from '~/components/ui/Pagination'
import { SearchInput } from '~/components/ui/SearchInput'
import { Select } from '~/components/ui/Select'
import { Table } from '~/components/ui/Table'
import { visitAdmin } from '~/lib/mutate'
import { formatStatusLabel, statusToBadge } from '~/lib/status'
import { formatCurrency, formatDate, type PaginationMeta } from '~/lib/utils'

type Business = {
  user: { id: number; name: string; email: string }
  business_profile: { business_name: string; avatar_url: string | null; is_approved: boolean } | null
  is_active: boolean
  created_at: string
  total_orders: number
  total_revenue: number
}

type Props = {
  businesses: Business[]
  meta: PaginationMeta
  filters: { search: string | null; is_active: boolean | null; is_approved: boolean | null }
}

export default function Businesses({ businesses, meta, filters }: Props) {
  return (
    <>
      <Head title="Businesses" />
      <PageHeader title="Businesses" action={<Link href="/admin/businesses/create"><Button><Plus className="h-4 w-4" /> Add Business</Button></Link>} />
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="max-w-sm flex-1"><SearchInput defaultValue={filters.search ?? ''} onSearch={(s) => visitAdmin('/admin/businesses', { search: s, page: 1 })} /></div>
        <Select className="w-36" value={filters.is_active === null ? '' : String(filters.is_active)} onChange={(e) => visitAdmin('/admin/businesses', { is_active: e.target.value || null, page: 1 })}>
          <option value="">All status</option><option value="true">Active</option><option value="false">Inactive</option>
        </Select>
        <Select className="w-36" value={filters.is_approved === null ? '' : String(filters.is_approved)} onChange={(e) => visitAdmin('/admin/businesses', { is_approved: e.target.value || null, page: 1 })}>
          <option value="">All approval</option><option value="true">Approved</option><option value="false">Pending</option>
        </Select>
      </div>
      <Table columns={[
        { key: 'avatar', label: '', render: (r) => r.business_profile?.avatar_url ? <img src={r.business_profile.avatar_url} className="h-8 w-8 rounded-full" alt="" /> : null },
        { key: 'name', label: 'Business', render: (r) => r.business_profile?.business_name ?? r.user.name },
        { key: 'email', label: 'Email', render: (r) => r.user.email },
        { key: 'orders', label: 'Orders', render: (r) => <span className="font-mono">{r.total_orders}</span> },
        { key: 'revenue', label: 'Revenue', render: (r) => <span className="font-mono text-accent">{formatCurrency(r.total_revenue)}</span> },
        { key: 'approved', label: 'Approved', render: (r) => <Badge variant={statusToBadge(r.business_profile?.is_approved ? 'approved' : 'pending')}>{r.business_profile?.is_approved ? 'Approved' : 'Pending'}</Badge> },
        { key: 'status', label: 'Status', render: (r) => <Badge variant={statusToBadge(r.is_active ? 'active' : 'inactive')}>{formatStatusLabel(r.is_active ? 'active' : 'inactive')}</Badge> },
        { key: 'joined', label: 'Joined', render: (r) => formatDate(String(r.created_at)) },
        { key: 'a', label: '', render: (r) => <Link href={`/admin/businesses/${r.user.id}`}><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></Link> },
      ]} data={businesses} />
      <Pagination meta={meta} />
    </>
  )
}
