import { Head, Link } from '@inertiajs/react'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Car,
  Wrench,
  Volume2,
  Image,
  FileText,
  Star,
  MessageSquare,
  Tag,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Card } from '~/components/ui/Card'
import { formatStatusLabel, statusToBadge } from '~/lib/status'
import { formatCurrency, formatDateTime } from '~/lib/utils'

type Props = {
  request: {
    id: number
    request_no: string
    title: string
    description: string | null
    status: string
    voice_note_url: string | null
    spare_part_type: string | null
    no_of_tyres: number | null
    when_needed: string | null
    scheduled_date: string | null
    scheduled_time: string | null
    pickup_location_name: string | null
    pickup_latitude: string | null
    pickup_longitude: string | null
    delivery_location_name: string | null
    delivery_latitude: string | null
    delivery_longitude: string | null
    created_at: string
    category: { name_en: string; name_ar: string } | null
    user: { name: string } | null
    user_vehicle: {
      car_brand: { name: string } | null
      car_model: { name: string } | null
      year: string
    } | null
    attachments?: Array<{ file_url: string; file_type: string }>
    responses: Array<{
      id: number
      response_no: string
      price: string
      status: string
      notes: string | null
      attachment_urls: string[]
      business_user: { name: string } | null
      business_profile: { business_name: string; rating_avg: number | null } | null
    }>
  }
}

