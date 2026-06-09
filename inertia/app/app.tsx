/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />
import '../css/app.css'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import type { ComponentType } from 'react'
import AdminLayout from '~/layouts/AdminLayout'

const appElement = document.getElementById('app')
const initialPage = appElement?.dataset.page ? JSON.parse(appElement.dataset.page) : undefined

createInertiaApp({
  page: initialPage,
  progress: { color: '#1A6B3C' },

  title: (title) => (title ? `${title} — MROCars Admin` : 'MROCars Admin'),

  resolve: async (name) => {
    const page = await resolvePageComponent(
      `../pages/${name}.tsx`,
      import.meta.glob<{ default: ComponentType<Record<string, unknown>> }>('../pages/**/*.tsx')
    )
    const Page = page.default

    if (name.startsWith('admin/') && name !== 'admin/Login') {
      const PageComponent = Page as any
      PageComponent.layout = PageComponent.layout || ((page: any) => <AdminLayout>{page}</AdminLayout>)
    }

    return page
  },

  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})

