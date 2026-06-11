import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router
  .group(() => {
    router
      .group(() => {
        router.post('/login', '#controllers/admin/auth_controller.login')
        router
          .post('/logout', '#controllers/admin/auth_controller.logout')
          .use([middleware.auth({ guards: ['web', 'jwt'] }), middleware.role({ role: 'admin' })])
      })
      .prefix('/auth')

    router
      .group(() => {
        router.get('/', '#controllers/admin/banner_controller.index')
        router.post('/', '#controllers/admin/banner_controller.store')
        router.put('/reorder', '#controllers/admin/banner_controller.reorder')
        router.get('/:id', '#controllers/admin/banner_controller.show')
        router.put('/:id', '#controllers/admin/banner_controller.update')
        router.delete('/:id', '#controllers/admin/banner_controller.destroy')
        router.put('/:id/toggle-status', '#controllers/admin/banner_controller.toggleStatus')
      })
      .prefix('/banners')
      .use([middleware.auth({ guards: ['web', 'jwt'] }), middleware.role({ role: 'admin' })])

    router
      .group(() => {
        router.get('/governorates', '#controllers/admin/governorate_controller.index')
        router.post('/governorates', '#controllers/admin/governorate_controller.store')
        router.get('/governorates/:id', '#controllers/admin/governorate_controller.show')
        router.put('/governorates/:id', '#controllers/admin/governorate_controller.update')
        router.delete('/governorates/:id', '#controllers/admin/governorate_controller.destroy')
        router.put(
          '/governorates/:id/toggle-status',
          '#controllers/admin/governorate_controller.toggleStatus'
        )

        router.get('/areas', '#controllers/admin/area_controller.index')
        router.post('/areas', '#controllers/admin/area_controller.store')
        router.get('/areas/:id', '#controllers/admin/area_controller.show')
        router.put('/areas/:id', '#controllers/admin/area_controller.update')
        router.delete('/areas/:id', '#controllers/admin/area_controller.destroy')
        router.put('/areas/:id/toggle-status', '#controllers/admin/area_controller.toggleStatus')

        router.get('/car-brands', '#controllers/admin/car_brand_controller.index')
        router.post('/car-brands', '#controllers/admin/car_brand_controller.store')
        router.get('/car-brands/:id', '#controllers/admin/car_brand_controller.show')
        router.put('/car-brands/:id', '#controllers/admin/car_brand_controller.update')
        router.delete('/car-brands/:id', '#controllers/admin/car_brand_controller.destroy')
        router.put(
          '/car-brands/:id/toggle-status',
          '#controllers/admin/car_brand_controller.toggleStatus'
        )

        router.get('/car-models', '#controllers/admin/car_model_controller.index')
        router.post('/car-models', '#controllers/admin/car_model_controller.store')
        router.get('/car-models/:id', '#controllers/admin/car_model_controller.show')
        router.put('/car-models/:id', '#controllers/admin/car_model_controller.update')
        router.delete('/car-models/:id', '#controllers/admin/car_model_controller.destroy')
        router.put(
          '/car-models/:id/toggle-status',
          '#controllers/admin/car_model_controller.toggleStatus'
        )

        router.get('/categories', '#controllers/admin/category_controller.index')
        router.post('/categories', '#controllers/admin/category_controller.store')
        router.put('/categories/reorder', '#controllers/admin/category_controller.reorder')
        router.get('/categories/:id', '#controllers/admin/category_controller.show')
        router.put('/categories/:id', '#controllers/admin/category_controller.update')
        router.delete('/categories/:id', '#controllers/admin/category_controller.destroy')
        router.put(
          '/categories/:id/toggle-status',
          '#controllers/admin/category_controller.toggleStatus'
        )
      })
      .prefix('/masters')
      .use([middleware.auth({ guards: ['web', 'jwt'] }), middleware.role({ role: 'admin' })])

    router
      .group(() => {
        router.get('/', '#controllers/admin/request_controller.index')
        router.delete('/:id', '#controllers/admin/request_controller.destroy')
        router.get('/:id', '#controllers/admin/request_controller.show')
      })
      .prefix('/requests')
      .use([middleware.auth({ guards: ['web', 'jwt'] }), middleware.role({ role: 'admin' })])

    router
      .group(() => {
        router.get('/stats', '#controllers/admin/order_controller.stats')
        router.get('/', '#controllers/admin/order_controller.index')
        router.put('/:id/status', '#controllers/admin/order_controller.updateStatus')
        router.get('/:id', '#controllers/admin/order_controller.show')
      })
      .prefix('/orders')
      .use([middleware.auth({ guards: ['web', 'jwt'] }), middleware.role({ role: 'admin' })])

    router
      .group(() => {
        router.get('/', '#controllers/admin/chat_controller.index')
        router.delete('/:id', '#controllers/admin/chat_controller.destroy')
        router.get('/:id', '#controllers/admin/chat_controller.show')
      })
      .prefix('/chats')
      .use([middleware.auth({ guards: ['web', 'jwt'] }), middleware.role({ role: 'admin' })])

    router
      .group(() => {
        router.get('/stats', '#controllers/admin/dashboard_controller.stats')
        router.get('/recent-activity', '#controllers/admin/dashboard_controller.recentActivity')
      })
      .prefix('/dashboard')
      .use([middleware.auth({ guards: ['web', 'jwt'] }), middleware.role({ role: 'admin' })])

    router
      .group(() => {
        router.get('/', '#controllers/admin/profile_controller.show')
        router.put('/update', '#controllers/admin/profile_controller.update')
        router.put('/change-password', '#controllers/admin/profile_controller.changePassword')
      })
      .prefix('/profile')
      .use([middleware.auth({ guards: ['web', 'jwt'] }), middleware.role({ role: 'admin' })])

    router
      .group(() => {
        router.get('/', '#controllers/admin/user_controller.index')
        router.put('/:id/toggle-status', '#controllers/admin/user_controller.toggleStatus')
        router.get('/:id', '#controllers/admin/user_controller.show')
        router.delete('/:id', '#controllers/admin/user_controller.destroy')
      })
      .prefix('/users')
      .use([middleware.auth({ guards: ['web', 'jwt'] }), middleware.role({ role: 'admin' })])

    router
      .group(() => {
        router.get('/', '#controllers/admin/guest_controller.index')
      })
      .prefix('/guests')
      .use([middleware.auth({ guards: ['web', 'jwt'] }), middleware.role({ role: 'admin' })])

    router
      .group(() => {
        router.get('/', '#controllers/admin/business_controller.index')
        router.post('/', '#controllers/admin/business_controller.store')
        router.put('/:id/toggle-status', '#controllers/admin/business_controller.toggleStatus')
        router.put('/:id/toggle-approval', '#controllers/admin/business_controller.toggleApproval')
        router.get('/:id/orders', '#controllers/admin/business_controller.orders')
        router.get('/:id/requests', '#controllers/admin/business_controller.requests')
        router.get('/:id', '#controllers/admin/business_controller.show')
        router.put('/:id', '#controllers/admin/business_controller.update')
        router.delete('/:id', '#controllers/admin/business_controller.destroy')
      })
      .prefix('/businesses')
      .use([middleware.auth({ guards: ['web', 'jwt'] }), middleware.role({ role: 'admin' })])
  })
  .prefix('/api/v1/admin')
  .use(middleware.forceJsonResponse())
