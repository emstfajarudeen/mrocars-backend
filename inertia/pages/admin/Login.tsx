import { Head, useForm, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Mail, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react'

type PageProps = { flash: { error?: string } }

export default function Login() {
  const { flash } = usePage<PageProps>().props
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/admin/login')
  }

  return (
    <>
      <Head title="Login" />
      <div className="relative flex flex-col min-h-screen items-center justify-center bg-bg-primary px-4 py-12 overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/4 left-1/4 -z-10 h-80 w-80 rounded-full bg-accent/10 blur-[120px] animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-accent/5 blur-[120px] animate-pulse duration-[8000ms]" />

        <div className="w-[400px] max-w-[95%] space-y-8 mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
              <img src="/logo.svg" alt="MROCars Logo" className="h-16 w-auto" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              Admin Portal
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Sign in to manage the MROCars platform
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-bg-card/60 p-8 shadow-2xl backdrop-blur-xl">
            {/* Elegant top accent glow line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />

            {(flash.error || errors.email) && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm text-danger animate-in fade-in slide-in-from-top-1 duration-200">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Login Failed:</span> {flash.error || errors.email}
                </div>
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className={`w-full rounded-lg border bg-bg-secondary/40 pl-10 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                      errors.email ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'
                    }`}
                    placeholder="admin@mrocars.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    className={`w-full rounded-lg border bg-bg-secondary/40 pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                      errors.password ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'
                    }`}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-danger mt-1">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-accent to-accent-hover hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(26,107,60,0.2)] hover:shadow-[0_0_20px_rgba(26,107,60,0.4)] text-white font-medium"
                loading={processing}
              >
                Sign In
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
