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
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px] max-w-sm">
          <SearchInput
            defaultValue={filters.search ?? ''}
            onSearch={(s) => visitAdmin('/admin/orders', { ...filters, search: s, page: 1 })}
          />
        </div>
        <Select
          className="w-36"
          value={filters.status ?? ''}
          onChange={(v) => visitAdmin('/admin/orders', { ...filters, status: v || null, page: 1 })}
          placeholder="All status"
          options={[
            { value: '', label: 'All status' },
            { value: 'new', label: 'New' },
            { value: 'pending', label: 'Pending' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
        <Select
          className="w-40"
          value={filters.payment_status ?? ''}
          onChange={(v) => visitAdmin('/admin/orders', { ...filters, payment_status: v || null, page: 1 })}
          placeholder="All payment"
          options={[
            { value: '', label: 'All payment' },
            { value: 'paid', label: 'Paid' },
            { value: 'unpaid', label: 'Unpaid' },
          ]}
        />
        <DatePicker
          className="w-40"
          value={filters.date_from ?? ''}
          onChange={(v) => visitAdmin('/admin/orders', { ...filters, date_from: v, page: 1 })}
          placeholder="From date"
        />
        <DatePicker
          className="w-40"
          value={filters.date_to ?? ''}
          onChange={(v) => visitAdmin('/admin/orders', { ...filters, date_to: v, page: 1 })}
          placeholder="To date"
        />
      </div>
      <Table
        columns={[
          { key: 'no', label: 'Order #', render: (r) => <span className="font-mono text-sm">{r.orderNo}</span> },
          { key: 'user', label: 'User', render: (r) => r.user?.name ?? '—' },
          { key: 'business', label: 'Business', render: (r) => r.business_profile?.business_name ?? '—' },
          { key: 'category', label: 'Category', render: (r) => r.request?.category?.nameEn ?? '—' },
          {
            key: 'amount',
            label: 'Total',
            render: (r) => <span className="font-mono text-accent">{formatCurrency(r.total_amount)}</span>,
          },
          { key: 'payment', label: 'Payment', render: (r) => r.payment_method ?? '—' },
          {
            key: 'status',
            label: 'Status',
            render: (r) => (
              <Badge variant={statusToBadge(r.status)}>{formatStatusLabel(r.status)}</Badge>
            ),
          },
          {
            key: 'pay',
            label: 'Paid',
            render: (r) => (
              <Badge variant={statusToBadge(r.paymentStatus)}>{formatStatusLabel(r.paymentStatus)}</Badge>
            ),
          },
          { key: 'date', label: 'Date', render: (r) => formatDate(String(r.createdAt)) },
          {
            key: 'a',
            label: '',
            render: (r) => (
              <Link href={`/admin/orders/${r.id}`}>
                <Button size="sm" variant="ghost">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            ),
          },
        ]}
        data={orders}
      />
      <Pagination meta={meta} />
    </>
  )
}
