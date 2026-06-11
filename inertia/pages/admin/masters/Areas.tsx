import { Head } from '@inertiajs/react'
import { useState } from 'react'
import { Edit, Plus, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { Input } from '~/components/ui/Input'
import { Modal } from '~/components/ui/Modal'
import { PageHeader } from '~/components/ui/PageHeader'
import { Pagination } from '~/components/ui/Pagination'
import { Select } from '~/components/ui/Select'
import { Table } from '~/components/ui/Table'
import { useToast } from '~/components/ui/Toast'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '~/lib/utils'
import { apiMutate, reloadPage, visitAdmin } from '~/lib/mutate'
import type { PaginationMeta } from '~/lib/utils'

type Area = {
  id: number
  nameEn: string
  nameAr: string
  governorateId: number
  isActive: boolean
  governorate?: { nameEn: string }
}

type Gov = {
  id: number
  nameEn: string
}

type Props = {
  areas: Area[]
  governorates: Gov[]
  meta: PaginationMeta
  filters: { governorate_id: number | null }
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

export default function Areas({ areas, governorates, meta, filters }: Props) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Area | null>(null)
  const [form, setForm] = useState({ name_en: '', name_ar: '', governorate_id: '', is_active: true })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<'en' | 'ar'>('en')

  const govOptions = [
    { value: '', label: 'All' },
    ...governorates.map((g) => ({ value: String(g.id), label: g.nameEn })),
  ]
  const govSelectOptions = [
    { value: '', label: 'Select Governorate' },
    ...governorates.map((g) => ({ value: String(g.id), label: g.nameEn })),
  ]

  const openCreate = () => {
    setEditing(null)
    setForm({ name_en: '', name_ar: '', governorate_id: '', is_active: true })
    setErrors({})
    setOpen(true)
  }

  const openEdit = (area: Area) => {
    setEditing(area)
    setForm({
      name_en: area.nameEn,
      name_ar: area.nameAr,
      governorate_id: String(area.governorateId),
      is_active: area.isActive,
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
        governorate_id: Number(form.governorate_id),
        is_active: form.is_active,
      }

      if (editing) {
        await apiMutate('PUT', `/masters/areas/${editing.id}`, body)
        toast.success('Area updated')
      } else {
        await apiMutate('POST', '/masters/areas', body)
        toast.success('Area created')
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
      await apiMutate('PUT', `/masters/areas/${id}/toggle-status`, {})
      toast.success('Status updated')
      reloadPage()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const destroy = async () => {
    if (!deleteId) return
    try {
      await apiMutate('DELETE', `/masters/areas/${deleteId}`, {})
      toast.success('Area deleted')
      setDeleteId(null)
      reloadPage()
    } catch {
      toast.error('Cannot delete area')
    }
  }

  return (
    <>
      <Head title="Areas" />
      <PageHeader
        title="Areas"
        description="Manage areas"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Area
          </Button>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select
          className="w-52"
          value={filters.governorate_id ? String(filters.governorate_id) : ''}
          onChange={(v) => visitAdmin('/admin/areas', { governorate_id: v || null, page: 1 })}
          placeholder="All governorates"
          options={govOptions}
        />
      </div>
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
          {
            key: 'gov',
            label: 'Governorate',
            render: (r) => governorates.find((g) => g.id === r.governorateId)?.nameEn ?? '—',
          },
          { key: 'nameEn', label: 'Name (EN)' },
          { key: 'nameAr', label: 'Name (AR)' },
          {
            key: 'isActive',
            label: 'Status',
            render: (r) => <Switch checked={r.isActive} onChange={() => toggleStatus(r.id)} />,
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
        data={areas}
      />
      <Pagination meta={meta} />

      <Modal open={open} onOpenChange={setOpen} title={editing ? 'Edit Area' : 'Add Area'} className="max-w-[680px]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          {/* Left Column: Details (7/12 cols) */}
          <div className="md:col-span-7 space-y-4 md:border-r md:border-border md:pr-6">
            <Select
              label="Governorate"
              error={errors.governorate_id?.join(', ')}
              value={form.governorate_id}
              onChange={(v) => setForm({ ...form, governorate_id: v })}
              placeholder="Select Governorate"
              options={govSelectOptions}
            />

            <div className="flex w-full items-center justify-between border-b border-border pb-3 pt-2">
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
                <label className="text-sm font-medium text-text-secondary">Name (AR)</label>
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
            <div className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary/40 p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-text-primary">Status</span>
                <span className="text-[11px] text-text-muted">Active in system</span>
              </div>
              <Switch checked={form.is_active} onChange={(checked) => setForm({ ...form, is_active: checked })} />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} loading={loading} className="px-6">Save Changes</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title="Delete area?"
        description="This action cannot be undone."
        onConfirm={destroy}
        variant="danger"
      />
    </>
  )
}
