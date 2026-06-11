import { Head } from '@inertiajs/react'
import { useState } from 'react'
import { Edit, Plus, Trash2, MoreHorizontal, Upload as UploadIcon } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { Input } from '~/components/ui/Input'
import { Modal } from '~/components/ui/Modal'
import { PageHeader } from '~/components/ui/PageHeader'
import { Pagination } from '~/components/ui/Pagination'
import { SearchInput } from '~/components/ui/SearchInput'
import { Table } from '~/components/ui/Table'
import { useToast } from '~/components/ui/Toast'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '~/lib/utils'
import { apiMutate, reloadPage, visitAdmin } from '~/lib/mutate'
import { formatStatusLabel, statusToBadge } from '~/lib/status'
import type { PaginationMeta } from '~/lib/utils'

type Brand = {
  id: number
  name: string
  isActive: boolean
  logo_url: string | null
  models_count: number
}

type Props = {
  carBrands: Brand[]
  meta: PaginationMeta
  filters: { search: string | null }
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

export default function CarBrands({ carBrands, meta, filters }: Props) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [logo, setLogo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setIsActive(true)
    setLogo(null)
    setPreviewUrl(null)
    setErrors({})
    setOpen(true)
  }

  const openEdit = (brand: Brand) => {
    setEditing(brand)
    setName(brand.name)
    setIsActive(brand.isActive)
    setLogo(null)
    setPreviewUrl(brand.logo_url)
    setErrors({})
    setOpen(true)
  }

  const submit = async () => {
    setLoading(true)
    setErrors({})

    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('is_active', String(isActive))
      if (logo) fd.append('logo', logo)

      if (editing) {
        await apiMutate('PUT', `/masters/car-brands/${editing.id}`, fd)
        toast.success('Brand updated')
      } else {
        await apiMutate('POST', '/masters/car-brands', fd)
        toast.success('Brand created')
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
      await apiMutate('PUT', `/masters/car-brands/${id}/toggle-status`, {})
      toast.success('Status updated')
      reloadPage()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const destroy = async () => {
    if (!deleteId) return
    try {
      await apiMutate('DELETE', `/masters/car-brands/${deleteId}`, {})
      toast.success('Brand deleted')
      setDeleteId(null)
      reloadPage()
    } catch {
      toast.error('Cannot delete brand')
    }
  }

  return (
    <>
      <Head title="Car Brands" />
      <PageHeader
        title="Car Brands"
        description="Manage car brands"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Brand</Button>}
      />
      <div className="mb-6 max-w-sm">
        <SearchInput defaultValue={filters.search ?? ''} onSearch={(s) => visitAdmin('/admin/car-brands', { search: s, page: 1 })} />
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
          { key: 'logo', label: 'Logo', render: (r) => r.logo_url ? <img src={r.logo_url} className="h-8 w-8 object-contain rounded" alt="" /> : '—' },
          { key: 'name', label: 'Name' },
          { key: 'models_count', label: 'Models', render: (r) => <span className="font-mono">{r.models_count}</span> },
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
        data={carBrands}
      />
      <Pagination meta={meta} />

      <Modal open={open} onOpenChange={setOpen} title={editing ? 'Edit Brand' : 'Add Brand'} className="max-w-[640px]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          {/* Left Column: Details (7/12 cols) */}
          <div className="md:col-span-7 space-y-4 md:border-r md:border-border md:pr-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Name <span className="text-red-500 font-bold">*</span>
              </label>
              <Input
                error={errors.name?.join(', ')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Brand Name"
              />
            </div>
          </div>

          {/* Right Column: Logo & Switch (5/12 cols) */}
          <div className="md:col-span-5 space-y-5">
            {/* Logo Dropzone Card */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Logo</label>
              <input
                type="file"
                id="brand-logo-upload"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setLogo(file)
                    const url = URL.createObjectURL(file)
                    setPreviewUrl(url)
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.logo
                      return next
                    })
                  }
                }}
              />
              {previewUrl ? (
                <div className="relative aspect-square w-full max-w-[140px] rounded-lg overflow-hidden border border-border bg-bg-secondary group mx-auto">
                  <img src={previewUrl} alt="Logo Preview" className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                    <Button variant="outline" size="sm" className="bg-bg-card/85 border-border hover:bg-bg-card text-text-primary px-2" onClick={() => document.getElementById('brand-logo-upload')?.click()}>
                      Replace
                    </Button>
                    {logo && (
                      <Button variant="danger" size="sm" className="px-2" onClick={() => { setLogo(null); setPreviewUrl(editing?.logo_url || null) }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div onClick={() => document.getElementById('brand-logo-upload')?.click()} className="flex flex-col items-center justify-center aspect-square w-full max-w-[140px] rounded-lg border-2 border-dashed border-border bg-bg-secondary hover:bg-bg-hover hover:border-accent cursor-pointer transition-all duration-200 group p-4 mx-auto">
                  <div className="rounded-full bg-bg-card p-2 border border-border group-hover:scale-110 transition-transform duration-200 shadow-sm">
                    <UploadIcon className="h-5 w-5 text-text-muted group-hover:text-accent" />
                  </div>
                  <p className="mt-2 text-[10px] font-semibold text-text-primary text-center">Upload Logo</p>
                </div>
              )}
              {errors.logo && <span className="text-xs text-danger mt-1 block font-medium text-center">{errors.logo.join(', ')}</span>}
            </div>

            {/* Active Status Switch */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary/40 p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-text-primary">Status</span>
                <span className="text-[11px] text-text-muted">Active brand in system</span>
              </div>
              <Switch
                checked={isActive}
                onChange={(checked) => setIsActive(checked)}
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

      <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete brand?" description="This action cannot be undone." onConfirm={destroy} variant="danger" />
    </>
  )
}
