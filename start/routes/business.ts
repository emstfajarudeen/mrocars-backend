import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router
  .group(() => {
    router
      .group(() => {
        router.post('/login', '#controllers/business/auth_controller.login')
        router.post('/forgot-password', '#controllers/business/auth_controller.forgotPassword')
        router.post('/verify-otp', '#controllers/business/auth_controller.verifyOtp')
        router.post('/reset-password', '#controllers/business/auth_controller.resetPassword')
        router.post('/refresh-token', '#controllers/business/auth_controller.refreshToken')
        router
          .post('/logout', '#controllers/business/auth_controller.logout')
          .use([middleware.auth(), middleware.role({ role: 'business' })])
      })
      .prefix('/auth')

    router
      .group(() => {
        router.get('/governorates', '#controllers/business/masters_controller.governorates')
        router.get('/governorates/:id/areas', '#controllers/business/masters_controller.areas')
        router.get('/car-brands', '#controllers/business/masters_controller.carBrands')
        router.get('/car-brands/:id/models', '#controllers/business/masters_controller.carModels')
        router.get('/categories', '#controllers/business/masters_controller.categories')
      })
      .prefix('/masters')

    router
      .get('/home', '#controllers/business/home_controller.index')
      .use([middleware.auth(), middleware.role({ role: 'business' })])

    router
      .group(() => {
        router.get('/', '#controllers/business/profile_controller.show')
        router.put('/update', '#controllers/business/profile_controller.update')
        router.put('/address', '#controllers/business/profile_controller.updateAddress')
        router.put('/bank-details', '#controllers/business/profile_controller.updateBankDetails')
        router.put('/change-password', '#controllers/business/profile_controller.changePassword')
        router.put('/language', '#controllers/business/profile_controller.updateLanguage')
        router.delete('/delete-account', '#controllers/business/profile_controller.deleteAccount')
      })
      .prefix('/profile')
      .use([middleware.auth(), middleware.role({ role: 'business' })])

    router
      .group(() => {
        router.get('/', '#controllers/business/request_controller.index')
        router.put('/:requestId/reject', '#controllers/business/request_controller.reject')
        router.post('/:requestId/respond', '#controllers/business/request_controller.respond')
        router.put(
          '/:requestId/respond/:responseId',
          '#controllers/business/request_controller.updateResponse'
        )
        router.get('/:id', '#controllers/business/request_controller.show')
      })
      .prefix('/requests')
      .use([middleware.auth(), middleware.role({ role: 'business' })])

    router
      .group(() => {
        router.get('/', '#controllers/business/order_controller.index')
        router.get('/:id', '#controllers/business/order_controller.show')
        router.put('/:id/status', '#controllers/business/order_controller.updateStatus')
        router.post('/:id/additional-works', '#controllers/business/order_controller.addAdditionalWork')
        router.get('/:id/additional-works', '#controllers/business/order_controller.additionalWorks')
        router.put(
          '/:id/additional-works/:workId',
          '#controllers/business/order_controller.updateAdditionalWork'
        )
      })
      .prefix('/orders')
      .use([middleware.auth(), middleware.role({ role: 'business' })])

    router
      .group(() => {
        router.get('/', '#controllers/business/chat_controller.index')
        router.put('/:id/messages/read', '#controllers/business/chat_controller.markAsRead')
        router.post('/:id/messages', '#controllers/business/chat_controller.sendMessage')
        router.get('/:id', '#controllers/business/chat_controller.show')
      })
      .prefix('/chats')
      .use([middleware.auth(), middleware.role({ role: 'business' })])

    router
      .group(() => {
        router.get('/unread-count', '#controllers/business/notification_controller.unreadCount')
        router.get('/', '#controllers/business/notification_controller.index')
        router.put('/read-all', '#controllers/business/notification_controller.readAll')
        router.put('/:id/read', '#controllers/business/notification_controller.markAsRead')
        router.delete('/:id', '#controllers/business/notification_controller.destroy')
      })
      .prefix('/notifications')
      .use([middleware.auth(), middleware.role({ role: 'business' })])
  })
  .prefix('/api/v1/business')
  .use(middleware.forceJsonResponse())
