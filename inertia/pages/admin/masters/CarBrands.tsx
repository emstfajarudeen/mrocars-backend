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

type Brand = { id: number; name: string; isActive: boolean; logo_url: string | null; models_count: number }
type Props = { carBrands: Brand[]; meta: PaginationMeta; filters: { search: string | null } }

export default function CarBrands({ carBrands, meta, filters }: Props) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [logo, setLogo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('is_active', String(isActive))
      if (logo) fd.append('logo', logo)
      if (editing) {
        await apiMutate('PUT', `/masters/car-brands/${editing.id}`, fd)
      } else {
        await apiMutate('POST', '/masters/car-brands', fd)
      }
      toast.success('Saved')
      setOpen(false)
      reloadPage()
    } catch {
      toast.error('Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head title="Car Brands" />
      <PageHeader title="Car Brands" action={<Button onClick={() => { setEditing(null); setName(''); setOpen(true) }}><Plus className="h-4 w-4" /> Add Brand</Button>} />
      <div className="mb-6 max-w-sm"><SearchInput defaultValue={filters.search ?? ''} onSearch={(s) => visitAdmin('/admin/car-brands', { search: s, page: 1 })} /></div>
      <Table columns={[
        { key: 'logo', label: 'Logo', render: (r) => r.logo_url ? <img src={r.logo_url} className="h-8 w-8 object-contain" alt="" /> : '—' },
        { key: 'name', label: 'Name' },
        { key: 'models_count', label: 'Models', render: (r) => <span className="font-mono">{r.models_count}</span> },
        { key: 'isActive', label: 'Status', render: (r) => <Badge variant={statusToBadge(r.isActive ? 'active' : 'inactive')}>{formatStatusLabel(r.isActive ? 'active' : 'inactive')}</Badge> },
        { key: 'a', label: '', render: (r) => (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setName(r.name); setIsActive(r.isActive); setOpen(true) }}><Pencil className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={async () => { await apiMutate('PUT', `/masters/car-brands/${r.id}/toggle-status`, {}); reloadPage() }}>Toggle</Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
          </div>
        )},
      ]} data={carBrands} />
      <Pagination meta={meta} />
      <Modal open={open} onOpenChange={setOpen} title={editing ? 'Edit Brand' : 'Add Brand'}>
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Logo" type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
          <Button onClick={submit} loading={loading}>Save</Button>
        </div>
      </Modal>
      <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete brand?" onConfirm={async () => { if (deleteId) { await apiMutate('DELETE', `/masters/car-brands/${deleteId}`, {}); setDeleteId(null); reloadPage() } }} variant="danger" />
    </>
  )
}
