import { Head, Link } from '@inertiajs/react'
import { Eye } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'
import { PageHeader } from '~/components/ui/PageHeader'
import { Pagination } from '~/components/ui/Pagination'
import { SearchInput } from '~/components/ui/SearchInput'
import { Select } from '~/components/ui/Select'
import { Table } from '~/components/ui/Table'
import { visitAdmin } from '~/lib/mutate'
import { formatStatusLabel, statusToBadge } from '~/lib/status'
import { formatDate, type PaginationMeta } from '~/lib/utils'

type Request = {
  id: number
  requestNo: string
  title: string
  status: string
  createdAt: string
  user: { name: string } | null
  category: { nameEn: string } | null
  responses_count?: number
}

type Props = {
  requests: Request[]
  meta: PaginationMeta
  filters: { status: string | null; search: string | null; date_from: string | null; date_to: string | null }
}

export default function Requests({ requests, meta, filters }: Props) {
  return (
    <>
      <Head title="Requests" />
      <PageHeader title="Requests" description="All platform service requests" />
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="max-w-sm flex-1"><SearchInput defaultValue={filters.search ?? ''} onSearch={(s) => visitAdmin('/admin/requests', { search: s, page: 1 })} /></div>
        <Select className="w-36" value={filters.status ?? ''} onChange={(e) => visitAdmin('/admin/requests', { status: e.target.value || null, page: 1 })}>
          <option value="">All status</option>
          {['new', 'accepted', 'confirmed', 'rejected', 'cancelled'].map((s) => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
        </Select>
        <Input type="date" className="w-40" defaultValue={filters.date_from ?? ''} onChange={(e) => visitAdmin('/admin/requests', { ...filters, date_from: e.target.value, page: 1 })} />
        <Input type="date" className="w-40" defaultValue={filters.date_to ?? ''} onChange={(e) => visitAdmin('/admin/requests', { ...filters, date_to: e.target.value, page: 1 })} />
      </div>
      <Table columns={[
        { key: 'no', label: 'Request #', render: (r) => <span className="font-mono text-sm">{r.requestNo}</span> },
        { key: 'user', label: 'User', render: (r) => r.user?.name ?? '—' },
        { key: 'category', label: 'Category', render: (r) => r.category?.nameEn ?? '—' },
        { key: 'title', label: 'Title' },
        { key: 'responses', label: 'Offers', render: (r) => <span className="font-mono">{r.responses_count ?? 0}</span> },
        { key: 'status', label: 'Status', render: (r) => <Badge variant={statusToBadge(r.status)}>{formatStatusLabel(r.status)}</Badge> },
        { key: 'date', label: 'Date', render: (r) => formatDate(String(r.createdAt)) },
        { key: 'a', label: '', render: (r) => <Link href={`/admin/requests/${r.id}`}><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></Link> },
      ]} data={requests} />
      <Pagination meta={meta} />
    </>
  )
}
