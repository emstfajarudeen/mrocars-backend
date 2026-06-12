/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_NAME: Env.schema.string(),
  APP_KEY: Env.schema.string(),
  APP_URL: Env.schema.string.optional(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),
  REDIS_HOST: Env.schema.string({ format: 'host' }),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),
  MAIL_MAILER: Env.schema.enum(['smtp'] as const),
  MAIL_HOST: Env.schema.string.optional(),
  MAIL_PORT: Env.schema.number.optional(),
  MAIL_USERNAME: Env.schema.string.optional(),
  MAIL_PASSWORD: Env.schema.string.optional(),
  MAIL_FROM_ADDRESS: Env.schema.string(),
  DRIVE_DISK: Env.schema.enum(['local'] as const),
  FRONTEND_URL: Env.schema.string.optional(),
  JWT_SECRET: Env.schema.string(),
  LIMITER_STORE: Env.schema.enum.optional(['memory', 'redis'] as const),
  UPLOAD_DIR: Env.schema.string.optional(),
})
