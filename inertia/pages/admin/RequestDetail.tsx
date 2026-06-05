import { Head, Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Card } from '~/components/ui/Card'
import { PageHeader } from '~/components/ui/PageHeader'
import { formatStatusLabel, statusToBadge } from '~/lib/status'
import { formatCurrency, formatDateTime } from '~/lib/utils'

type Props = {
  request: {
    id: number
    requestNo: string
    title: string
    description: string | null
    status: string
    voice_note_url: string | null
    category: { nameEn: string } | null
    user: { name: string } | null
    user_vehicle: { car_brand: { name: string } | null; car_model: { name: string } | null; year: string } | null
    attachments?: Array<{ file_url: string; fileType: string }>
    pickup_location_name?: string | null
    delivery_location_name?: string | null
    responses: Array<{
      id: number
      responseNo: string
      price: string
      status: string
      notes: string | null
      attachment_url: string | null
      business_user: { name: string } | null
      business_profile: { business_name: string; rating_avg: number | null } | null
    }>
  }
}

export default function RequestDetail({ request: req }: Props) {
  return (
    <>
      <Head title={req.requestNo} />
      <Link href="/admin/requests" className="mb-4 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader
        title={req.title}
        action={<Badge variant={statusToBadge(req.status)}>{formatStatusLabel(req.status)}</Badge>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Request Info">
          <div className="space-y-2 text-sm">
            <p className="font-mono text-accent">{req.requestNo}</p>
            <p><span className="text-text-secondary">Category:</span> {req.category?.nameEn}</p>
            <p><span className="text-text-secondary">User:</span> {req.user?.name}</p>
            {req.user_vehicle ? <p><span className="text-text-secondary">Vehicle:</span> {req.user_vehicle.car_brand?.name} {req.user_vehicle.car_model?.name} ({req.user_vehicle.year})</p> : null}
            {req.description ? <p className="mt-2 text-text-secondary">{req.description}</p> : null}
            {req.pickup_location_name ? <p className="text-text-secondary">Pickup: {req.pickup_location_name}</p> : null}
            {req.delivery_location_name ? <p className="text-text-secondary">Delivery: {req.delivery_location_name}</p> : null}
          </div>
        </Card>
        <Card title="Attachments">
          {req.voice_note_url ? <audio controls src={req.voice_note_url} className="mb-4 w-full" /> : null}
          <div className="grid grid-cols-2 gap-2">
            {req.attachments?.map((a, i) => (
              <a key={i} href={a.file_url ?? '#'} target="_blank" rel="noreferrer">
                <img src={a.file_url ?? ''} alt="" className="rounded-lg border border-border object-cover h-24 w-full" />
              </a>
            ))}
          </div>
        </Card>
      </div>
      <Card title={`Responses (${req.responses.length})`} className="mt-6">
        <div className="space-y-4">
          {req.responses.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{r.business_profile?.business_name ?? r.business_user?.name}</p>
                  <p className="font-mono text-sm text-text-secondary">{r.responseNo}</p>
                  {r.notes ? <p className="mt-2 text-sm text-text-secondary">{r.notes}</p> : null}
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg text-accent">{formatCurrency(r.price)}</p>
                  <Badge variant={statusToBadge(r.status)}>{formatStatusLabel(r.status)}</Badge>
                </div>
              </div>
              {r.attachment_url ? <a href={r.attachment_url} className="mt-2 inline-block text-sm text-accent">View attachment</a> : null}
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
