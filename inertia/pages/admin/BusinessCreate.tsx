import { Head, Link, router } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Input } from '~/components/ui/Input'
import { PageHeader } from '~/components/ui/PageHeader'
import { useToast } from '~/components/ui/Toast'
import { apiMutate } from '~/lib/mutate'

export default function BusinessCreate() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone_code: '+965',
    phone_number: '',
    password: '',
    business_name: '',
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiMutate('POST', '/businesses', form)
      toast.success('Business created')
      router.visit('/admin/businesses')
    } catch (err) {
      toast.error('Failed', (err as { message?: string }).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head title="Add Business" />
      <Link href="/admin/businesses" className="mb-4 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader title="Add Business Account" />
      <Card className="max-w-xl">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Contact Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone Code" value={form.phone_code} onChange={(e) => setForm({ ...form, phone_code: e.target.value })} />
            <Input label="Phone Number" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
          </div>
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Input label="Business Name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
          <Button type="submit" loading={loading}>Create Business</Button>
        </form>
      </Card>
    </>
  )
}
