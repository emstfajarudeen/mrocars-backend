import { Head, Link } from '@inertiajs/react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Building2, FileText, ShoppingBag, Users } from 'lucide-react'
import { Card } from '~/components/ui/Card'
import { PageHeader } from '~/components/ui/PageHeader'
import { StatCard } from '~/components/ui/StatCard'
import { formatCurrency, formatDateTime } from '~/lib/utils'

type DashboardStats = {
  users: { total: number; active: number; inactive: number; new_this_month: number }
  businesses: { total: number; active: number; approved: number; pending_approval: number; new_this_month: number }
  requests: { total: number; new: number; accepted: number; confirmed: number; rejected: number; cancelled: number; new_this_month: number }
  orders: { total: number; new: number; pending: number; delivered: number; cancelled: number; new_this_month: number }
  revenue: { total_revenue: number; received_amount: number; pending_amount: number; revenue_this_month: number }
}

type Activity = {
  recent_requests: Array<{
    id: number
    request_no: string
    title: string
    user: { name: string } | null
    category: { nameEn: string } | null
    created_at: string
  }>
  recent_orders: Array<{
    id: number
    order_no: string
    user: { name: string } | null
    business: { business_name: string } | null
    total_amount: string
    created_at: string
  }>
  recent_users: Array<{ id: number; name: string; email: string; created_at: string }>
  recent_businesses: Array<{
    id: number
    name: string
    business_name: string | null
    created_at: string
  }>
}

type Props = { stats: DashboardStats; activity: Activity }

export default function Dashboard({ stats, activity }: Props) {
  const orderChart = [
    { name: 'New', value: stats.orders.new },
    { name: 'Pending', value: stats.orders.pending },
    { name: 'Delivered', value: stats.orders.delivered },
    { name: 'Cancelled', value: stats.orders.cancelled },
  ]

  const requestChart = [
    { name: 'New', value: stats.requests.new },
    { name: 'Accepted', value: stats.requests.accepted },
    { name: 'Confirmed', value: stats.requests.confirmed },
    { name: 'Rejected', value: stats.requests.rejected },
    { name: 'Cancelled', value: stats.requests.cancelled },
  ]

  return (
    <>
      <Head title="Dashboard" />
      <PageHeader title="Dashboard" description="Platform overview and recent activity" />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={stats.users.total} subValue={`${stats.users.active} active`} />
        <StatCard icon={Building2} label="Businesses" value={stats.businesses.total} subValue={`${stats.businesses.approved} approved`} />
        <StatCard icon={FileText} label="Requests" value={stats.requests.total} subValue={`${stats.requests.new_this_month} this month`} />
        <StatCard icon={ShoppingBag} label="Revenue" value={formatCurrency(stats.revenue.total_revenue)} subValue={`${formatCurrency(stats.revenue.revenue_this_month)} this month`} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card title="Orders by Status">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={orderChart}>
              <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip contentStyle={{ background: '#161616', border: '1px solid #2A2A2A' }} />
              <Bar dataKey="value" fill="#1A6B3C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Requests by Status">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={requestChart}>
              <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip contentStyle={{ background: '#161616', border: '1px solid #2A2A2A' }} />
              <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card title="Recent Orders">
          <div className="space-y-3">
            {activity.recent_orders.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors duration-150 hover:bg-bg-hover">
                <div>
                  <p className="font-mono text-sm">{order.order_no}</p>
                  <p className="text-xs text-text-secondary">{order.user?.name} · {order.business?.business_name}</p>
                </div>
                <span className="font-mono text-sm text-accent">{formatCurrency(order.total_amount)}</span>
              </Link>
            ))}
          </div>
        </Card>
        <Card title="Recent Requests">
          <div className="space-y-3">
            {activity.recent_requests.map((req) => (
              <Link key={req.id} href={`/admin/requests/${req.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors duration-150 hover:bg-bg-hover">
                <div>
                  <p className="font-mono text-sm">{req.request_no}</p>
                  <p className="text-xs text-text-secondary">{req.user?.name} · {req.category?.nameEn}</p>
                </div>
                <span className="text-xs text-text-muted">{formatDateTime(String(req.created_at))}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Recent Users">
          <div className="space-y-2">
            {activity.recent_users.map((u) => (
              <Link key={u.id} href={`/admin/users/${u.id}`} className="flex justify-between rounded-lg p-2 hover:bg-bg-hover">
                <span>{u.name}</span>
                <span className="text-xs text-text-secondary">{u.email}</span>
              </Link>
            ))}
          </div>
        </Card>
        <Card title="Recent Businesses">
          <div className="space-y-2">
            {activity.recent_businesses.map((b) => (
              <Link key={b.id} href={`/admin/businesses/${b.id}`} className="flex justify-between rounded-lg p-2 hover:bg-bg-hover">
                <span className="text-xs text-text-muted">{b.business_name ?? b.name}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
