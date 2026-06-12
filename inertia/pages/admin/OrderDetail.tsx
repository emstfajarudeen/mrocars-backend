import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, Star } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Modal } from '~/components/ui/Modal'
import { PageHeader } from '~/components/ui/PageHeader'
import { Select } from '~/components/ui/Select'
import { useToast } from '~/components/ui/Toast'
import { apiMutate, reloadPage } from '~/lib/mutate'
import { formatStatusLabel, statusToBadge } from '~/lib/status'
import { cn, formatCurrency, formatDateTime } from '~/lib/utils'

type TimelineStep = { step: string; completed: boolean; current: boolean }

type Props = {
  order: {
    id: number
    orderNo: string
    status: string
    createdAt: string
    user: { name: string; email: string } | null
    business_profile: {
      business_name: string
      phone: { phone_code: string; phone_number: string }
      address: { governorate: { nameEn: string } | null; area: { nameEn: string } | null; block: string; street: string }
    } | null
    request: {
      requestNo: string
      title: string
      category: { nameEn: string } | null
      user_vehicle: { car_brand: { name: string } | null; car_model: { name: string } | null; year: string } | null
    } | null
    delivery_address: {
      label: string
      block: string
      street: string
      governorate: { nameEn: string } | null
      area: { nameEn: string } | null
    } | null
    payment: {
      parts_price: number
      delivery_fee: number
      platform_fee: number
      total_amount: number
      payment_method: string
      payment_status: string
    }
    status_timeline: TimelineStep[]
    additional_works?: Array<{
      id: number
      notes: string | null
      description?: string
      status: string
      price: number
      voice_note?: string | null
      voice_note_url?: string | null
      voiceNote?: string | null
      attachments?: string[]
      payment_status?: string
      paymentStatus?: string
    }>
    order_rating: { rating: number; review: string | null } | null
  }
}

