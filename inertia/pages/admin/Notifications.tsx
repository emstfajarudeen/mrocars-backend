import { Head } from '@inertiajs/react'
import { Send, History, UserCheck, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { Card } from '~/components/ui/Card'
import { Input } from '~/components/ui/Input'
import { Select } from '~/components/ui/Select'
import { Button } from '~/components/ui/Button'
import { PageHeader } from '~/components/ui/PageHeader'
import { Table } from '~/components/ui/Table'
import { useToast } from '~/components/ui/Toast'
import { apiMutate, reloadPage } from '~/lib/mutate'
import { formatDateTime } from '~/lib/utils'

type Campaign = {
  title: string
  body: string
  created_at: string
}

type Props = {
  campaigns: Campaign[]
}

export default function Notifications({ campaigns }: Props) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    body: '',
    recipient_type: 'all',
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and message body are required')
      return
    }

    setLoading(true)
    try {
      await apiMutate('POST', '/notifications/send', form)
      toast.success('Notification campaign sent successfully')
      setForm({ title: '', body: '', recipient_type: 'all' })
      reloadPage()
    } catch (err) {
      toast.error('Failed to dispatch bulk notifications')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head title="General Notifications" />
      <PageHeader
        title="General Notifications"
        description="Compose and dispatch bulk push notifications to registered users and business accounts"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compose Form */}
        <div className="lg:col-span-1">
          <Card title="Compose Campaign">
            <form onSubmit={submit} className="space-y-4">
              <Input
                label="Notification Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter campaign title..."
                required
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">Message Body</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={5}
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Type message content here..."
                  required
                />
              </div>

              <Select
                label="Target Audience"
                value={form.recipient_type}
                onChange={(val) => setForm({ ...form, recipient_type: val })}
                options={[
                  { value: 'all', label: 'All Users & Businesses' },
                  { value: 'users', label: 'Customers (Normal Users) Only' },
                  { value: 'businesses', label: 'Partners (Business Owners) Only' },
                ]}
              />

              <div className="pt-2">
                <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={loading}>
                  <Send className="h-4 w-4" /> {loading ? 'Sending...' : 'Send Bulk Notification'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Dispatch Logs / History */}
        <div className="lg:col-span-2">
          <Card title="Campaign History">
            <div className="overflow-x-auto">
              <Table
                columns={[
                  {
                    key: 'title',
                    label: 'Title',
                    className: 'font-semibold max-w-[150px] truncate',
                  },
                  {
                    key: 'body',
                    label: 'Message',
                    render: (r) => <div className="max-w-[320px] truncate text-sm text-text-secondary">{r.body}</div>,
                  },
                  {
                    key: 'created_at',
                    label: 'Sent Date',
                    render: (r) => formatDateTime(String(r.created_at)),
                  },
                ]}
                data={campaigns}
              />
              {campaigns.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-text-muted">
                  <History className="h-8 w-8 mb-2 stroke-1" />
                  <p className="text-sm">No general notifications have been sent yet.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
