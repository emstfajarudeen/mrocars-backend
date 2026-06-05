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

type Area = { id: number; nameEn: string; nameAr: string; governorateId: number; isActive: boolean; governorate?: { nameEn: string } }
type Gov = { id: number; nameEn: string }
type Props = { areas: Area[]; governorates: Gov[]; meta: PaginationMeta; filters: { governorate_id: number | null } }

export default function Areas({ areas, governorates, meta, filters }: Props) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Area | null>(null)
  const [form, setForm] = useState({ name_en: '', name_ar: '', governorate_id: '', is_active: true })
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      const body = { ...form, governorate_id: Number(form.governorate_id) }
      if (editing) await apiMutate('PUT', `/masters/areas/${editing.id}`, body)
      else await apiMutate('POST', '/masters/areas', body)
      toast.success('Saved')
      setOpen(false)
      reloadPage()
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }

  return (
    <>
      <Head title="Areas" />
      <PageHeader title="Areas" action={<Button onClick={() => { setEditing(null); setForm({ name_en: '', name_ar: '', governorate_id: '', is_active: true }); setOpen(true) }}><Plus className="h-4 w-4" /> Add</Button>} />
      <div className="mb-6 w-48">
        <Select label="Governorate" value={filters.governorate_id ? String(filters.governorate_id) : ''} onChange={(e) => visitAdmin('/admin/areas', { governorate_id: e.target.value || null, page: 1 })}>
          <option value="">All</option>
          {governorates.map((g) => <option key={g.id} value={g.id}>{g.nameEn}</option>)}
        </Select>
      </div>
      <Table columns={[
        { key: 'gov', label: 'Governorate', render: (r) => governorates.find((g) => g.id === r.governorateId)?.nameEn ?? '—' },
        { key: 'nameEn', label: 'Name (EN)' },
        { key: 'nameAr', label: 'Name (AR)' },
        { key: 'isActive', label: 'Status', render: (r) => <Badge variant={statusToBadge(r.isActive ? 'active' : 'inactive')}>{formatStatusLabel(r.isActive ? 'active' : 'inactive')}</Badge> },
        { key: 'a', label: '', render: (r) => (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setForm({ name_en: r.nameEn, name_ar: r.nameAr, governorate_id: String(r.governorateId), is_active: r.isActive }); setOpen(true) }}><Pencil className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
          </div>
        )},
      ]} data={areas} />
      <Pagination meta={meta} />
      <Modal open={open} onOpenChange={setOpen} title={editing ? 'Edit Area' : 'Add Area'}>
        <div className="space-y-4">
          <Select label="Governorate" value={form.governorate_id} onChange={(e) => setForm({ ...form, governorate_id: e.target.value })}>
            <option value="">Select</option>
            {governorates.map((g) => <option key={g.id} value={g.id}>{g.nameEn}</option>)}
          </Select>
          <Input label="Name (EN)" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          <Input label="Name (AR)" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
          <Button onClick={submit} loading={loading}>Save</Button>
        </div>
      </Modal>
      <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete?" onConfirm={async () => { if (deleteId) { await apiMutate('DELETE', `/masters/areas/${deleteId}`, {}); setDeleteId(null); reloadPage() } }} variant="danger" />
    </>
  )
}
