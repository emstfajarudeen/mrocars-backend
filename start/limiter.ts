import limiter from '@adonisjs/limiter/services/main'

export const loginLimiter = limiter.define('login', () => {
  return limiter.allowRequests(5).every('1 minute')
})

export const registerLimiter = limiter.define('register', () => {
  return limiter.allowRequests(5).every('1 minute')
})

export const otpLimiter = limiter.define('otp', () => {
  return limiter.allowRequests(10).every('1 minute')
})

export const passwordResetLimiter = limiter.define('password_reset', () => {
  return limiter.allowRequests(5).every('1 minute')
})

export const tokenRefreshLimiter = limiter.define('token_refresh', () => {
  return limiter.allowRequests(10).every('1 minute')
})
