/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '../css/app.css'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import AdminLayout from '~/layouts/AdminLayout'

const appName = import.meta.env.VITE_APP_NAME || 'MROCars'

createInertiaApp({
  progress: { color: '#1A6B3C' },

  title: (title) => (title ? `${title} — MROCars Admin` : 'MROCars Admin'),

  resolve: async (name) => {
    const page = await resolvePageComponent(
      `../pages/${name}.tsx`,
      import.meta.glob('../pages/**/*.tsx')
    )
    const Page = page.default

    if (name.startsWith('admin/') && name !== 'admin/Login') {
      page.default = function AdminPage(props: Record<string, unknown>) {
        return (
          <AdminLayout>
            <Page {...props} />
          </AdminLayout>
        )
      }
    }

    return page
  },

  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
