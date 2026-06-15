import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, MessageSquare, ShoppingBag, Star, Trash2, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { PageHeader } from '~/components/ui/PageHeader'
import { StatCard } from '~/components/ui/StatCard'
import { Table } from '~/components/ui/Table'
import { useToast } from '~/components/ui/Toast'
import { Switch } from '~/components/ui/Switch'
import { apiMutate, reloadPage } from '~/lib/mutate'
import { formatStatusLabel, statusToBadge } from '~/lib/status'
import { cn, formatCurrency } from '~/lib/utils'

type Props = {
  business: {
    user: { id: number; name: string; email: string; avatar_url: string | null; isActive: boolean }
    business_profile: {
      business_name: string
      email: string
      phone_code: string
      phone_number: string
      isApproved: boolean | number
      governorate: { nameEn: string } | null
      area: { nameEn: string } | null
      block: string | null
      street: string | null
    } | null
    stats: {
      total_requests_received: number
      total_responses_sent: number
      total_orders: number
      total_revenue: number
      average_rating: number | null
      total_reviews: number
    }
  }
  recent_orders: Array<{
    id: number
    order_no: string
    user: { name: string } | null
    request: { title: string; category: { nameEn: string } | null } | null
    total_amount: number
    status: string
    payment_status: string
    created_at: string
  }>
  recent_requests: Array<{
    id: number
    response_no: string
    price: string
    status: string
    request: {
      request_no: string
      title: string
      category: { nameEn: string } | null
      user: { name: string } | null
    } | null
    created_at: string
  }>
}

export default function BusinessDetail({ business, recent_orders, recent_requests }: Props) {
  const toast = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tab, setTab] = useState<'orders' | 'requests'>('orders')
  const bp = business.business_profile

  return (
    <>
      <Head title={bp?.business_name ?? business.user.name} />
      <Link href="/admin/businesses" className="mb-4 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader
        title={bp?.business_name ?? business.user.name}
        action={
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <span>Status</span>
              <Switch checked={business.user.isActive} onChange={async () => { await apiMutate('PUT', `/businesses/${business.user.id}/toggle-status`, {}); reloadPage() }} />
            </label>
          </div>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={MessageSquare} label="Requests" value={business.stats.total_requests_received} />
        <StatCard icon={TrendingUp} label="Responses" value={business.stats.total_responses_sent} />
        <StatCard icon={ShoppingBag} label="Orders" value={business.stats.total_orders} />
        <StatCard icon={TrendingUp} label="Revenue" value={formatCurrency(business.stats.total_revenue)} />
        <StatCard icon={Star} label="Rating" value={business.stats.average_rating ?? '—'} subValue={`${business.stats.total_reviews} reviews`} />
      </div>
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card title="Business Info">
          <div className="flex items-start gap-4">
            {business.user.avatar_url ? <img src={business.user.avatar_url} className="h-16 w-16 rounded-full" alt="" /> : null}
            <div className="space-y-2 text-sm">
              <p>{business.user.email}</p>
              <p className="font-mono">{bp?.phone_code} {bp?.phone_number}</p>
              {bp?.governorate ? <p>{bp.governorate.nameEn}, {bp.area?.nameEn} — {bp.block}, {bp.street}</p> : null}
              <div className="flex gap-2">
                <Badge variant={statusToBadge(business.user.isActive ? 'active' : 'inactive')}>{formatStatusLabel(business.user.isActive ? 'active' : 'inactive')}</Badge>
              </div>
            </div>
          </div>
        </Card>
        <Card title="Activity">
          <div className="flex gap-2 border-b border-border pb-4">
            {(['orders', 'requests'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm capitalize transition-colors',
                  tab === t ? 'bg-accent-soft text-accent' : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === 'orders' ? (
            <Table
              columns={[
                { key: 'no', label: 'Order', render: (r) => <span className="font-mono text-sm">{r.order_no}</span> },
                { key: 'user', label: 'User', render: (r) => r.user?.name ?? '—' },
                { key: 'amount', label: 'Total', render: (r) => <span className="font-mono">{formatCurrency(r.total_amount)}</span> },
                { key: 'status', label: 'Status', render: (r) => <Badge variant={statusToBadge(r.status)}>{formatStatusLabel(r.status)}</Badge> },
              ]}
              data={recent_orders}
            />
          ) : (
            <Table
              columns={[
                { key: 'no', label: 'Response', render: (r) => <span className="font-mono text-sm">{r.response_no}</span> },
                { key: 'req', label: 'Request', render: (r) => r.request?.title ?? '—' },
                { key: 'price', label: 'Price', render: (r) => <span className="font-mono">{formatCurrency(r.price)}</span> },
                { key: 'status', label: 'Status', render: (r) => <Badge variant={statusToBadge(r.status)}>{formatStatusLabel(r.status)}</Badge> },
              ]}
              data={recent_requests}
            />
          )}
        </Card>
      </div>

      <div className="mb-6">
        <Card title="Danger Zone" className="border-red-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-medium text-red-600">Delete this business</h4>
              <p className="text-sm text-text-secondary">Once you delete a business, there is no going back. Please be certain.</p>
            </div>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete Business
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete business?"
        onConfirm={async () => {
          await apiMutate('DELETE', `/businesses/${business.user.id}`, {})
          toast.success('Deleted')
          window.location.href = '/admin/businesses'
        }}
        variant="danger"
      />
    </>
  )
}
