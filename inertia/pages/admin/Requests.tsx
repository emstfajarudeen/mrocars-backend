import { Head, Link } from '@inertiajs/react'
import { Eye } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { DatePicker } from '~/components/ui/DatePicker'
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
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px] max-w-sm">
          <SearchInput
            defaultValue={filters.search ?? ''}
            onSearch={(s) => visitAdmin('/admin/requests', { search: s, page: 1 })}
          />
        </div>
        <Select
          className="w-36"
          value={filters.status ?? ''}
          onChange={(v) => visitAdmin('/admin/requests', { ...filters, status: v || null, page: 1 })}
          placeholder="All status"
          options={[
            { value: '', label: 'All status' },
            { value: 'new', label: 'New' },
            { value: 'accepted', label: 'Accepted' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
        <DatePicker
          className="w-40"
          value={filters.date_from ?? ''}
          onChange={(v) => visitAdmin('/admin/requests', { ...filters, date_from: v, page: 1 })}
          placeholder="From date"
        />
        <DatePicker
          className="w-40"
          value={filters.date_to ?? ''}
          onChange={(v) => visitAdmin('/admin/requests', { ...filters, date_to: v, page: 1 })}
          placeholder="To date"
        />
      </div>
      <Table
        columns={[
          { key: 'no', label: 'Request #', render: (r) => <span className="font-mono text-sm">{r.requestNo}</span> },
          { key: 'user', label: 'User', render: (r) => r.user?.name ?? '—' },
          { key: 'category', label: 'Category', render: (r) => r.category?.nameEn ?? '—' },
          { key: 'title', label: 'Title' },
          {
            key: 'responses',
            label: 'Offers',
            render: (r) => <span className="font-mono">{r.responses_count ?? 0}</span>,
          },
          {
            key: 'status',
            label: 'Status',
            render: (r) => <Badge variant={statusToBadge(r.status)}>{formatStatusLabel(r.status)}</Badge>,
          },
          { key: 'date', label: 'Date', render: (r) => formatDate(String(r.createdAt)) },
          {
            key: 'a',
            label: '',
            render: (r) => (
              <Link href={`/admin/requests/${r.id}`}>
                <Button size="sm" variant="ghost">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            ),
          },
        ]}
        data={requests}
      />
      <Pagination meta={meta} />
    </>
  )
}