export default function RequestDetail({ request: req }: Props) {
  const hasPickupMap = req.pickup_latitude && req.pickup_longitude
  const hasDeliveryMap = req.delivery_latitude && req.delivery_longitude

  return (
    <>
      <Head title={`${req.request_no} - ${req.title}`} />

      {/* Back Button */}
      <Link
        href="/admin/requests"
        className="mb-5 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Requests
      </Link>

      {/* Premium Header Panel */}
      <div className="relative rounded-2xl border border-border bg-bg-card p-6 md:p-8 overflow-hidden mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 left-0 h-full w-1.5 bg-accent" />
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold tracking-wider text-accent border border-accent/30 bg-accent/5 px-2.5 py-1 rounded-md">
              {req.request_no}
            </span>
            {req.category?.name_en && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-bg-hover border border-border px-2.5 py-1 text-xs font-semibold text-text-secondary">
                <Tag className="h-3.5 w-3.5 text-accent" />
                {req.category.name_en}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight leading-none">
            {req.title}
          </h1>
          <p className="text-xs text-text-secondary flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-text-muted" />
            <span>Submitted on {formatDateTime(req.created_at)}</span>
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 bg-bg-secondary p-3 rounded-xl border border-border/40">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted px-1">
            Status:
          </span>
          <Badge
            variant={statusToBadge(req.status)}
            className="py-1 px-3 text-xs uppercase font-extrabold tracking-widest"
          >
            {formatStatusLabel(req.status)}
          </Badge>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column (Specs, Maps, Responses) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request details card */}
          <Card title="Request Specifications">
            <div className="space-y-4">
              {req.description && (
                <div className="relative rounded-xl border-l-4 border-accent bg-bg-hover/40 p-4">
                  <p className="text-sm text-text-primary italic leading-relaxed">
                    "{req.description}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {req.user_vehicle && (
                  <div className="rounded-xl border border-border bg-bg-secondary/20 p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                        Vehicle
                      </h5>
                      <p className="text-sm font-semibold text-text-primary mt-0.5">
                        {req.user_vehicle.car_brand?.name || ''}{' '}
                        {req.user_vehicle.car_model?.name || ''} ({req.user_vehicle.year})
                      </p>
                    </div>
                  </div>
                )}

                {req.spare_part_type && (
                  <div className="rounded-xl border border-border bg-bg-secondary/20 p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                        Spare Part Type
                      </h5>
                      <p className="text-sm font-semibold text-text-primary mt-0.5">
                        {req.spare_part_type}
                      </p>
                    </div>
                  </div>
                )}

                {req.no_of_tyres && (
                  <div className="rounded-xl border border-border bg-bg-secondary/20 p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                      <Tag className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                        No. of Tyres
                      </h5>
                      <p className="text-sm font-semibold text-text-primary mt-0.5">
                        {req.no_of_tyres} Tyres
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Embedded Google Maps card */}
          {(hasPickupMap || hasDeliveryMap) && (
            <Card title="Routing & Location Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hasPickupMap && (
                  <div className="rounded-xl border border-border bg-bg-secondary/20 p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                          Pickup Location
                        </h4>
                        <p className="text-sm font-medium text-text-primary mt-0.5">
                          {req.pickup_location_name || 'Specified Pickup Point'}
                        </p>
                      </div>
                    </div>
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border/40 bg-bg-hover">
                      <iframe
                        width="100%"
                        height="100%"
                        className="absolute inset-0"
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${req.pickup_latitude},${req.pickup_longitude}&z=14&output=embed`}
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}

                {hasDeliveryMap && (
                  <div className="rounded-xl border border-border bg-bg-secondary/20 p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                          Delivery Location
                        </h4>
                        <p className="text-sm font-medium text-text-primary mt-0.5">
                          {req.delivery_location_name || 'Specified Delivery Point'}
                        </p>
                      </div>
                    </div>
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border/40 bg-bg-hover">
                      <iframe
                        width="100%"
                        height="100%"
                        className="absolute inset-0"
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${req.delivery_latitude},${req.delivery_longitude}&z=14&output=embed`}
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Offers Received Section */}
          <Card title={`Offers Received (${req.responses.length})`}>
            <div className="space-y-4">
              {req.responses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 bg-bg-secondary/10 p-12 text-center flex flex-col items-center justify-center gap-2">
                  <MessageSquare className="h-10 w-10 text-text-muted" />
                  <h4 className="text-sm font-semibold text-text-secondary">No Offers Yet</h4>
                  <p className="text-xs text-text-muted max-w-xs">
                    Businesses haven't submitted quotes for this service request yet.
                  </p>
                </div>
              ) : (
                req.responses.map((r) => (
                  <div
                    key={r.id}
                    className="group relative rounded-xl border border-border bg-bg-secondary/20 p-5 hover:border-accent hover:bg-bg-secondary/40 transition-all duration-300 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center"
                  >
                    <div className="flex gap-4 items-start flex-1">
                      <div className="h-12 w-12 rounded-lg bg-bg-hover flex items-center justify-center font-black text-accent border border-border shadow-inner shrink-0 uppercase text-lg">
                        {r.business_profile?.business_name
                          ? r.business_profile.business_name.charAt(0)
                          : r.business_user?.name
                            ? r.business_user.name.charAt(0)
                            : 'B'}
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="font-bold text-text-primary leading-none text-base group-hover:text-accent transition-colors duration-300">
                          {r.business_profile?.business_name ?? r.business_user?.name}
                        </h4>
                        <p className="font-mono text-[10px] text-text-muted">{r.response_no}</p>

                        {r.notes && (
                          <p className="text-sm text-text-secondary leading-relaxed bg-bg-secondary/30 rounded-lg p-2.5 mt-2 border border-border/40 italic">
                            "{r.notes}"
                          </p>
                        )}

                        {r.business_profile?.rating_avg != null && (
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                            <span className="text-xs font-bold text-text-secondary">
                              {r.business_profile.rating_avg.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-text-muted">(Avg. Rating)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-end justify-between w-full md:w-auto border-t md:border-t-0 border-border/40 pt-4 md:pt-0 shrink-0">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-text-secondary font-medium">Quote Price</p>
                        <p className="font-mono text-2xl font-black text-accent mt-0.5">
                          {formatCurrency(r.price)}
                        </p>
                      </div>
                      <Badge
                        variant={statusToBadge(r.status)}
                        className="mt-2 uppercase tracking-wider font-bold"
                      >
                        {formatStatusLabel(r.status)}
                      </Badge>
                    </div>

                    {r.attachment_urls && r.attachment_urls.length > 0 && (
                      <div className="w-full flex flex-wrap gap-2 mt-4 border-t border-border/40 pt-3">
                        {r.attachment_urls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-accent/5 border border-accent/20 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/15 transition-all duration-300"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Attachment {idx + 1}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Side Column (Customer Info, Scheduling, Attachments) */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <Card title="Customer Profile" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-accent/5 rounded-bl-full -z-10" />
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent font-bold text-lg uppercase shadow-md shadow-accent/5">
                {req.user?.name ? req.user.name.charAt(0) : <User className="h-6 w-6" />}
              </div>
              <div>
                <h4 className="text-base font-bold text-text-primary leading-tight">
                  {req.user?.name || 'Unknown User'}
                </h4>
                <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent mt-1">
                  Platform Customer
                </span>
              </div>
            </div>
          </Card>

          {/* Scheduling & Timeline Card */}
          <Card title="Scheduling & Timeline">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <span className="text-sm text-text-secondary font-medium">When Needed</span>
                <Badge
                  variant={req.when_needed === 'now' ? 'danger' : 'warning'}
                  className="uppercase font-semibold tracking-wider"
                >
                  {req.when_needed}
                </Badge>
              </div>

              {req.when_needed === 'later' && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-border bg-bg-secondary/20 p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center text-warning shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                        Scheduled Date
                      </h5>
                      <p className="text-sm font-semibold text-text-primary mt-0.5">
                        {req.scheduled_date}
                      </p>
                    </div>
                  </div>

                  {req.scheduled_time && (
                    <div className="rounded-xl border border-border bg-bg-secondary/20 p-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center text-warning shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h5 className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                          Scheduled Time
                        </h5>
                        <p className="text-sm font-semibold text-text-primary mt-0.5">
                          {req.scheduled_time}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-text-muted font-medium">Submitted</span>
                <span className="text-xs text-text-secondary font-mono">
                  {formatDateTime(req.created_at)}
                </span>
              </div>
            </div>
          </Card>

          {/* Media Attachments Card */}
          <Card title="Attachments & Media">
            <div className="space-y-4">
              {req.voice_note_url ? (
                <div className="rounded-xl border border-border bg-bg-secondary/20 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Volume2 className="h-4 w-4 text-accent" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                      Voice Note Instruction
                    </span>
                  </div>
                  <audio controls src={req.voice_note_url} className="w-full" />
                </div>
              ) : null}

              <div className="rounded-xl border border-border bg-bg-secondary/20 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Image className="h-4 w-4 text-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Photo Attachments
                  </span>
                </div>
                {req.attachments && req.attachments.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {req.attachments.map((a, i) => (
                      <a
                        key={i}
                        href={a.file_url ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block aspect-square rounded-lg overflow-hidden border border-border bg-bg-secondary hover:border-accent transition-all duration-300"
                      >
                        <img
                          src={a.file_url ?? ''}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <ExternalLink className="h-5 w-5 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">No photo attachments uploaded</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
