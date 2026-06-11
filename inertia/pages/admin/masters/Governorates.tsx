import { Head } from '@inertiajs/react'
import { useState } from 'react'
import { Edit, Plus, Trash2, MoreHorizontal } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { Input } from '~/components/ui/Input'
import { Modal } from '~/components/ui/Modal'
import { PageHeader } from '~/components/ui/PageHeader'
import { Pagination } from '~/components/ui/Pagination'
import { Table } from '~/components/ui/Table'
import { useToast } from '~/components/ui/Toast'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '~/lib/utils'
import { apiMutate, reloadPage } from '~/lib/mutate'
import { formatStatusLabel, statusToBadge } from '~/lib/status'
import type { PaginationMeta } from '~/lib/utils'

type Gov = {
  id: number
  nameEn: string
  nameAr: string
  isActive: boolean
  areas_count: number
}

type Props = {
  governorates: Gov[]
  meta: PaginationMeta
}

function Switch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-accent' : 'bg-zinc-700'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}

export default function Governorates({ governorates, meta }: Props) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Gov | null>(null)
  const [form, setForm] = useState({ name_en: '', name_ar: '', is_active: true })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<'en' | 'ar'>('en')

  const openCreate = () => {
    setEditing(null)
    setForm({ name_en: '', name_ar: '', is_active: true })
    setErrors({})
    setOpen(true)
  }

  const openEdit = (gov: Gov) => {
    setEditing(gov)
    setForm({
      name_en: gov.nameEn,
      name_ar: gov.nameAr,
      is_active: gov.isActive,
    })
    setErrors({})
    setOpen(true)
  }

  const submit = async () => {
    setLoading(true)
    setErrors({})

    try {
      const body = {
        name_en: form.name_en,
        name_ar: form.name_ar.trim() ? form.name_ar : form.name_en,
        is_active: form.is_active,
      }

      if (editing) {
        await apiMutate('PUT', `/masters/governorates/${editing.id}`, body)
        toast.success('Governorate updated')
      } else {
        await apiMutate('POST', '/masters/governorates', body)
        toast.success('Governorate created')
      }
      setOpen(false)
      reloadPage()
    } catch (err) {
      const apiErr = err as { message?: string; errors?: Record<string, string[]> }
      if (apiErr.errors) {
        setErrors(apiErr.errors)
        toast.error('Validation failed', 'Please check the marked fields')
        
        if (apiErr.errors.name_en) {
          setLang('en')
        } else if (apiErr.errors.name_ar) {
          setLang('ar')
        }
      } else {
        toast.error('Failed to save', apiErr.message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (id: number) => {
    try {
      await apiMutate('PUT', `/masters/governorates/${id}/toggle-status`, {})
      toast.success('Status updated')
      reloadPage()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const destroy = async () => {
    if (!deleteId) return
    try {
      await apiMutate('DELETE', `/masters/governorates/${deleteId}`, {})
      toast.success('Governorate deleted')
      setDeleteId(null)
      reloadPage()
    } catch {
      toast.error('Cannot delete governorate')
    }
  }

  return (
    <>
      <Head title="Governorates" />
      <PageHeader
        title="Governorates"
        description="Manage governorates"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Governorate</Button>}
      />
      <Table
        columns={[
          {
            key: 'edit',
            label: '',
            render: (r) => (
              <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                <Edit className="h-4 w-4" />
              </Button>
            ),
          },
          { key: 'nameEn', label: 'Name (EN)' },
          { key: 'nameAr', label: 'Name (AR)' },
          { key: 'areas_count', label: 'Areas', render: (r) => <span className="font-mono">{r.areas_count}</span> },
          {
            key: 'isActive',
            label: 'Status',
            render: (r) => (
              <Switch
                checked={r.isActive}
                onChange={() => toggleStatus(r.id)}
              />
            ),
          },
          {
            key: 'actions',
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
            ),
          },
        ]}
        data={governorates}
      />
      <Pagination meta={meta} />

      <Modal open={open} onOpenChange={setOpen} title={editing ? 'Edit Governorate' : 'Add Governorate'} className="max-w-[640px]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          {/* Left Column: Details (7/12 cols) */}
          <div className="md:col-span-7 space-y-4 md:border-r md:border-border md:pr-6">
            <div className="flex w-full items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-bg-secondary p-1 border border-border">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={cn(
                    'relative rounded-md px-4 py-1.5 text-xs font-semibold transition-all duration-200',
                    lang === 'en'
                      ? 'bg-bg-card text-accent shadow-sm border border-border'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  English
                  {errors.name_en && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-danger animate-pulse" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setLang('ar')}
                  className={cn(
                    'relative rounded-md px-4 py-1.5 text-xs font-semibold transition-all duration-200',
                    lang === 'ar'
                      ? 'bg-bg-card text-accent shadow-sm border border-border'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  العربية (Arabic)
                  {errors.name_ar && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-danger animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {lang === 'en' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Name (EN) <span className="text-red-500 font-bold">*</span>
                </label>
                <Input
                  error={errors.name_en?.join(', ')}
                  value={form.name_en}
                  onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                  placeholder="Enter English Name"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Name (AR)
                </label>
                <Input
                  error={errors.name_ar?.join(', ')}
                  value={form.name_ar}
                  onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                  placeholder="Enter Arabic Name"
                  dir="rtl"
                />
              </div>
            )}
          </div>

          {/* Right Column: Settings (5/12 cols) */}
          <div className="md:col-span-5 space-y-5">
            {/* Active Status Switch */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary/40 p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-text-primary">Status</span>
                <span className="text-[11px] text-text-muted">Active in system</span>
              </div>
              <Switch
                checked={form.is_active}
                onChange={(checked) => setForm({ ...form, is_active: checked })}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} loading={loading} className="px-6">Save Changes</Button>
        </div>
      </Modal>

      <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete?" onConfirm={async () => { if (deleteId) { await apiMutate('DELETE', `/masters/governorates/${deleteId}`, {}); setDeleteId(null); reloadPage() } }} variant="danger" />
    </>
  )
}
