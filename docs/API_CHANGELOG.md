
## 2026-06-12

- **User > Auth > Register** `POST /api/v1/user/auth/register`: Removed `password_confirmation` and `language` fields from the request body — the validator no longer accepts them.
- **Business > Auth > Login** `POST /api/v1/business/auth/login`: `business_profile` in the response is now a fully-serialized object with nested `address.governorate` and `address.area` names (localized by user language) instead of a raw model serialize output.
- **Business > Profile > Get profile / Update profile / Update address** `GET|PUT /api/v1/business/profile`: `business_profile` response now uses a consistent serialized format with human-readable address fields.
- **Business > Profile > Update profile** `PUT /api/v1/business/profile/update`: Now accepts `email`, `phone_code`, and `phone_number` as optional updatable fields. Email must be unique.
- **Business > Requests > List requests** `GET /api/v1/business/requests`: Response shape changed — items now return localized flat fields (`category` as string, `vehicle` as object) instead of the old `serializeRequest()` structure.
- **Business > Requests > Get single request** `GET /api/v1/business/requests/:id`: Response `request` object now uses localized flat fields (same shape as list). Added `when_needed`, `scheduled_date/time`, location fields, `photos[]`, and `voice_note_url`.
- **Business > Requests > Respond to request** `POST /api/v1/business/requests/:requestId/respond`: Field renamed from `attachment` (single file) to `attachments[]` (multiple files). Submitting a response no longer sets the request status to `confirmed`.
- **Business > Requests > Update response** `PUT /api/v1/business/requests/:requestId/respond/:responseId`: Field renamed from `attachment` to `attachments[]` (replacing all previous files on save).
- **Business > Orders > Add additional work** `POST /api/v1/business/orders/:id/additional-works`: Field renamed from `attachment` to `attachments[]`. Response now returns `{ additional_work_id, order_id }` instead of the full `additional_work` object.
- **Business > Orders > Update additional work** `PUT /api/v1/business/orders/:id/additional-works/:workId`: Field renamed from `attachment` to `attachments[]`. Response now returns `{ additional_work_id, order_id }`.
- **Business > Orders > Update status** `PUT /api/v1/business/orders/:id/status`: Response now returns `{ order_id, request_id }` instead of the serialized order object.
- **Business > Home** `GET /api/v1/business/home`: `recent_requests` and `recent_orders` now return localized flat fields instead of the old generic serialized shape.
- **User > Requests > Accept response** `POST /api/v1/user/requests/:requestId/responses/:responseId/accept`: Precondition changed — request must now be in status `new` (previously required `confirmed`). Response now includes full request detail with `responses[]` array and `chat_id`.
- **User > Requests > Get single request** `GET /api/v1/user/requests/:id`: Response `request` object now includes full localized details plus a `responses[]` array with business info, rating, and attachments.
- **User > Requests > Get request responses** `GET /api/v1/user/requests/:requestId/responses`: Now internally delegates to `show()` — returns the same shape as Get single request (full request + responses array).
- **User > Requests > Get single response** `GET /api/v1/user/requests/:requestId/responses/:responseId`: Response object now includes `business` with `mobile_code`, `mobile_number`, and full `address` object.
- **User > Orders > List my orders** `GET /api/v1/user/orders`: Response now includes `counts: { all: number, categories: [{ id, name, count }] }` for category-filtered display.
- **Admin > Guests** `GET /api/v1/admin/guests` (**NEW**): New endpoint — returns a paginated list of guest users. Supports `page`, `limit`, `search`, `is_active` query params. Requires admin JWT.
- **Admin > Users > List users** `GET /api/v1/admin/users`: Now excludes guest users (null password / guest email pattern). Only registered users are returned.
