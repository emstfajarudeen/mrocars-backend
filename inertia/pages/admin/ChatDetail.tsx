import { Head, Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Card } from '~/components/ui/Card'
import { PageHeader } from '~/components/ui/PageHeader'
import { Pagination } from '~/components/ui/Pagination'
import { cn, formatDateTime, type PaginationMeta } from '~/lib/utils'

type Message = {
  id: number
  sender_type: 'user' | 'business'
  message: string | null
  voice_note_url: string | null
  attachment_url: string | null
  attachment_type: string | null
  created_at: string
}

type Props = {
  chat: {
    id: number
    user: { name: string } | null
    business_profile: { business_name: string } | null
    request: { request_no: string; title: string; category: { nameEn: string } | null } | null
  }
  messages: Message[]
  meta: PaginationMeta
}

export default function ChatDetail({ chat, messages, meta }: Props) {
  return (
    <>
      <Head title={`Chat #${chat.id}`} />
      <Link href="/admin/chats" className="mb-4 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader
        title={`${chat.user?.name ?? 'User'} ↔ ${chat.business_profile?.business_name ?? 'Business'}`}
        description={chat.request ? `${chat.request.request_no} — ${chat.request.title}` : undefined}
        action={chat.request?.category ? <Badge variant="neutral">{chat.request.category.nameEn}</Badge> : undefined}
      />
      <Card className="min-h-[400px]">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => {
            const isUser = msg.sender_type === 'user'
            return (
              <div key={msg.id} className={cn('flex', isUser ? 'justify-start' : 'justify-end')}>
                <div className={cn(
                  'max-w-[75%] rounded-lg px-4 py-3 text-sm',
                  isUser ? 'bg-bg-hover' : 'bg-accent-soft'
                )}>
                  {msg.message ? <p>{msg.message}</p> : null}
                  {msg.voice_note_url ? <audio controls src={msg.voice_note_url} className="mt-2 w-full max-w-xs" /> : null}
                  {msg.attachment_url ? (
                    msg.attachment_type?.startsWith('image') || msg.attachment_url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                      <a href={msg.attachment_url} target="_blank" rel="noreferrer">
                        <img src={msg.attachment_url} alt="" className="mt-2 max-h-40 rounded border border-border" />
                      </a>
                    ) : (
                      <a href={msg.attachment_url} className="mt-2 inline-block text-accent hover:underline" target="_blank" rel="noreferrer">
                        View attachment
                      </a>
                    )
                  ) : null}
                  <p className="mt-1 text-xs text-text-muted">{formatDateTime(String(msg.created_at))}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
      <Pagination meta={meta} />
    </>
  )
}
