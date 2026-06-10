import { Head } from '@inertiajs/react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
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
  const [loading, setLoading] = useState(false)

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
    setOpen(true)
  }

  const submit = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title_en', form.title_en)
      fd.append('title_ar', form.title_ar)
      fd.append('description_en', form.description_en)
      fd.append('description_ar', form.description_ar)
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
      toast.error('Failed to save', (err as { message?: string }).message)
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
              <Badge variant={statusToBadge(r.isActive ? 'active' : 'inactive')}>
                {formatStatusLabel(r.isActive ? 'active' : 'inactive')}
              </Badge>
            ),
          },
          {
            key: 'actions',
            label: '',
            render: (r) => (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleStatus(r.id)}>
                  Toggle
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}>
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            ),
          },
        ]}
        data={banners}
      />
      <Pagination meta={meta} />

      <Modal open={open} onOpenChange={setOpen} title={editing ? 'Edit Banner' : 'Add Banner'}>
        <div className="space-y-4">
          <Input
            label="Title (EN)"
            value={form.title_en}
            onChange={(e) => setForm({ ...form, title_en: e.target.value })}
          />
          <Input
            label="Title (AR)"
            value={form.title_ar}
            onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
          />
          <Input
            label="Description (EN)"
            value={form.description_en}
            onChange={(e) => setForm({ ...form, description_en: e.target.value })}
          />
          <Input
            label="Description (AR)"
            value={form.description_ar}
            onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
          />
          <Input
            label="Sort Order"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />
          <Input
            label={editing ? 'Image (optional)' : 'Image'}
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={loading}>
              Save
            </Button>
          </div>
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
