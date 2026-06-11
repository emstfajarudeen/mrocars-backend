import { Head, Link } from '@inertiajs/react'
import { Eye, Trash2, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { PageHeader } from '~/components/ui/PageHeader'
import { Pagination } from '~/components/ui/Pagination'
import { SearchInput } from '~/components/ui/SearchInput'
import { Select } from '~/components/ui/Select'
import { Table } from '~/components/ui/Table'
import { useToast } from '~/components/ui/Toast'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { apiMutate, reloadPage, visitAdmin } from '~/lib/mutate'
import { formatStatusLabel, statusToBadge } from '~/lib/status'
import { formatDate, type PaginationMeta } from '~/lib/utils'

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
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px] max-w-sm">
          <SearchInput
            defaultValue={filters.search ?? ''}
            onSearch={(s) => visitAdmin('/admin/users', { search: s, page: 1 })}
          />
        </div>
        <Select
          className="w-40"
          value={filters.is_active === null ? '' : String(filters.is_active)}
          onChange={(v) => visitAdmin('/admin/users', { is_active: v === '' ? null : v, page: 1 })}
          placeholder="All status"
          options={[
            { value: '', label: 'All status' },
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
        />
      </div>
      <Table
        columns={[
          {
            key: 'avatar',
            label: '',
            render: (r) =>
              r.avatar_url ? (
                <img src={r.avatar_url} className="h-8 w-8 rounded-full object-cover" alt="" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-hover text-xs font-semibold text-text-secondary">
                  {r.name[0]?.toUpperCase()}
                </div>
              ),
          },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          {
            key: 'phone',
            label: 'Phone',
            render: (r) => (
              <span className="font-mono text-sm">
                {r.phone_code} {r.phone_number}
              </span>
            ),
          },
          { key: 'requests', label: 'Requests', render: (r) => <span className="font-mono">{r.total_requests}</span> },
          { key: 'orders', label: 'Orders', render: (r) => <span className="font-mono">{r.total_orders}</span> },
          {
            key: 'status',
            label: 'Status',
            render: (r) => (
              <Badge variant={statusToBadge(r.is_active ? 'active' : 'inactive')}>
                {formatStatusLabel(r.is_active ? 'active' : 'inactive')}
              </Badge>
            ),
          },
          { key: 'joined', label: 'Joined', render: (r) => formatDate(r.created_at) },
          {
            key: 'actions',
            label: '',
            render: (r) => (
              <div className="flex items-center gap-1">
                <Link href={`/admin/users/${r.id}`}>
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-bg-card p-1 shadow-md animate-in fade-in-80"
                      align="end"
                    >
                      <DropdownMenu.Item
                        onClick={async () => {
                          await apiMutate('PUT', `/users/${r.id}/toggle-status`, {})
                          reloadPage()
                        }}
                        className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-text-primary outline-none hover:bg-bg-hover transition-colors"
                      >
                        Toggle Status
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onClick={() => setDeleteId(r.id)}
                        className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-danger outline-none hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            ),
          },
        ]}
        data={users}
      />
      <Pagination meta={meta} />
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title="Delete user?"
        description="This action cannot be undone."
        onConfirm={async () => {
          if (deleteId) {
            await apiMutate('DELETE', `/users/${deleteId}`, {})
            toast.success('Deleted')
            setDeleteId(null)
            reloadPage()
          }
        }}
        variant="danger"
      />
    </>
  )
}
