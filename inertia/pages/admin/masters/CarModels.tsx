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
import { statusToBadge, formatStatusLabel } from '~/lib/status'
import type { PaginationMeta } from '~/lib/utils'
import { Badge } from '~/components/ui/Badge'

type Model = {
  id: number
  name: string
  carBrandId: number
  isActive: boolean
  carBrand?: { name: string }
}

type Brand = {
  id: number
  name: string
}

type Props = {
  carModels: Model[]
  carBrands: Brand[]
  meta: PaginationMeta
  filters: { car_brand_id: number | null }
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

export default function CarModels({ carModels, carBrands, meta, filters }: Props) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Model | null>(null)
  const [form, setForm] = useState({ name: '', car_brand_id: '', is_active: true })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)

  const brandOptions = [
    { value: '', label: 'All brands' },
    ...carBrands.map((b) => ({ value: String(b.id), label: b.name })),
  ]
  const brandSelectOptions = [
    { value: '', label: 'Select brand' },
    ...carBrands.map((b) => ({ value: String(b.id), label: b.name })),
  ]

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', car_brand_id: '', is_active: true })
    setErrors({})
    setOpen(true)
  }

  const openEdit = (model: Model) => {
    setEditing(model)
    setForm({
      name: model.name,
      car_brand_id: String(model.carBrandId),
      is_active: model.isActive,
    })
    setErrors({})
    setOpen(true)
  }

  const submit = async () => {
    setLoading(true)
    setErrors({})

    try {
      const body = {
        name: form.name,
        car_brand_id: Number(form.car_brand_id),
        is_active: form.is_active,
      }

      if (editing) {
        await apiMutate('PUT', `/masters/car-models/${editing.id}`, body)
        toast.success('Model updated')
      } else {
        await apiMutate('POST', '/masters/car-models', body)
        toast.success('Model created')
      }
      setOpen(false)
      reloadPage()
    } catch (err) {
      const apiErr = err as { message?: string; errors?: Record<string, string[]> }
      if (apiErr.errors) {
        setErrors(apiErr.errors)
        toast.error('Validation failed', 'Please check the marked fields')
      } else {
        toast.error('Failed to save', apiErr.message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (id: number) => {
    try {
      await apiMutate('PUT', `/masters/car-models/${id}/toggle-status`, {})
      toast.success('Status updated')
      reloadPage()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const destroy = async () => {
    if (!deleteId) return
    try {
      await apiMutate('DELETE', `/masters/car-models/${deleteId}`, {})
      toast.success('Model deleted')
      setDeleteId(null)
      reloadPage()
    } catch {
      toast.error('Cannot delete model')
    }
  }

  return (
    <>
      <Head title="Car Models" />
      <PageHeader
        title="Car Models"
        description="Manage car models"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Model
          </Button>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select
          className="w-48"
          value={filters.car_brand_id ? String(filters.car_brand_id) : ''}
          onChange={(v) => visitAdmin('/admin/car-models', { car_brand_id: v || null, page: 1 })}
          placeholder="All brands"
          options={brandOptions}
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
            key: 'brand',
            label: 'Brand',
            render: (r) => carBrands.find((b) => b.id === r.carBrandId)?.name ?? '—',
          },
          { key: 'name', label: 'Model' },
          {
            key: 'isActive',
            label: 'Status',
            render: (r) => (
              <Switch checked={r.isActive} onChange={() => toggleStatus(r.id)} />
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
        data={carModels}
      />
      <Pagination meta={meta} />

      <Modal open={open} onOpenChange={setOpen} title={editing ? 'Edit Model' : 'Add Model'} className="max-w-[480px]">
        <div className="space-y-4 pt-2">
          <Select
            label="Brand"
            error={errors.car_brand_id?.join(', ')}
            value={form.car_brand_id}
            onChange={(v) => setForm({ ...form, car_brand_id: v })}
            placeholder="Select brand"
            options={brandSelectOptions}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">
              Name <span className="text-red-500 font-bold">*</span>
            </label>
            <Input
              error={errors.name?.join(', ')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter model name"
            />
          </div>

          {/* Active Status Switch */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary/40 p-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-text-primary">Status</span>
              <span className="text-[11px] text-text-muted">Active car model in system</span>
            </div>
            <Switch
              checked={form.is_active}
              onChange={(checked) => setForm({ ...form, is_active: checked })}
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={loading} className="px-6">Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title="Delete model?"
        description="This action cannot be undone."
        onConfirm={destroy}
        variant="danger"
      />
    </>
  )
}
