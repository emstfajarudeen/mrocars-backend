import { Head } from '@inertiajs/react'
import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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

type Category = {
  id: number
  nameEn: string
  nameAr: string
  sortOrder: number
  isActive: boolean
  image_url: string | null
}

type Props = {
  categories: Category[]
  meta: PaginationMeta
  filters: { search: string | null }
}

export default function Categories({ categories, meta, filters }: Props) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name_en: '', name_ar: '', sort_order: '0', is_active: true })
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm({ name_en: '', name_ar: '', sort_order: '0', is_active: true })
    setImage(null)
    setOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({
      name_en: cat.nameEn,
      name_ar: cat.nameAr,
      sort_order: String(cat.sortOrder),
      is_active: cat.isActive,
    })
    setImage(null)
    setOpen(true)
  }

  const submit = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('name_en', form.name_en)
      fd.append('name_ar', form.name_ar)
      fd.append('sort_order', form.sort_order)
      fd.append('is_active', String(form.is_active))
      if (image) fd.append('image', image)

      if (editing) {
        await apiMutate('PUT', `/masters/categories/${editing.id}`, fd)
        toast.success('Category updated')
      } else {
        await apiMutate('POST', '/masters/categories', fd)
        toast.success('Category created')
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
      await apiMutate('PUT', `/masters/categories/${id}/toggle-status`, {})
      toast.success('Status updated')
      reloadPage()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const destroy = async () => {
    if (!deleteId) return
    try {
      await apiMutate('DELETE', `/masters/categories/${deleteId}`, {})
      toast.success('Category deleted')
      setDeleteId(null)
      reloadPage()
    } catch {
      toast.error('Cannot delete category')
    }
  }

  return (
    <>
      <Head title="Categories" />
      <PageHeader
        title="Categories"
        description="Manage service categories"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Category</Button>}
      />
      <div className="mb-6 max-w-sm">
        <SearchInput defaultValue={filters.search ?? ''} onSearch={(s) => visitAdmin('/admin/categories', { search: s, page: 1 })} />
      </div>
      <Table
        columns={[
          { key: 'image', label: 'Image', render: (r) => r.image_url ? <img src={r.image_url} alt="" className="h-10 w-10 rounded object-cover" /> : '—' },
          { key: 'nameEn', label: 'Name (EN)' },
          { key: 'nameAr', label: 'Name (AR)' },
          { key: 'sortOrder', label: 'Order', render: (r) => <span className="font-mono">{r.sortOrder}</span> },
          { key: 'isActive', label: 'Status', render: (r) => <Badge variant={statusToBadge(r.isActive ? 'active' : 'inactive')}>{formatStatusLabel(r.isActive ? 'active' : 'inactive')}</Badge> },
          {
            key: 'actions',
            label: '',
            render: (r) => (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => toggleStatus(r.id)}>Toggle</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
              </div>
            ),
          },
        ]}
        data={categories}
      />
      <Pagination meta={meta} />

      <Modal open={open} onOpenChange={setOpen} title={editing ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <Input label="Name (EN)" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          <Input label="Name (AR)" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
          <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          <Input label="Image" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={loading}>Save</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete category?" description="This action cannot be undone." onConfirm={destroy} variant="danger" />
    </>
  )
}
