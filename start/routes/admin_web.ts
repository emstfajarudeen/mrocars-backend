import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const adminAuth = [middleware.adminWebAuth(), middleware.role({ role: 'admin' })]

router.get('/admin', async ({ response, auth }) => {
  await auth.use('web').check()
  if (auth.use('web').isAuthenticated) return response.redirect('/admin/dashboard')
  return response.redirect('/admin/login')
})

router.get('/admin/login', '#controllers/admin/inertia/auth_controller.showLogin')
router.post('/admin/login', '#controllers/admin/inertia/auth_controller.login')
router
  .post('/admin/logout', '#controllers/admin/inertia/auth_controller.logout')
  .use(adminAuth)

router
  .group(() => {
    router.get('/dashboard', '#controllers/admin/inertia/dashboard_controller.index')
    router.get('/banners', '#controllers/admin/inertia/banner_controller.index')

    router.get('/categories', '#controllers/admin/inertia/masters_controller.categories')
    router.get('/car-brands', '#controllers/admin/inertia/masters_controller.carBrands')
    router.get('/car-models', '#controllers/admin/inertia/masters_controller.carModels')
    router.get('/governorates', '#controllers/admin/inertia/masters_controller.governorates')
    router.get('/areas', '#controllers/admin/inertia/masters_controller.areas')

    router.get('/users', '#controllers/admin/inertia/user_controller.index')
    router.get('/users/:id', '#controllers/admin/inertia/user_controller.show')

    router.get('/businesses', '#controllers/admin/inertia/business_controller.index')
    router.get('/businesses/create', '#controllers/admin/inertia/business_controller.create')
    router.get('/businesses/:id', '#controllers/admin/inertia/business_controller.show')

    router.get('/requests', '#controllers/admin/inertia/request_controller.index')
    router.get('/requests/:id', '#controllers/admin/inertia/request_controller.show')

    router.get('/orders', '#controllers/admin/inertia/order_controller.index')
    router.get('/orders/:id', '#controllers/admin/inertia/order_controller.show')

    router.get('/chats', '#controllers/admin/inertia/chat_controller.index')
    router.get('/chats/:id', '#controllers/admin/inertia/chat_controller.show')

    router.get('/profile', '#controllers/admin/inertia/profile_controller.show')

    router.get('/enquiries', '#controllers/admin/inertia/enquiry_controller.index')
    router.get('/settings', '#controllers/admin/inertia/setting_controller.index')
    router.get('/reports', '#controllers/admin/inertia/report_controller.index')
    router.get('/notifications', '#controllers/admin/inertia/notification_controller.index')
  })
  .prefix('/admin')
  .use(adminAuth)
