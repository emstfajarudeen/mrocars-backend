import { defineConfig, stores } from '@adonisjs/limiter'
import env from '#start/env'

const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE', 'memory'),
  stores: {
    memory: stores.memory({}),
    redis: stores.redis({
      connectionName: 'main',
    }),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
