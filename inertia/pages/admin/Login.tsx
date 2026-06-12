import { Head, useForm, usePage } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'
import { Card } from '~/components/ui/Card'

type PageProps = { flash: { error?: string } }

export default function Login() {
  const { flash } = usePage<PageProps>().props
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/admin/login')
  }

  return (
    <>
      <Head title="Login" />
      <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4 flex-col">
        <div className="mb-8 flex justify-center">
          <img src="/logo.svg" alt="MROCars Logo" className="h-12 w-auto" />
        </div>
        <Card className="w-full max-w-md" title="MROCars Admin">
          <p className="mb-6 text-sm text-text-secondary">Sign in to manage the platform</p>
          {(flash.error || errors.email) && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {flash.error || errors.email}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" loading={processing}>
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}
