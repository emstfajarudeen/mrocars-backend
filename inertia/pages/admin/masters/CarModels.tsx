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
import { Select } from '~/components/ui/Select'
import { Table } from '~/components/ui/Table'
import { useToast } from '~/components/ui/Toast'
import { apiMutate, reloadPage, visitAdmin } from '~/lib/mutate'
import { formatStatusLabel, statusToBadge } from '~/lib/status'
import type { PaginationMeta } from '~/lib/utils'

type Model = { id: number; name: string; carBrandId: number; isActive: boolean; carBrand?: { name: string } }
type Brand = { id: number; name: string }
type Props = { carModels: Model[]; carBrands: Brand[]; meta: PaginationMeta; filters: { car_brand_id: number | null } }

export default function CarModels({ carModels, carBrands, meta, filters }: Props) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Model | null>(null)
  const [form, setForm] = useState({ name: '', car_brand_id: '', is_active: true })
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      const body = { name: form.name, car_brand_id: Number(form.car_brand_id), is_active: form.is_active }
      if (editing) await apiMutate('PUT', `/masters/car-models/${editing.id}`, body)
      else await apiMutate('POST', '/masters/car-models', body)
      toast.success('Saved')
      setOpen(false)
      reloadPage()
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }

  return (
    <>
      <Head title="Car Models" />
      <PageHeader title="Car Models" action={<Button onClick={() => { setEditing(null); setForm({ name: '', car_brand_id: '', is_active: true }); setOpen(true) }}><Plus className="h-4 w-4" /> Add Model</Button>} />
      <div className="mb-6 w-48">
        <Select label="Filter by brand" value={filters.car_brand_id ? String(filters.car_brand_id) : ''} onChange={(e) => visitAdmin('/admin/car-models', { car_brand_id: e.target.value || null, page: 1 })}>
          <option value="">All brands</option>
          {carBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      </div>
      <Table columns={[
        { key: 'brand', label: 'Brand', render: (r) => carBrands.find((b) => b.id === r.carBrandId)?.name ?? '—' },
        { key: 'name', label: 'Model' },
        { key: 'isActive', label: 'Status', render: (r) => <Badge variant={statusToBadge(r.isActive ? 'active' : 'inactive')}>{formatStatusLabel(r.isActive ? 'active' : 'inactive')}</Badge> },
        { key: 'a', label: '', render: (r) => (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setForm({ name: r.name, car_brand_id: String(r.carBrandId), is_active: r.isActive }); setOpen(true) }}><Pencil className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
          </div>
        )},
      ]} data={carModels} />
      <Pagination meta={meta} />
      <Modal open={open} onOpenChange={setOpen} title={editing ? 'Edit Model' : 'Add Model'}>
        <div className="space-y-4">
          <Select label="Brand" value={form.car_brand_id} onChange={(e) => setForm({ ...form, car_brand_id: e.target.value })}>
            <option value="">Select brand</option>
            {carBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Button onClick={submit} loading={loading}>Save</Button>
        </div>
      </Modal>
      <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete model?" onConfirm={async () => { if (deleteId) { await apiMutate('DELETE', `/masters/car-models/${deleteId}`, {}); setDeleteId(null); reloadPage() } }} variant="danger" />
    </>
  )
}
