import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, Trash2 } from 'lucide-react'
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
import { formatCurrency, formatDate } from '~/lib/utils'
import { FileText, ShoppingBag, Wallet } from 'lucide-react'
import { useState } from 'react'

type Props = {
  user: {
    id: number
    name: string
    email: string
    phone_code: string | null
    phone_number: string | null
    phoneCode?: string | null
    phoneNumber?: string | null
    avatar_url: string | null
    language: string
    is_active: boolean
    created_at: string
    is_guest?: boolean
    stats: { total_requests: number; total_orders: number; total_spent: number }
    vehicles: Array<{ id: number; year: string; isDefault: boolean; car_brand: { name: string } | null; car_model: { name: string } | null }>
    addresses: Array<{ id: number; label: string; block: string; street: string; isDefault: boolean; governorate: { nameEn: string } | null; area: { nameEn: string } | null }>
  }
}

export default function UserDetail({ user }: Props) {
  const toast = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <Head title={user.name} />
      <Link href={user.is_guest ? "/admin/guests" : "/admin/users"} className="mb-4 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to {user.is_guest ? "guests" : "users"}
      </Link>
      <PageHeader
        title={user.name}
        action={
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <span>Status</span>
              <Switch checked={user.is_active} onChange={async () => { await apiMutate('PUT', `/users/${user.id}/toggle-status`, {}); reloadPage() }} />
            </label>
          </div>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={FileText} label="Requests" value={user.stats.total_requests} />
        <StatCard icon={ShoppingBag} label="Orders" value={user.stats.total_orders} />
        <StatCard icon={Wallet} label="Total Spent" value={formatCurrency(user.stats.total_spent)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <div className="flex items-start gap-4">
            {user.avatar_url ? <img src={user.avatar_url} className="h-16 w-16 rounded-full" alt="" /> : null}
            <div className="space-y-2 text-sm">
              <p>{user.email}</p>
              <p>Mobile: {(user.phone_code || user.phoneCode) && (user.phone_number || user.phoneNumber) ? `${user.phone_code || user.phoneCode} ${user.phone_number || user.phoneNumber}` : '—'}</p>
              <Badge variant={statusToBadge(user.is_active ? 'active' : 'inactive')}>{formatStatusLabel(user.is_active ? 'active' : 'inactive')}</Badge>
              <p className="text-text-secondary">Joined {formatDate(user.created_at)}</p>
            </div>
          </div>
        </Card>
        <Card title="Vehicles">
          <Table columns={[
            { key: 'brand', label: 'Brand', render: (r) => r.car_brand?.name ?? '—' },
            { key: 'model', label: 'Model', render: (r) => r.car_model?.name ?? '—' },
            { key: 'year', label: 'Year', render: (r) => <span className="font-mono">{r.year}</span> },
            { key: 'default', label: '', render: (r) => r.isDefault ? <Badge variant="success">Default</Badge> : null },
          ]} data={user.vehicles} />
        </Card>
        <Card title="Addresses" className="lg:col-span-2">
          <div className="space-y-3">
            {user.addresses.map((a) => (
              <div key={a.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.label}</span>
                  {a.isDefault ? <Badge variant="success">Default</Badge> : null}
                </div>
                <p className="text-sm text-text-secondary">
                  {[
                    [a.governorate?.nameEn, a.area?.nameEn].filter(Boolean).join(', '),
                    [a.block ? `Block ${a.block}` : '', a.street].filter(Boolean).join(', ')
                  ].filter(Boolean).join(' — ')}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-6 mb-6">
        <Card title="Danger Zone" className="border-red-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-medium text-red-600">Delete this {user.is_guest ? 'guest' : 'user'}</h4>
              <p className="text-sm text-text-secondary">Once you delete a {user.is_guest ? 'guest' : 'user'}, there is no going back. Please be certain.</p>
            </div>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete {user.is_guest ? 'Guest' : 'User'}
            </Button>
          </div>
        </Card>
      </div>
      <ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} title={user.is_guest ? "Delete guest?" : "Delete user?"} onConfirm={async () => { await apiMutate('DELETE', `/users/${user.id}`, {}); toast.success('Deleted'); window.location.href = user.is_guest ? '/admin/guests' : '/admin/users' }} variant="danger" />
    </>
  )
}
