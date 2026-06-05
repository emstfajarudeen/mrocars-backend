import { Link, router, usePage } from '@inertiajs/react'
import {
  Building2,
  Car,
  FileText,
  Grid,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  Menu,
  MessageSquare,
  Settings,
  ShoppingBag,
  User,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { ToastProvider, useToast } from '~/components/ui/Toast'
import { cn } from '~/lib/utils'

type AuthUser = { id: number; name: string; email: string; role: string }
type Flash = { success?: string; error?: string }
type PageProps = { auth: { user: AuthUser | null }; flash: Flash }

const navGroups = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Categories', href: '/admin/categories', icon: Grid },
      { label: 'Car Brands', href: '/admin/car-brands', icon: Car },
      { label: 'Car Models', href: '/admin/car-models', icon: Settings },
      { label: 'Governorates', href: '/admin/governorates', icon: MapPin },
      { label: 'Areas', href: '/admin/areas', icon: Map },
    ],
  },
  {
    label: 'Users',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Businesses', href: '/admin/businesses', icon: Building2 },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Requests', href: '/admin/requests', icon: FileText },
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { label: 'Chats', href: '/admin/chats', icon: MessageSquare },
    ],
  },
  {
    label: 'Account',
    items: [{ label: 'Profile', href: '/admin/profile', icon: User }],
  },
]

function FlashToasts() {
  const { flash } = usePage<{ flash: Flash }>().props
  const toast = useToast()

  useEffect(() => {
    if (flash?.success) toast.success(flash.success)
    if (flash?.error) toast.error(flash.error)
  }, [flash?.success, flash?.error])

  return null
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { url } = usePage()

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            M
          </div>
          <span className="text-lg font-semibold tracking-tight">MROCars</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-text-muted">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = url.startsWith(item.href)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150',
                        active
                          ? 'border-l-2 border-accent bg-accent-soft text-text-primary'
                          : 'border-l-2 border-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const { auth } = usePage<PageProps>().props
  const [mobileOpen, setMobileOpen] = useState(false)

  const logout = () => {
    router.post('/admin/logout')
  }

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-border bg-bg-primary lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] border-r border-border bg-bg-primary">
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-text-secondary hover:bg-bg-hover"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg-secondary px-4 lg:px-8">
          <button
            type="button"
            className="rounded-lg p-2 text-text-secondary hover:bg-bg-hover lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{auth.user?.name}</p>
              <p className="text-xs text-text-secondary">{auth.user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors duration-150 hover:bg-bg-hover hover:text-text-primary"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
      <FlashToasts />
    </div>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </ToastProvider>
  )
}

export function withAdminLayout(page: ReactNode) {
  return <AdminLayout>{page}</AdminLayout>
}
