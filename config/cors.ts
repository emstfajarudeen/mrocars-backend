import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

const corsConfig = defineConfig({
  enabled: true,
  origin: (requestOrigin) => {
    const allowedOrigins = [env.get('APP_URL'), env.get('FRONTEND_URL')].filter(
      (origin): origin is string => Boolean(origin)
    )

    if (allowedOrigins.length === 0 || !requestOrigin) {
      return true
    }

    if (allowedOrigins.includes(requestOrigin)) {
      return true
    }

    if (env.get('NODE_ENV') === 'development') {
      return (
        requestOrigin.startsWith('http://localhost:') ||
        requestOrigin.startsWith('http://127.0.0.1:')
      )
    }

    return false
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
