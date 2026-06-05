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

router.on('/').renderInertia('home')
