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
import { formatCurrency, formatDate, type PaginationMeta } from '~/lib/utils'

type Order = {
  id: number
  orderNo: string
  status: string
  paymentStatus: string
  createdAt: string
  total_amount: number
  payment_method: string
  user: { name: string } | null
  business_profile: { business_name: string } | null
  request: { category: { nameEn: string } | null } | null
}

type Props = {
  orders: Order[]
  meta: PaginationMeta
  filters: {
    status: string | null
    payment_status: string | null
    search: string | null
    date_from: string | null
    date_to: string | null
  }
}

export default function Orders({ orders, meta, filters }: Props) {
  return (
    <>
      <Head title="Orders" />
      <PageHeader title="Orders" description="All platform orders" />
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="max-w-sm flex-1">
          <SearchInput
            defaultValue={filters.search ?? ''}
            onSearch={(s) => visitAdmin('/admin/orders', { ...filters, search: s, page: 1 })}
          />
        </div>
        <Select
          className="w-36"
          value={filters.status ?? ''}
          onChange={(e) => visitAdmin('/admin/orders', { ...filters, status: e.target.value || null, page: 1 })}
        >
          <option value="">All status</option>
          {['new', 'pending', 'delivered', 'cancelled'].map((s) => (
            <option key={s} value={s}>{formatStatusLabel(s)}</option>
          ))}
        </Select>
        <Select
          className="w-40"
          value={filters.payment_status ?? ''}
          onChange={(e) => visitAdmin('/admin/orders', { ...filters, payment_status: e.target.value || null, page: 1 })}
        >
          <option value="">All payment</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </Select>
        <Input
          type="date"
          className="w-40"
          defaultValue={filters.date_from ?? ''}
          onChange={(e) => visitAdmin('/admin/orders', { ...filters, date_from: e.target.value, page: 1 })}
        />
        <Input
          type="date"
          className="w-40"
          defaultValue={filters.date_to ?? ''}
          onChange={(e) => visitAdmin('/admin/orders', { ...filters, date_to: e.target.value, page: 1 })}
        />
      </div>
      <Table
        columns={[
          { key: 'no', label: 'Order #', render: (r) => <span className="font-mono text-sm">{r.orderNo}</span> },
          { key: 'user', label: 'User', render: (r) => r.user?.name ?? '—' },
          { key: 'business', label: 'Business', render: (r) => r.business_profile?.business_name ?? '—' },
          { key: 'category', label: 'Category', render: (r) => r.request?.category?.nameEn ?? '—' },
          { key: 'amount', label: 'Total', render: (r) => <span className="font-mono text-accent">{formatCurrency(r.total_amount)}</span> },
          { key: 'payment', label: 'Payment', render: (r) => r.payment_method ?? '—' },
          { key: 'status', label: 'Status', render: (r) => <Badge variant={statusToBadge(r.status)}>{formatStatusLabel(r.status)}</Badge> },
          { key: 'pay', label: 'Paid', render: (r) => <Badge variant={statusToBadge(r.paymentStatus)}>{formatStatusLabel(r.paymentStatus)}</Badge> },
          { key: 'date', label: 'Date', render: (r) => formatDate(String(r.createdAt)) },
          { key: 'a', label: '', render: (r) => (
            <Link href={`/admin/orders/${r.id}`}><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></Link>
          ) },
        ]}
        data={orders}
      />
      <Pagination meta={meta} />
    </>
  )
}
