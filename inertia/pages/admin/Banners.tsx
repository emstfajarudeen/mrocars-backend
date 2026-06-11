import { Head } from '@inertiajs/react'
import { Edit, Plus, Trash2, Upload as UploadIcon, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { Modal } from '~/components/ui/Modal'
import { PageHeader } from '~/components/ui/PageHeader'
import { Pagination } from '~/components/ui/Pagination'
import { SearchInput } from '~/components/ui/SearchInput'
import { Table } from '~/components/ui/Table'
import { useToast } from '~/components/ui/Toast'
import { Input } from '~/components/ui/Input'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '~/lib/utils'
import { apiMutate, reloadPage, visitAdmin } from '~/lib/mutate'
import { formatStatusLabel, statusToBadge } from '~/lib/status'
import type { PaginationMeta } from '~/lib/utils'

type Banner = {
  id: number
  titleEn: string
  titleAr: string
  descriptionEn: string | null
  descriptionAr: string | null
  sortOrder: number
  isActive: boolean
  image_url: string | null
}

type Props = {
  banners: Banner[]
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

function TextArea({
  error,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <div className="w-full space-y-1.5">
      <textarea
        className={cn(
          'w-full rounded-lg border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors',
          'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-bg-primary',
          'disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] resize-none',
          error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border',
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-danger font-medium" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default function Banners({ banners, meta, filters }: Props) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState({
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    sort_order: '0',
    is_active: true,
  })
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<'en' | 'ar'>('en')

  const openCreate = () => {
    setEditing(null)
    setForm({
      title_en: '',
      title_ar: '',
      description_en: '',
      description_ar: '',
      sort_order: '0',
      is_active: true,
    })
    setImage(null)
    setPreviewUrl(null)
    setErrors({})
    setOpen(true)
  }

  const openEdit = (banner: Banner) => {
    setEditing(banner)
    setForm({
      title_en: banner.titleEn,
      title_ar: banner.titleAr,
      description_en: banner.descriptionEn ?? '',
      description_ar: banner.descriptionAr ?? '',
      sort_order: String(banner.sortOrder),
      is_active: banner.isActive,
    })
    setImage(null)
    setPreviewUrl(banner.image_url)
    setErrors({})
    setOpen(true)
  }

  const validateForm = () => {
    const newErrors: Record<string, string[]> = {}

    if (!form.title_en.trim()) {
      newErrors.title_en = ['Title (EN) is required']
    }

    if (form.sort_order && isNaN(Number(form.sort_order))) {
      newErrors.sort_order = ['Sort order must be a number']
    }

    if (!editing && !image) {
      newErrors.image = ['Image is required']
    }

    return newErrors
  }

  const submit = async () => {
    setLoading(true)
    setErrors({})

    const frontendErrors = validateForm()
    if (Object.keys(frontendErrors).length > 0) {
      setErrors(frontendErrors)
      setLoading(false)
      toast.error('Validation failed', 'Please check the marked fields')

      // Auto-switch to the tab with errors
      if (frontendErrors.title_en) {
        setLang('en')
      }
      return
    }

    try {
      const fd = new FormData()
      fd.append('title_en', form.title_en)
      fd.append('title_ar', form.title_ar.trim() ? form.title_ar : form.title_en)
      fd.append('description_en', form.description_en)
      fd.append('description_ar', form.description_ar.trim() ? form.description_ar : form.description_en)
      fd.append('sort_order', form.sort_order)
      fd.append('is_active', String(form.is_active))
      if (image) fd.append('image', image)

      if (editing) {
        await apiMutate('PUT', `/banners/${editing.id}`, fd)
        toast.success('Banner updated')
      } else {
        await apiMutate('POST', '/banners', fd)
        toast.success('Banner created')
      }
      setOpen(false)
      reloadPage()
    } catch (err) {
      const apiErr = err as { message?: string; errors?: Record<string, string[]> }
      if (apiErr.errors) {
        setErrors(apiErr.errors)
        toast.error('Validation failed', 'Please check the marked fields')

        // Auto-switch to the tab with errors
        if (apiErr.errors.title_en || apiErr.errors.description_en) {
          setLang('en')
        } else if (apiErr.errors.title_ar || apiErr.errors.description_ar) {
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
      await apiMutate('PUT', `/banners/${id}/toggle-status`, {})
      toast.success('Status updated')
      reloadPage()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const destroy = async () => {
    if (!deleteId) return
    try {
      await apiMutate('DELETE', `/banners/${deleteId}`, {})
      toast.success('Banner deleted')
      setDeleteId(null)
      reloadPage()
    } catch {
      toast.error('Cannot delete banner')
    }
  }

  return (
    <>
      <Head title="Banners" />
      <PageHeader
        title="Banners"
        description="Manage user app home banners"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Banner
          </Button>
        }
      />
      <div className="mb-6 max-w-sm">
        <SearchInput
          defaultValue={filters.search ?? ''}
          onSearch={(s) => visitAdmin('/admin/banners', { search: s, page: 1 })}
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
            key: 'image',
            label: 'Image',
            render: (r) =>
              r.image_url ? (
                <img src={r.image_url} alt="" className="h-12 w-20 rounded object-cover" />
              ) : (
                '—'
              ),
          },
          { key: 'titleEn', label: 'Title (EN)' },
          { key: 'titleAr', label: 'Title (AR)' },
          {
            key: 'descriptionEn',
            label: 'Description (EN)',
            render: (r) => (
              <span className="line-clamp-2 text-text-secondary">{r.descriptionEn ?? '—'}</span>
            ),
          },
          {
            key: 'sortOrder',
            label: 'Order',
            render: (r) => <span className="font-mono">{r.sortOrder}</span>,
          },
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
        data={banners}
      />
      <Pagination meta={meta} />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Edit Banner' : 'Add Banner'}
        className="max-w-[760px]"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          {/* Left Column: Form Details (7/12 cols) */}
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
                  {(errors.title_en || errors.description_en) && (
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
                  {(errors.title_ar || errors.description_ar) && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-danger animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {lang === 'en' ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">
                    Title (EN) <span className="text-red-500 font-bold">*</span>
                  </label>
                  <Input
                    error={errors.title_en?.join(', ')}
                    value={form.title_en}
                    onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                    placeholder="Enter English Title"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Description (EN)</label>
                  <TextArea
                    error={errors.description_en?.join(', ')}
                    value={form.description_en}
                    onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                    placeholder="Enter English Description"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">
                    Title (AR)
                  </label>
                  <Input
                    error={errors.title_ar?.join(', ')}
                    value={form.title_ar}
                    onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                    placeholder="Enter Arabic Title"
                    dir="rtl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Description (AR)</label>
                  <TextArea
                    error={errors.description_ar?.join(', ')}
                    value={form.description_ar}
                    onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                    placeholder="Enter Arabic Description"
                    rows={3}
                    dir="rtl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Settings & Upload (5/12 cols) */}
          <div className="md:col-span-5 space-y-5">
            {/* Dropzone Card */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Image {!editing && <span className="text-red-500 font-bold">*</span>}
              </label>

              <input
                type="file"
                id="banner-image-upload"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setImage(file)
                    const url = URL.createObjectURL(file)
                    setPreviewUrl(url)
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.image
                      return next
                    })
                  }
                }}
              />

              {previewUrl ? (
                <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-border bg-bg-secondary group">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Overlay glassmorphic bar on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-bg-card/85 border-border hover:bg-bg-card text-text-primary"
                      onClick={() => document.getElementById('banner-image-upload')?.click()}
                    >
                      Replace
                    </Button>
                    {image && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setImage(null)
                          setPreviewUrl(editing?.image_url || null)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => document.getElementById('banner-image-upload')?.click()}
                  className={cn(
                    'flex flex-col items-center justify-center aspect-[16/9] w-full rounded-lg border-2 border-dashed border-border bg-bg-secondary hover:bg-bg-hover hover:border-accent cursor-pointer transition-all duration-200 group p-4',
                    errors.image && 'border-danger hover:border-danger bg-danger/5'
                  )}
                >
                  <div className="rounded-full bg-bg-card p-3 border border-border group-hover:scale-110 transition-transform duration-200 shadow-sm">
                    <UploadIcon className={cn('h-6 w-6 text-text-muted group-hover:text-accent', errors.image && 'text-danger')} />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-text-primary">Click to upload banner image</p>
                  <p className="mt-1 text-[10px] text-text-muted">Supports PNG, JPG or WEBP</p>
                </div>
              )}

              {errors.image && (
                <span className="text-xs text-danger mt-1 block font-medium">{errors.image.join(', ')}</span>
              )}
            </div>

            {/* Sort Order Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Sort Order</label>
              <Input
                error={errors.sort_order?.join(', ')}
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                placeholder="0"
                min="0"
                className="max-w-[120px]"
              />
            </div>

            {/* Active Status Switch */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary/40 p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-text-primary">Status</span>
                <span className="text-[11px] text-text-muted">Show this banner on app home</span>
              </div>
              <Switch
                checked={form.is_active}
                onChange={(checked) => setForm({ ...form, is_active: checked })}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer actions */}
        <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading} className="px-6">
            Save Changes
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title="Delete banner?"
        description="This action cannot be undone."
        onConfirm={destroy}
        variant="danger"
      />
    </>
  )
}

