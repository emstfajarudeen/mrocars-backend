import { Head } from '@inertiajs/react'
import {
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  FileText,
  Download,
} from 'lucide-react'
import { useState } from 'react'
import { Card } from '~/components/ui/Card'
import { Button } from '~/components/ui/Button'
import { PageHeader } from '~/components/ui/PageHeader'
import { StatCard } from '~/components/ui/StatCard'
import { Table } from '~/components/ui/Table'
import { DatePicker } from '~/components/ui/DatePicker'
import { visitAdmin } from '~/lib/mutate'
import { formatCurrency } from '~/lib/utils'

type Stats = {
  order_count: number
  revenue: number
  avg_order_value: number
  new_users: number
  new_businesses: number
  new_requests: number
}

type TrendPoint = {
  date: string
  count: number
  amount: number
}

type Props = {
  stats: Stats
  trend: TrendPoint[]
  filters: {
    start_date: string
    end_date: string
  }
}

export default function Reports({ stats, trend, filters }: Props) {
  const [startDate, setStartDate] = useState(filters.start_date)
  const [endDate, setEndDate] = useState(filters.end_date)

  const handleFilter = () => {
    visitAdmin('/admin/reports', {
      start_date: startDate || null,
      end_date: endDate || null,
    })
  }

  const handleExport = () => {
    const query = new URLSearchParams()
    if (startDate) query.append('start_date', startDate)
    if (endDate) query.append('end_date', endDate)
    window.location.href = `/api/v1/admin/reports/export?${query.toString()}`
  }

  return (
    <>
      <Head title="Admin Reports" />
      <PageHeader
        title="Reports"
        description="Analyze orders, revenue, customer signups, and service requests"
        action={
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Date Filters Card */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-bg-card p-4">
        <div className="w-56">
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(val) => setStartDate(val)}
            placeholder="Select start date"
          />
        </div>
        <div className="w-56">
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(val) => setEndDate(val)}
            placeholder="Select end date"
          />
        </div>
        <Button onClick={handleFilter}>Apply Filters</Button>
      </div>

      {/* Stats Cards Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={stats.order_count}
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(stats.revenue)}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Order Value"
          value={formatCurrency(stats.avg_order_value)}
        />
        <StatCard
          icon={Users}
          label="New Users"
          value={stats.new_users}
        />
        <StatCard
          icon={Building2}
          label="New Businesses"
          value={stats.new_businesses}
        />
        <StatCard
          icon={FileText}
          label="New Requests"
          value={stats.new_requests}
        />
      </div>

      {/* Charts Section */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Revenue & Order Trends">
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#888" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#1A6B3C" fontSize={11} label={{ value: 'Revenue', angle: -90, position: 'insideLeft', fill: '#1A6B3C', style: { textAnchor: 'middle' } }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#2563EB" fontSize={11} label={{ value: 'Orders', angle: 90, position: 'insideRight', fill: '#2563EB', style: { textAnchor: 'middle' } }} />
                  <Tooltip contentStyle={{ background: '#161616', border: '1px solid #2A2A2A' }} labelClassName="text-text-primary text-xs" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="amount"
                    name="Revenue"
                    stroke="#1A6B3C"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    name="Orders Count"
                    stroke="#2563EB"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-text-muted">
                No paid orders trend data found in the selected date range.
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card title="Daily Aggregates Summary" className="h-full max-h-[385px] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto pr-1">
              <Table
                columns={[
                  { key: 'date', label: 'Date' },
                  { key: 'count', label: 'Orders', render: (r) => <span className="font-mono">{r.count}</span> },
                  { key: 'amount', label: 'Revenue', render: (r) => <span className="font-mono text-accent">{formatCurrency(r.amount)}</span> },
                ]}
                data={trend}
              />
              {trend.length === 0 && (
                <div className="py-8 text-center text-sm text-text-muted">
                  No daily records.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
