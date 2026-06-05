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
import { Table } from '~/components/ui/Table'
import { useToast } from '~/components/ui/Toast'
import { apiMutate, reloadPage } from '~/lib/mutate'
import { formatStatusLabel, statusToBadge } from '~/lib/status'
import type { PaginationMeta } from '~/lib/utils'

type Gov = { id: number; nameEn: string; nameAr: string; isActive: boolean; areas_count: number }
type Props = { governorates: Gov[]; meta: PaginationMeta }

export default function Governorates({ governorates, meta }: Props) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Gov | null>(null)
  const [form, setForm] = useState({ name_en: '', name_ar: '', is_active: true })
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      if (editing) await apiMutate('PUT', `/masters/governorates/${editing.id}`, form)
      else await apiMutate('POST', '/masters/governorates', form)
      toast.success('Saved')
      setOpen(false)
      reloadPage()
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }

  return (
    <>
      <Head title="Governorates" />
      <PageHeader title="Governorates" action={<Button onClick={() => { setEditing(null); setForm({ name_en: '', name_ar: '', is_active: true }); setOpen(true) }}><Plus className="h-4 w-4" /> Add</Button>} />
      <Table columns={[
        { key: 'nameEn', label: 'Name (EN)' },
        { key: 'nameAr', label: 'Name (AR)' },
        { key: 'areas_count', label: 'Areas', render: (r) => <span className="font-mono">{r.areas_count}</span> },
        { key: 'isActive', label: 'Status', render: (r) => <Badge variant={statusToBadge(r.isActive ? 'active' : 'inactive')}>{formatStatusLabel(r.isActive ? 'active' : 'inactive')}</Badge> },
        { key: 'a', label: '', render: (r) => (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setForm({ name_en: r.nameEn, name_ar: r.nameAr, is_active: r.isActive }); setOpen(true) }}><Pencil className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={async () => { await apiMutate('PUT', `/masters/governorates/${r.id}/toggle-status`, {}); reloadPage() }}>Toggle</Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
          </div>
        )},
      ]} data={governorates} />
      <Pagination meta={meta} />
      <Modal open={open} onOpenChange={setOpen} title={editing ? 'Edit' : 'Add Governorate'}>
        <div className="space-y-4">
          <Input label="Name (EN)" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          <Input label="Name (AR)" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
          <Button onClick={submit} loading={loading}>Save</Button>
        </div>
      </Modal>
      <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete?" onConfirm={async () => { if (deleteId) { await apiMutate('DELETE', `/masters/governorates/${deleteId}`, {}); setDeleteId(null); reloadPage() } }} variant="danger" />
    </>
  )
}
