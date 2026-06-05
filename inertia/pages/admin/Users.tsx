import { Head, Link } from '@inertiajs/react'
import { Eye, Trash2 } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { PageHeader } from '~/components/ui/PageHeader'
import { Pagination } from '~/components/ui/Pagination'
import { SearchInput } from '~/components/ui/SearchInput'
import { Select } from '~/components/ui/Select'
import { Table } from '~/components/ui/Table'
import { useToast } from '~/components/ui/Toast'
import { apiMutate, reloadPage, visitAdmin } from '~/lib/mutate'
import { formatStatusLabel, statusToBadge } from '~/lib/status'
import { formatDate, type PaginationMeta } from '~/lib/utils'
import { useState } from 'react'

type User = {
  id: number
  name: string
  email: string
  phone_code: string | null
  phone_number: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  total_requests: number
  total_orders: number
}

type Props = { users: User[]; meta: PaginationMeta; filters: { search: string | null; is_active: boolean | null } }

export default function Users({ users, meta, filters }: Props) {
  const toast = useToast()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  return (
    <>
      <Head title="Users" />
      <PageHeader title="Users" description="Manage platform users" />
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="max-w-sm flex-1"><SearchInput defaultValue={filters.search ?? ''} onSearch={(s) => visitAdmin('/admin/users', { search: s, page: 1 })} /></div>
        <Select className="w-40" value={filters.is_active === null ? '' : String(filters.is_active)} onChange={(e) => visitAdmin('/admin/users', { is_active: e.target.value === '' ? null : e.target.value, page: 1 })}>
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>
      <Table columns={[
        { key: 'avatar', label: '', render: (r) => r.avatar_url ? <img src={r.avatar_url} className="h-8 w-8 rounded-full" alt="" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-hover text-xs">{r.name[0]}</div> },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone', render: (r) => <span className="font-mono text-sm">{r.phone_code} {r.phone_number}</span> },
        { key: 'requests', label: 'Requests', render: (r) => <span className="font-mono">{r.total_requests}</span> },
        { key: 'orders', label: 'Orders', render: (r) => <span className="font-mono">{r.total_orders}</span> },
        { key: 'status', label: 'Status', render: (r) => <Badge variant={statusToBadge(r.is_active ? 'active' : 'inactive')}>{formatStatusLabel(r.is_active ? 'active' : 'inactive')}</Badge> },
        { key: 'joined', label: 'Joined', render: (r) => formatDate(r.created_at) },
        { key: 'a', label: '', render: (r) => (
          <div className="flex gap-1">
            <Link href={`/admin/users/${r.id}`}><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></Link>
            <Button size="sm" variant="ghost" onClick={async () => { await apiMutate('PUT', `/users/${r.id}/toggle-status`, {}); reloadPage() }}>Toggle</Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
          </div>
        )},
      ]} data={users} />
      <Pagination meta={meta} />
      <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete user?" onConfirm={async () => { if (deleteId) { await apiMutate('DELETE', `/users/${deleteId}`, {}); toast.success('Deleted'); setDeleteId(null); reloadPage() } }} variant="danger" />
    </>
  )
}
