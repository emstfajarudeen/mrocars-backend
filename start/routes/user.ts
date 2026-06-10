import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router
  .group(() => {
    router
      .group(() => {
        router.post('/register', '#controllers/user/auth_controller.register')
        router.post('/login', '#controllers/user/auth_controller.login')
        router.post('/guest-login', '#controllers/user/auth_controller.guestLogin')
        router.post('/forgot-password', '#controllers/user/auth_controller.forgotPassword')
        router.post('/verify-otp', '#controllers/user/auth_controller.verifyOtp')
        router.post('/reset-password', '#controllers/user/auth_controller.resetPassword')
        router.post('/refresh-token', '#controllers/user/auth_controller.refreshToken')
        router
          .post('/logout', '#controllers/user/auth_controller.logout')
          .use([middleware.auth(), middleware.role({ role: 'user' })])
      })
      .prefix('/auth')

    router
      .group(() => {
        router.get('/governorates', '#controllers/user/masters_controller.governorates')
        router.get('/governorates/:id/areas', '#controllers/user/masters_controller.areas')
        router.get('/car-brands', '#controllers/user/masters_controller.carBrands')
        router.get('/car-brands/:id/models', '#controllers/user/masters_controller.carModels')
        router.get('/categories', '#controllers/user/masters_controller.categories')
      })
      .prefix('/masters')

    router
      .group(() => {
        router.get('/home', '#controllers/user/home_controller.index')

        router
          .group(() => {
            router.get('/', '#controllers/user/profile_controller.show')
            router.put('/update', '#controllers/user/profile_controller.update')
            router.post('/avatar', '#controllers/user/profile_controller.updateAvatar')
            router.put('/change-password', '#controllers/user/profile_controller.changePassword')
            router.put('/language', '#controllers/user/profile_controller.updateLanguage')
            router.delete('/delete-account', '#controllers/user/profile_controller.deleteAccount')
          })
          .prefix('/profile')

        router
          .group(() => {
            router.get('/', '#controllers/user/vehicle_controller.index')
            router.post('/', '#controllers/user/vehicle_controller.store')
            router.put('/:id/set-default', '#controllers/user/vehicle_controller.setDefault')
            router.get('/:id', '#controllers/user/vehicle_controller.show')
            router.put('/:id', '#controllers/user/vehicle_controller.update')
            router.delete('/:id', '#controllers/user/vehicle_controller.destroy')
          })
          .prefix('/vehicles')

        router
          .group(() => {
            router.get('/', '#controllers/user/address_controller.index')
            router.post('/', '#controllers/user/address_controller.store')
            router.put('/:id/set-default', '#controllers/user/address_controller.setDefault')
            router.get('/:id', '#controllers/user/address_controller.show')
            router.put('/:id', '#controllers/user/address_controller.update')
            router.delete('/:id', '#controllers/user/address_controller.destroy')
          })
          .prefix('/addresses')

        router
          .group(() => {
            router.post('/', '#controllers/user/request_controller.store')
            router.get('/', '#controllers/user/request_controller.index')
            router.get('/:requestId/responses/:responseId', '#controllers/user/request_controller.showResponse')
            router.post(
              '/:requestId/responses/:responseId/accept',
              '#controllers/user/request_controller.acceptResponse'
            )
            router.get('/:requestId/responses', '#controllers/user/request_controller.responses')
            router.get('/:id', '#controllers/user/request_controller.show')
            router.delete('/:id', '#controllers/user/request_controller.cancel')
          })
          .prefix('/requests')

        router
          .group(() => {
            router.post('/', '#controllers/user/order_controller.store')
            router.get('/', '#controllers/user/order_controller.index')
            router.post('/:id/rate', '#controllers/user/order_controller.rate')
            router.get('/:id/additional-works', '#controllers/user/order_controller.additionalWorks')
            router.put(
              '/:id/additional-works/:workId/respond',
              '#controllers/user/order_controller.respondToAdditionalWork'
            )
            router.get('/:id', '#controllers/user/order_controller.show')
          })
          .prefix('/orders')

        router
          .group(() => {
            router.get('/', '#controllers/user/chat_controller.index')
            router.put('/:id/messages/read', '#controllers/user/chat_controller.markAsRead')
            router.post('/:id/messages', '#controllers/user/chat_controller.sendMessage')
            router.get('/:id', '#controllers/user/chat_controller.show')
          })
          .prefix('/chats')

        router
          .group(() => {
            router.get('/unread-count', '#controllers/user/notification_controller.unreadCount')
            router.get('/', '#controllers/user/notification_controller.index')
            router.put('/read-all', '#controllers/user/notification_controller.readAll')
            router.put('/:id/read', '#controllers/user/notification_controller.markAsRead')
            router.delete('/:id', '#controllers/user/notification_controller.destroy')
          })
          .prefix('/notifications')
      })
      .use([middleware.auth(), middleware.role({ role: 'user' })])
  })
  .prefix('/api/v1/user')
  .use(middleware.forceJsonResponse())
