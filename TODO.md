# Project TODOs

- [ ] **Revert JWT Access Token Expiration**: The access token expiration (`tokenExpiresIn`) in `config/auth.ts` was temporarily changed from `15m` to `7d` for testing purposes. Remember to revert this back to `15m` before deploying to production!
- [ ] **Order Status Change History Tracking**: Implement status change logs/histories to track when and by whom order statuses were transitioned, so that the status timeline shows exact timestamps (e.g. creating an `order_status_histories` table or storing separate timestamps like `pending_at` and `delivered_at`).
