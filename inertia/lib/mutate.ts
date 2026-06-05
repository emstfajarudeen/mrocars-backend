import { router } from '@inertiajs/react'
import { apiUrl } from '~/lib/api'

function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
}

type ApiResult<T = unknown> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function apiMutate<T = unknown>(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: FormData | Record<string, unknown>
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-CSRF-TOKEN': getCsrfToken(),
    'X-Requested-With': 'XMLHttpRequest',
  }

  let fetchBody: BodyInit | undefined

  if (body instanceof FormData) {
    fetchBody = body
  } else if (body) {
    headers['Content-Type'] = 'application/json'
    fetchBody = JSON.stringify(body)
  }

  const response = await fetch(apiUrl(path), {
    method,
    headers,
    body: fetchBody,
    credentials: 'same-origin',
  })

  const result = (await response.json()) as ApiResult<T>

  if (!response.ok || !result.success) {
    throw result
  }

  return result
}

export function reloadPage() {
  router.reload({ preserveScroll: true })
}

export function visitAdmin(path: string, params?: Record<string, string | number | null>) {
  const query = params
    ? Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    : undefined

  router.get(path, query, { preserveState: true, preserveScroll: true })
}
