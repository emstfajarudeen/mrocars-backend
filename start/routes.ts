/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

import '#start/routes/user'
import '#start/routes/business'
import '#start/routes/admin'
import '#start/routes/admin_web'

router.get('/', ({ response }) => response.redirect('/admin'))

router.get('/health', async ({ response }) => {
  return response.ok({ status: 'ok', uptime: process.uptime() })
})