export default function OrderDetail({ order }: Props) {
  const toast = useToast()
  const [status, setStatus] = useState(order.status)
  const [selectedWork, setSelectedWork] = useState<any | null>(null)

  const updateStatus = async () => {
    try {
      await apiMutate('PUT', `/orders/${order.id}/status`, { status })
      toast.success('Order status updated')
      reloadPage()
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <>
      <Head title={order.orderNo} />
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader
        title={order.orderNo}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={statusToBadge(order.status)}>{formatStatusLabel(order.status)}</Badge>
            <Select
              className="w-36"
              value={status}
              onChange={(v) => setStatus(v)}
              options={[
                { value: 'new', label: 'New' },
                { value: 'pending', label: 'Pending' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
            <Button size="sm" onClick={updateStatus}>Update</Button>
          </div>
        }
      />
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card title="Request">
          {order.request ? (
            <div className="space-y-2 text-sm">
              <p className="font-mono text-accent">{order.request.requestNo}</p>
              <p>{order.request.title}</p>
              <p className="text-text-secondary">{order.request.category?.nameEn}</p>
              {order.request.user_vehicle ? (
                <p>{order.request.user_vehicle.car_brand?.name} {order.request.user_vehicle.car_model?.name} ({order.request.user_vehicle.year})</p>
              ) : null}
            </div>
          ) : <p className="text-text-secondary">—</p>}
        </Card>
        <Card title="Business">
          {order.business_profile ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium">{order.business_profile.business_name}</p>
              <p className="font-mono">{order.business_profile.phone.phone_code} {order.business_profile.phone.phone_number}</p>
              {([order.business_profile.address.governorate?.nameEn, order.business_profile.address.area?.nameEn].filter(Boolean).join(', ')) ? (
                <p className="text-text-secondary">
                  {[order.business_profile.address.governorate?.nameEn, order.business_profile.address.area?.nameEn].filter(Boolean).join(', ')}
                </p>
              ) : null}
            </div>
          ) : <p className="text-text-secondary">—</p>}
        </Card>
        <Card title="Delivery Address">
          {order.delivery_address ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium">{order.delivery_address.label}</p>
              <p>{[order.delivery_address.block, order.delivery_address.street].filter(Boolean).join(', ')}</p>
              {([order.delivery_address.governorate?.nameEn, order.delivery_address.area?.nameEn].filter(Boolean).join(', ')) ? (
                <p className="text-text-secondary">
                  {[order.delivery_address.governorate?.nameEn, order.delivery_address.area?.nameEn].filter(Boolean).join(', ')}
                </p>
              ) : null}
            </div>
          ) : <p className="text-text-secondary">—</p>}
        </Card>
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card title="Price Breakdown">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">Parts Price</span><span className="font-mono">{formatCurrency(order.payment.parts_price)}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Delivery Fee</span><span className="font-mono">{formatCurrency(order.payment.delivery_fee)}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Platform Fee</span><span className="font-mono">{formatCurrency(order.payment.platform_fee)}</span></div>
            <div className="flex justify-between border-t border-border pt-3 font-medium">
              <span>Total</span><span className="font-mono text-accent">{formatCurrency(order.payment.total_amount)}</span>
            </div>
            <div className="flex gap-2 pt-2">
              <Badge variant="neutral">{order.payment.payment_method}</Badge>
              <Badge variant={statusToBadge(order.payment.payment_status)}>{formatStatusLabel(order.payment.payment_status)}</Badge>
            </div>
          </div>
        </Card>
        <Card title="Status Timeline">
          <div className="flex items-center justify-between gap-2">
            {order.status_timeline.map((step, i) => (
              <div key={step.step} className="flex flex-1 flex-col items-center">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium',
                  step.completed ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-muted',
                  step.current && 'ring-2 ring-accent'
                )}>
                  {i + 1}
                </div>
                <p className={cn('mt-2 text-xs capitalize', step.current ? 'text-accent' : 'text-text-secondary')}>
                  {formatStatusLabel(step.step)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-text-muted">Created {formatDateTime(String(order.createdAt))}</p>
        </Card>
      </div>
      {order.additional_works && order.additional_works.length > 0 ? (
        <Card title="Additional Works" className="mb-6">
          <div className="space-y-3">
            {order.additional_works.map((work) => {
              const hasVoiceNote = !!(work.voice_note_url || work.voiceNote)
              const hasAttachments = !!(work.attachments && work.attachments.length > 0)
              const hasMoreData = hasVoiceNote || hasAttachments || (work.notes && work.notes.length > 100)

              return (
                <div key={work.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <div className="flex flex-col gap-1 min-w-0 flex-1 pr-4">
                    <p className="font-medium text-text-primary truncate">{work.notes || work.description || 'Additional Work'}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedWork(work)}
                      className="text-xs text-accent hover:underline text-left w-fit"
                    >
                      View Details {hasMoreData ? '(Includes media)' : ''}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono">{formatCurrency(Number(work.price))}</span>
                    <Badge variant={statusToBadge(work.status)}>{formatStatusLabel(work.status)}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : null}
      {order.order_rating ? (
        <Card title="Rating">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-warning text-warning" />
            <span className="font-mono text-lg">{order.order_rating.rating}</span>
            {order.order_rating.review ? <p className="text-sm text-text-secondary">— {order.order_rating.review}</p> : null}
          </div>
        </Card>
      ) : null}
      {selectedWork && (
        <Modal
          open={!!selectedWork}
          onOpenChange={(open) => !open && setSelectedWork(null)}
          title="Additional Work Details"
        >
          <div className="space-y-4 pt-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Description</span>
              <p className="mt-1 text-sm text-text-primary whitespace-pre-wrap">{selectedWork.notes || selectedWork.description || 'No description provided'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Price</span>
                <p className="mt-1 font-mono text-sm text-accent">{formatCurrency(Number(selectedWork.price))}</p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Status</span>
                <div className="mt-1">
                  <Badge variant={statusToBadge(selectedWork.status)}>{formatStatusLabel(selectedWork.status)}</Badge>
                </div>
              </div>
            </div>

            {(selectedWork.payment_status || selectedWork.paymentStatus) && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Payment Status</span>
                <div className="mt-1">
                  <Badge variant={statusToBadge(selectedWork.payment_status || selectedWork.paymentStatus)}>{formatStatusLabel(selectedWork.payment_status || selectedWork.paymentStatus)}</Badge>
                </div>
              </div>
            )}

            {(selectedWork.voice_note_url || selectedWork.voiceNote) && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Voice Note</span>
                <div className="mt-2">
                  <audio controls src={selectedWork.voice_note_url || selectedWork.voiceNote} className="w-full h-10" />
                </div>
              </div>
            )}

            {selectedWork.attachments && selectedWork.attachments.length > 0 && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Attachments</span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {selectedWork.attachments.map((url: string, index: number) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-md border border-border bg-bg-hover"
                    >
                      <img
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
