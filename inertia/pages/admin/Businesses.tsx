import { Head, Link } from '@inertiajs/react'
import { Eye, Plus, Trash2, MoreHorizontal } from 'lucide-react'
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
import { formatCurrency, formatDate, type PaginationMeta } from '~/lib/utils'

type Business = {
  user: { id: number; name: string; email: string }
  business_profile: { business_name: string; avatar_url: string | null; is_approved: boolean } | null
  is_active: boolean
  created_at: string
  total_orders: number
  total_revenue: number
}

type Props = {
  businesses: Business[]
  meta: PaginationMeta
  filters: { search: string | null; is_active: boolean | null; is_approved: boolean | null }
}

export default function Businesses({ businesses, meta, filters }: Props) {
  const toast = useToast()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  return (
    <>
      <Head title="Businesses" />
      <PageHeader
        title="Businesses"
        action={
          <Link href="/admin/businesses/create">
            <Button>
              <Plus className="h-4 w-4" /> Add Business
            </Button>
          </Link>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px] max-w-sm">
          <SearchInput
            defaultValue={filters.search ?? ''}
            onSearch={(s) => visitAdmin('/admin/businesses', { search: s, page: 1 })}
          />
        </div>
        <Select
          className="w-36"
          value={filters.is_active === null ? '' : String(filters.is_active)}
          onChange={(v) => visitAdmin('/admin/businesses', { is_active: v || null, page: 1 })}
          placeholder="All status"
          options={[
            { value: '', label: 'All status' },
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
        />
        <Select
          className="w-36"
          value={filters.is_approved === null ? '' : String(filters.is_approved)}
          onChange={(v) => visitAdmin('/admin/businesses', { is_approved: v || null, page: 1 })}
          placeholder="All approval"
          options={[
            { value: '', label: 'All approval' },
            { value: 'true', label: 'Approved' },
            { value: 'false', label: 'Pending' },
          ]}
        />
      </div>
      <Table
        columns={[
          {
            key: 'avatar',
            label: '',
            render: (r) =>
              r.business_profile?.avatar_url ? (
                <img src={r.business_profile.avatar_url} className="h-8 w-8 rounded-full object-cover" alt="" />
              ) : null,
          },
          { key: 'name', label: 'Business', render: (r) => r.business_profile?.business_name ?? r.user.name },
          { key: 'email', label: 'Email', render: (r) => r.user.email },
          { key: 'orders', label: 'Orders', render: (r) => <span className="font-mono">{r.total_orders}</span> },
          {
            key: 'revenue',
            label: 'Revenue',
            render: (r) => <span className="font-mono text-accent">{formatCurrency(r.total_revenue)}</span>,
          },
          {
            key: 'approved',
            label: 'Approved',
            render: (r) => (
              <Badge variant={statusToBadge(r.business_profile?.is_approved ? 'approved' : 'pending')}>
                {r.business_profile?.is_approved ? 'Approved' : 'Pending'}
              </Badge>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (r) => (
              <Badge variant={statusToBadge(r.is_active ? 'active' : 'inactive')}>
                {formatStatusLabel(r.is_active ? 'active' : 'inactive')}
              </Badge>
            ),
          },
          { key: 'joined', label: 'Joined', render: (r) => formatDate(String(r.created_at)) },
          {
            key: 'a',
            label: '',
            render: (r) => (
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
                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/admin/businesses/${r.user.id}`}
                        className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-text-primary outline-none hover:bg-bg-hover transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onClick={() => setDeleteId(r.user.id)}
                      className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-danger outline-none hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ),
          },
        ]}
        data={businesses}
      />
      <Pagination meta={meta} />
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title="Delete business?"
        description="This action cannot be undone."
        onConfirm={async () => {
          if (deleteId) {
            await apiMutate('DELETE', `/businesses/${deleteId}`, {})
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
