import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'
import type { InferMailers } from '@adonisjs/mail/types'

const mailUsername = env.get('MAIL_USERNAME')
const mailPassword = env.get('MAIL_PASSWORD')
const mailHost = env.get('MAIL_HOST')
const mailPort = env.get('MAIL_PORT')

const mailConfig = defineConfig({
  default: env.get('MAIL_MAILER'),
  mailers: {
    smtp: transports.smtp({
      host: mailHost ?? 'localhost',
      port: mailPort ?? 587,
      ...(mailUsername && mailPassword
        ? {
            auth: {
              type: 'login' as const,
              user: mailUsername,
              pass: mailPassword,
            },
          }
        : {}),
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
