import { Head, Link } from '@inertiajs/react'
import { Eye, Trash2, MoreHorizontal, CheckCircle2, Clock } from 'lucide-react'
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
import { Switch } from '~/components/ui/Switch'
import { Modal } from '~/components/ui/Modal'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { apiMutate, reloadPage, visitAdmin } from '~/lib/mutate'
import { statusToBadge } from '~/lib/status'
import { formatDate, type PaginationMeta } from '~/lib/utils'

type Enquiry = {
  id: number
  user_id: number | null
  app_type: 'user' | 'business'
  name: string | null
  email: string | null
  subject: string
  message: string
  status: 'pending' | 'resolved'
  created_at: string
  user: { id: number; name: string; email: string } | null
}

type Props = {
  enquiries: Enquiry[]
  meta: PaginationMeta
  filters: {
    search: string | null
    app_type: string | null
    status: string | null
  }
}

export default function Enquiries({ enquiries, meta, filters }: Props) {
  const toast = useToast()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)

  const handleToggleResolve = async (id: number) => {
    try {
      await apiMutate('PUT', `/enquiries/${id}/resolve`, {})
      toast.success('Status updated successfully')
      
      // Update local state if modal is open
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry({
          ...selectedEnquiry,
          status: selectedEnquiry.status === 'resolved' ? 'pending' : 'resolved',
        })
      }
      
      reloadPage()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await apiMutate('DELETE', `/enquiries/${deleteId}`, {})
      toast.success('Enquiry deleted successfully')
      setDeleteId(null)
      reloadPage()
    } catch (err) {
      toast.error('Failed to delete enquiry')
    }
  }

  return (
    <>
      <Head title="Enquiries" />
      <PageHeader title="Enquiries" description="Manage contact messages and app feedback" />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px] max-w-sm">
          <SearchInput
            defaultValue={filters.search ?? ''}
            onSearch={(s) => visitAdmin('/admin/enquiries', { ...filters, search: s || null, page: 1 })}
          />
        </div>
        <Select
          className="w-36"
          value={filters.app_type ?? ''}
          onChange={(v) => visitAdmin('/admin/enquiries', { ...filters, app_type: v || null, page: 1 })}
          placeholder="All App Types"
          options={[
            { value: '', label: 'All App Types' },
            { value: 'user', label: 'User App' },
            { value: 'business', label: 'Business App' },
          ]}
        />
        <Select
          className="w-36"
          value={filters.status ?? ''}
          onChange={(v) => visitAdmin('/admin/enquiries', { ...filters, status: v || null, page: 1 })}
          placeholder="All Status"
          options={[
            { value: '', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'resolved', label: 'Resolved' },
          ]}
        />
      </div>

      <Table
        columns={[
          {
            key: 'app_type',
            label: 'App Source',
            render: (r) => (
              <Badge variant={r.app_type === 'user' ? 'default' : 'accent'}>
                {r.app_type === 'user' ? 'User App' : 'Business App'}
              </Badge>
            ),
          },
          {
            key: 'name',
            label: 'Sender',
            render: (r) => {
              const displayName = r.name || r.user?.name || 'Guest User'
              const email = r.email || r.user?.email || ''
              
              return (
                <div>
                  <div className="font-medium text-text-primary">
                    {r.user_id ? (
                      <Link
                        href={r.app_type === 'user' ? `/admin/users/${r.user_id}` : `/admin/businesses/${r.user_id}`}
                        className="hover:underline text-accent"
                      >
                        {displayName}
                      </Link>
                    ) : (
                      displayName
                    )}
                  </div>
                  <div className="text-xs text-text-muted">{email}</div>
                </div>
              )
            },
          },
          {
            key: 'subject',
            label: 'Subject',
            className: 'max-w-[200px] truncate',
          },
          {
            key: 'message',
            label: 'Message',
            render: (r) => <div className="max-w-[300px] truncate text-sm text-text-secondary">{r.message}</div>,
          },
          {
            key: 'status',
            label: 'Status',
            render: (r) => (
              <Badge variant={statusToBadge(r.status)}>
                {r.status === 'resolved' ? 'Resolved' : 'Pending'}
              </Badge>
            ),
          },
          {
            key: 'created_at',
            label: 'Received At',
            render: (r) => formatDate(r.created_at),
          },
          {
            key: 'actions',
            label: '',
            render: (r) => (
              <div className="flex items-center gap-3">
                <Switch
                  checked={r.status === 'resolved'}
                  onChange={() => handleToggleResolve(r.id)}
                />
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
                        onClick={() => setSelectedEnquiry(r)}
                        className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-text-primary outline-none hover:bg-bg-hover transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
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
        data={enquiries}
      />

      <Pagination meta={meta} />

      {/* Detail View Modal */}
      <Modal
        open={selectedEnquiry !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedEnquiry(null)
        }}
        title="Enquiry Details"
      >
        {selectedEnquiry && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b border-border pb-4 text-sm">
              <div>
                <span className="block text-xs text-text-muted uppercase font-medium">Source App</span>
                <span className="font-semibold text-text-primary">
                  {selectedEnquiry.app_type === 'user' ? 'User Application' : 'Business Application'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-text-muted uppercase font-medium">Status</span>
                <div className="mt-0.5">
                  <Badge variant={statusToBadge(selectedEnquiry.status)}>
                    {selectedEnquiry.status === 'resolved' ? 'Resolved' : 'Pending'}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="block text-xs text-text-muted uppercase font-medium">Sender Name</span>
                <span className="font-semibold text-text-primary">{selectedEnquiry.name || selectedEnquiry.user?.name || 'Guest User'}</span>
              </div>
              <div>
                <span className="block text-xs text-text-muted uppercase font-medium">Email Address</span>
                <span className="font-semibold text-text-primary">{selectedEnquiry.email || selectedEnquiry.user?.email || '—'}</span>
              </div>
              <div>
                <span className="block text-xs text-text-muted uppercase font-medium">Submitted On</span>
                <span className="text-text-primary">{formatDate(selectedEnquiry.created_at)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs text-text-muted uppercase font-medium">Subject</span>
              <p className="text-sm font-semibold text-text-primary bg-bg-secondary p-2.5 rounded-lg border border-border">
                {selectedEnquiry.subject}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs text-text-muted uppercase font-medium">Message</span>
              <div className="text-sm text-text-primary bg-bg-secondary p-3 rounded-lg border border-border whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedEnquiry.message}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-secondary">Mark resolved</span>
                <Switch
                  checked={selectedEnquiry.status === 'resolved'}
                  onChange={() => handleToggleResolve(selectedEnquiry.id)}
                />
              </div>
              <Button variant="ghost" onClick={() => setSelectedEnquiry(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title="Delete enquiry message?"
        description="Are you sure you want to delete this enquiry message? This action is permanent and cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="danger"
      />
    </>
  )
}
