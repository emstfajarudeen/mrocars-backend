import { Head, Link } from '@inertiajs/react'
import { Eye } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import { PageHeader } from '~/components/ui/PageHeader'
import { Pagination } from '~/components/ui/Pagination'
import { SearchInput } from '~/components/ui/SearchInput'
import { Table } from '~/components/ui/Table'
import { visitAdmin } from '~/lib/mutate'
import { formatDateTime, type PaginationMeta } from '~/lib/utils'

type Chat = {
  id: number
  user: { name: string } | null
  business_profile: { business_name: string } | null
  request: { request_no: string; title: string } | null
  messages_count: number
  last_message_at: string | null
}

type Props = {
  chats: Chat[]
  meta: PaginationMeta
  filters: { search: string | null }
}

export default function Chats({ chats, meta, filters }: Props) {
  return (
    <>
      <Head title="Chats" />
      <PageHeader title="Chats" description="User ↔ business conversations" />
      <div className="mb-6 max-w-sm">
        <SearchInput
          defaultValue={filters.search ?? ''}
          onSearch={(s) => visitAdmin('/admin/chats', { search: s, page: 1 })}
        />
      </div>
      <Table
        columns={[
          { key: 'user', label: 'User', render: (r) => r.user?.name ?? '—' },
          { key: 'business', label: 'Business', render: (r) => r.business_profile?.business_name ?? '—' },
          { key: 'request', label: 'Request', render: (r) => r.request ? <span className="font-mono text-sm">{r.request.request_no}</span> : '—' },
          { key: 'count', label: 'Messages', render: (r) => <span className="font-mono">{r.messages_count}</span> },
          { key: 'last', label: 'Last Message', render: (r) => formatDateTime(r.last_message_at) },
          { key: 'a', label: '', render: (r) => (
            <Link href={`/admin/chats/${r.id}`}><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></Link>
          ) },
        ]}
        data={chats}
      />
      <Pagination meta={meta} />
    </>
  )
}
