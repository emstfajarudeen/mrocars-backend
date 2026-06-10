# MROCars API Documentation

This document is generated from the AdonisJS route files, controllers, validators, serializers, and models in this codebase. URLs use `{BASE_URL}` as the deployment host, for example `https://api.example.com`.

## Common Conventions

### Response Envelope

All JSON API routes use the same response envelope.

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field_name": ["Error message"]
  }
}
```

Common errors:

| Status | Meaning |
| --- | --- |
| `401` | Missing/invalid token, wrong role, invalid credentials, invalid OTP/token |
| `404` | Requested resource does not exist or is not owned by the authenticated account |
| `422` | Validation failed or workflow rule failed |
| `429` | Password reset OTP requested too frequently |
| `500` | Unexpected server error |

### Auth Headers

Authenticated endpoints require:

| Header | Type | Required | Notes |
| --- | --- | --- | --- |
| `Authorization` | string | yes | `Bearer <access_token>` |
| `Content-Type` | string | yes | `application/json` for JSON requests; `multipart/form-data` for file upload endpoints |

### Pagination

Paginated list endpoints accept:

| Query param | Type | Required | Notes |
| --- | --- | --- | --- |
| `page` | number | no | Defaults to `1` |
| `limit` | number | no | Defaults to `20`, maximum `100` |

Paginated response data:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "data": [],
    "meta": {
      "total": 0,
      "per_page": 20,
      "current_page": 1,
      "last_page": 1
    }
  }
}
```

### Key Object Shapes

`user` includes `id`, `name`, `email`, `phone_code`, `phone_number`, `avatar`, `role`, `language`, `is_active`, `email_verified_at`, `created_at`, and `updated_at`. Passwords and refresh-token internals are not serialized.

`business_profile` includes `id`, `user_id`, `business_name`, `email`, `phone_code`, `phone_number`, `avatar`, location fields, bank fields except `iban` serialization, `is_approved`, and timestamps.

`request` includes request identifiers, user/category/vehicle references, description fields, voice/photo URLs, pickup/delivery fields, `status`, timestamps, optional `category`, `user_vehicle`, `user`, `attachments`, `responses_count`, and `has_responded`.

`response` for a business offer includes `id`, `response_no`, `request_id`, `business_user_id`, `notes`, `price`, `offer_validity_type`, `offer_valid_until`, `attachment_url`, `status`, timestamps, and optional business summary/profile/rating.

`order` includes `id`, `order_no`, request/response references, user/business references, pricing fields, `payment_method`, `payment_status`, `delivery_address_id`, `status`, timestamps, nested `request`, `request_response`, `user`, `business_user`, `business_profile`, `delivery_address`, `additional_works`, `order_rating`, `payment`, and sometimes `status_timeline`.

`chat message` includes `id`, `chat_id`, `sender_id`, `sender_type`, `message`, `voice_note_url`, `attachment_url`, `attachment_type`, `is_read`, and `created_at`.

## SHARED / COMMON APIs

Shared APIs are public lookup and supporting APIs used by both the User App and Business App. The codebase defines separate route prefixes for the two apps, but the master-data endpoints return the same shapes.

### Master Data: App Setup / Dropdowns

These APIs are called before or during onboarding, profile setup, vehicle setup, address setup, request creation, and filtering.

#### Get Governorates

`GET {BASE_URL}/api/v1/user/masters/governorates`  
`GET {BASE_URL}/api/v1/business/masters/governorates`

Description: Fetch active governorates for address/location dropdowns.

Auth: Public.

Request: No headers, params, or body required.

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "governorates": [{ "id": 1, "name_en": "Capital", "name_ar": "...", "is_active": true }]
  }
}
```

Key errors: `500`.

#### Get Areas By Governorate

`GET {BASE_URL}/api/v1/user/masters/governorates/:id/areas`  
`GET {BASE_URL}/api/v1/business/masters/governorates/:id/areas`

Description: Fetch active areas for a selected governorate.

Auth: Public.

Params:

| Param | Type | Required |
| --- | --- | --- |
| `id` | number | yes |

Response: `data.areas` array.

Key errors: `500`.

#### Get Car Brands

`GET {BASE_URL}/api/v1/user/masters/car-brands`  
`GET {BASE_URL}/api/v1/business/masters/car-brands`

Description: Fetch active car brands for vehicle setup and filters.

Auth: Public.

Response: `data.car_brands[]`, each with normal brand fields and `logo_url`.

Key errors: `500`.

#### Get Car Models By Brand

`GET {BASE_URL}/api/v1/user/masters/car-brands/:id/models`  
`GET {BASE_URL}/api/v1/business/masters/car-brands/:id/models`

Description: Fetch active car models for a selected car brand.

Auth: Public.

Params:

| Param | Type | Required |
| --- | --- | --- |
| `id` | number | yes |

Response: `data.car_models` array.

Key errors: `500`.

#### Get Categories

`GET {BASE_URL}/api/v1/user/masters/categories`  
`GET {BASE_URL}/api/v1/business/masters/categories`

Description: Fetch active service categories in configured sort order.

Auth: Public.

Response: `data.categories[]`, each with normal category fields and `image_url`.

Key errors: `500`.

### Shared File Upload Rules

File uploads are sent as `multipart/form-data`.

| Field | Used by | Rules |
| --- | --- | --- |
| `avatar` | user/business profile avatar | required on avatar endpoints; `jpg`, `jpeg`, `png`, `webp`; max `2mb` |
| `photo` | user vehicle photo | optional; `jpg`, `jpeg`, `png`, `webp`; max `2mb` |
| `photos` | user request photos | optional array; max 5 files; `jpg`, `jpeg`, `png`, `webp`; max `5mb` each |
| `voice_note` | request, chat, additional work | optional unless endpoint workflow requires content; `mp3`, `mp4`, `wav`, `m4a`; max `10mb` |
| `attachment` | chat | optional; `jpg`, `jpeg`, `png`, `pdf`, `doc`, `docx`; max `10mb` |
| `attachment` | business response | optional; `jpg`, `jpeg`, `png`, `pdf`; max `5mb` |
| `attachment` | additional work | optional; `jpg`, `jpeg`, `png`; max `5mb` |

Uploaded file URLs are returned as `/uploads/<stored_path>`.

# USER APP APIs

The User App flow starts with account creation or guest login, then profile, vehicle, and address setup. The user creates a service/spare-parts request, reviews business offers, accepts one, places an order, tracks status, handles additional work, chats with the selected business, receives notifications, and can rate delivered orders.

## Onboarding: Register -> Login -> Password Recovery -> Session

### Register

`POST {BASE_URL}/api/v1/user/auth/register`

Description: Creates a user account and immediately returns JWT tokens. Called during user signup.

Auth: Public.

Body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | trimmed |
| `email` | string | yes | valid email; must be unique |
| `phone_code` | string | yes | |
| `phone_number` | string | yes | |
| `password` | string | yes | min 8; must match confirmation |
| `password_confirmation` | string | yes | |
| `language` | enum | no | `en`, `ar`; default `en` |

Response: `data.user`, `data.access_token`, `data.refresh_token`.

Key errors: `422 Email already registered`, `422 Validation failed`, `500`.

### Login

`POST {BASE_URL}/api/v1/user/auth/login`

Description: Authenticates an active user and returns JWT tokens.

Auth: Public.

Body: `email` string required, `password` string required.

Response: `data.user`, `data.access_token`, `data.refresh_token`.

Key errors: `401 Invalid credentials`, `422 Validation failed`, `500`.

### Guest Login

`POST {BASE_URL}/api/v1/user/auth/guest-login`

Description: Creates a temporary guest user and returns JWT tokens. Guests can browse but cannot submit requests.

Auth: Public.

Body: none.

Response: `data.user`, `data.access_token`, `data.refresh_token`.

Key errors: `500`.

### Forgot Password

`POST {BASE_URL}/api/v1/user/auth/forgot-password`

Description: Sends a 6-digit OTP to the user's email for password reset.

Auth: Public.

Body: `email` string required.

Response: `data.message`.

Key errors: `404 User not found`, `429 Too many attempts. Please try again later.`, `422 Validation failed`, `500`.

### Verify OTP

`POST {BASE_URL}/api/v1/user/auth/verify-otp`

Description: Verifies password reset OTP and returns a reset token.

Auth: Public.

Body: `email` string required, `otp` string required fixed length 6.

Response: `data.reset_token`.

Key errors: `401 Invalid or expired OTP`, `422 Validation failed`, `500`.

### Reset Password

`POST {BASE_URL}/api/v1/user/auth/reset-password`

Description: Sets a new password after OTP verification.

Auth: Public.

Body:

| Field | Type | Required |
| --- | --- | --- |
| `email` | string | yes |
| `token` | string | yes |
| `password` | string | yes, min 8 |
| `password_confirmation` | string | yes |

Response: `data.message`.

Key errors: `401 Invalid or expired token`, `422 Validation failed`, `500`.

### Refresh Token

`POST {BASE_URL}/api/v1/user/auth/refresh-token`

Description: Exchanges a refresh token for a new access token.

Auth: Public.

Body: `refresh_token` string required.

Response: `data.access_token`.

Key errors: `401 Invalid refresh token`, `422 Validation failed`, `500`.

### Logout

`POST {BASE_URL}/api/v1/user/auth/logout`

Description: Revokes all refresh tokens for the current user.

Auth: JWT required, role `user`.

Headers: `Authorization: Bearer <access_token>`.

Response: `data.message`.

Key errors: `401 Unauthorized`.

## Profile Setup & Settings

### Get Profile

`GET {BASE_URL}/api/v1/user/profile`

Description: Fetches the current user's profile for account screens.

Auth: JWT required, role `user`.

Response: `data.user`.

Key errors: `401 Unauthorized`.

### Update Profile

`PUT {BASE_URL}/api/v1/user/profile/update`

Description: Updates profile fields, including optional email change and avatar upload. Use `multipart/form-data` if uploading an avatar.

Auth: JWT required, role `user`.

Body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | no | |
| `email` | string | no | Must be unique |
| `phone_code` | string | no | |
| `phone_number` | string | no | |
| `language` | enum | no | `en`, `ar` |
| `avatar` | file | no | `jpg`, `jpeg`, `png`, `webp`; max `2mb` |

Response: `data.user` (including `avatar_url`), `data.message`.

Key errors: `422 Validation failed`, `500`.

### [DEPRECATED] Update Avatar

`POST {BASE_URL}/api/v1/user/profile/avatar`

> [!WARNING]
> This endpoint is deprecated and has been removed. Use the `PUT /api/v1/user/profile/update` endpoint to upload avatars instead.

Key errors: `404 Not Found`.

### Change Password

`PUT {BASE_URL}/api/v1/user/profile/change-password`

Description: Changes password for a logged-in non-guest user.

Auth: JWT required, role `user`.

Body: `old_password` string required, `new_password` string required min 8, `new_password_confirmation` string required.

Response: `data.message`.

Key errors: `401 Invalid password`, `422 Validation failed`, `500`.

### Update Language

`PUT {BASE_URL}/api/v1/user/profile/language`

Description: Updates app language preference.

Auth: JWT required, role `user`.

Body: `language` enum required: `en`, `ar`.

Response: `data.language`, `data.message`.

Key errors: `422 Validation failed`, `500`.

### Delete Account

`DELETE {BASE_URL}/api/v1/user/profile/delete-account`

Description: Deletes the user account and revokes tokens.

Auth: JWT required, role `user`.

Response: `data.message`.

Key errors: `401 Unauthorized`.

## Vehicle Setup

### List Vehicles

`GET {BASE_URL}/api/v1/user/vehicles`

Description: Fetches the user's saved vehicles, showing the year, brand, model details, and multiple photos.

Auth: JWT required, role `user`.

Response: `data.vehicles[]` with `year`, `car_brand`, `car_model`, `photo_url` (main/first photo), and `photo_urls` (array of all photos) when available.

Key errors: `401 Unauthorized`.

### Add Vehicle

`POST {BASE_URL}/api/v1/user/vehicles`

Description: Adds a vehicle. The first vehicle becomes default automatically. Handles multiple photos.

Auth: JWT required, role `user`.

Body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `car_brand_id` | number | yes | |
| `car_model_id` | number | yes | |
| `year` | string | yes | |
| `registration_number` | string | no | |
| `vin_number` | string | no | |
| `photos` | file[] | no | Multiple vehicle photos |
| `photo` | file | no | Single vehicle photo (backward compatibility) |

Response: `data.vehicle`, `data.message`.

Key errors: `422 Validation failed`, `500`.

### Get Vehicle

`GET {BASE_URL}/api/v1/user/vehicles/:id`

Description: Opens a saved vehicle detail.

Auth: JWT required, role `user`.

Params: `id` number required.

Response: `data.vehicle` (includes `year`, `photo_urls`, etc.).

Key errors: `404 Vehicle not found`, `401 Unauthorized`.

### Update Vehicle

`PUT {BASE_URL}/api/v1/user/vehicles/:id`

Description: Updates a saved vehicle and optional photos.

Auth: JWT required, role `user`.

Params: `id` number required.

Body: same as add vehicle, all fields optional.

Response: `data.vehicle`, `data.message`.

Key errors: `404 Vehicle not found`, `422 Validation failed`, `500`.

### Set Default Vehicle

`PUT {BASE_URL}/api/v1/user/vehicles/:id/set-default`

Description: Marks one vehicle as default and clears default on the others.

Auth: JWT required, role `user`.

Response: `data.message`.

Key errors: `404 Vehicle not found`, `401 Unauthorized`.

### Delete Vehicle

`DELETE {BASE_URL}/api/v1/user/vehicles/:id`

Description: Deletes a saved vehicle; if it was default, another vehicle is promoted.

Auth: JWT required, role `user`.

Response: `data.message`.

Key errors: `404 Vehicle not found`, `401 Unauthorized`.

## Address Setup

### List Addresses

`GET {BASE_URL}/api/v1/user/addresses`

Description: Fetches saved delivery addresses.

Auth: JWT required, role `user`.

Response: `data.addresses[]` with `governorate` and `area`.

Key errors: `401 Unauthorized`.

### Add Address

`POST {BASE_URL}/api/v1/user/addresses`

Description: Adds a delivery address. The first address becomes default automatically.

Auth: JWT required, role `user`.

Body:

| Field | Type | Required |
| --- | --- | --- |
| `label` | string | yes |
| `governorate_id` | number | yes |
| `area_id` | number | yes |
| `block` | string | yes |
| `street` | string | yes |
| `property_type` | enum | yes: `house`, `building` |
| `house_no` | string | no |
| `building_name` | string | no |
| `building_no` | string | no |
| `floor_no` | string | no |
| `door_no` | string | no |
| `latitude` | number | no |
| `longitude` | number | no |

Response: `data.address`, `data.message`.

Key errors: `422 Validation failed`, `500`.

### Get Address

`GET {BASE_URL}/api/v1/user/addresses/:id`

Description: Opens one saved address.

Auth: JWT required, role `user`.

Response: `data.address`.

Key errors: `404 Address not found`, `401 Unauthorized`.

### Update Address

`PUT {BASE_URL}/api/v1/user/addresses/:id`

Description: Updates a saved address.

Auth: JWT required, role `user`.

Body: same as add address, all fields optional.

Response: `data.address`, `data.message`.

Key errors: `404 Address not found`, `422 Validation failed`, `500`.

### Set Default Address

`PUT {BASE_URL}/api/v1/user/addresses/:id/set-default`

Description: Marks one address as default.

Auth: JWT required, role `user`.

Response: `data.message`.

Key errors: `404 Address not found`, `401 Unauthorized`.

### Delete Address

`DELETE {BASE_URL}/api/v1/user/addresses/:id`

Description: Deletes an address; if it was default, another address is promoted.

Auth: JWT required, role `user`.

Response: `data.message`.

Key errors: `404 Address not found`, `401 Unauthorized`.

## Core Request Flow: Create Request -> Review Offers -> Accept Offer

### Create Request

`POST {BASE_URL}/api/v1/user/requests`

Description: Submits a new service/spare-part request. Guest accounts receive `require_login: true`.

Auth: JWT required, role `user`; guest token is rejected for submission.

Body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `category_id` | number | yes | active category required |
| `user_vehicle_id` | number | no | must belong to user |
| `title` | string | yes | max 255 |
| `description` | string | no | |
| `spare_part_type` | string | no | |
| `no_of_tyres` | number | no | min 1 |
| `when_needed` | enum | no | `now`, `later` |
| `scheduled_date` | date | conditional | required when `when_needed` is `later` |
| `scheduled_time` | string | conditional | required when `when_needed` is `later` |
| `pickup_location_name` | string | no | |
| `pickup_latitude` | number | no | |
| `pickup_longitude` | number | no | |
| `delivery_location_name` | string | no | |
| `delivery_latitude` | number | no | |
| `delivery_longitude` | number | no | |
| `voice_note` | file | no | multipart |
| `photos` | file[] | no | multipart, max 5 |

Response: `201`, `data.request`, `data.message`.

Key errors: `401 Please login to submit a request` with `require_login: true`, `404 Category not found`, `404 Vehicle not found`, `422 Validation failed`, `500`.

### List My Requests

`GET {BASE_URL}/api/v1/user/requests`

Description: Shows the user's request history and current requests.

Auth: JWT required, role `user`.

Query:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `page` | number | no | |
| `limit` | number | no | |
| `status` | enum | no | `new`, `accepted`, `confirmed`, `rejected`, `cancelled` |
| `category_id` | number/string | no | id or slug-like category name |

Response: paginated `data.data[]` request list with `responses_count`.

Key errors: `404 Category not found`, `401 Unauthorized`.

### Get Request Detail

`GET {BASE_URL}/api/v1/user/requests/:id`

Description: Opens request detail with attachments and business offers.

Auth: JWT required, role `user`.

Query:
- `governorate_id` (number, optional) - Filter responses by governorate
- `area_id` (number, optional) - Filter responses by area

Response: `data.request`, including `responses[]` (filtered if query params are provided).

Key errors: `404 Request not found`, `401 Unauthorized`.

### Cancel Request

`DELETE {BASE_URL}/api/v1/user/requests/:id`

Description: Cancels a request only while it is still `new`.

Auth: JWT required, role `user`.

Response: `data.message`.

Key errors: `404 Request not found`, `422 Only new requests can be cancelled`, `401 Unauthorized`.

### List Offers For Request

`GET {BASE_URL}/api/v1/user/requests/:requestId/responses`

Description: Lists business offers for a request. Rejection markers and zero-price records are hidden.

Auth: JWT required, role `user`.

Query:
- `governorate_id` (number, optional) - Filter responses by governorate
- `area_id` (number, optional) - Filter responses by area

Response: `data.responses[]` (filtered if query params are provided).

Key errors: `404 Request not found`, `401 Unauthorized`.

### Get Offer Detail

`GET {BASE_URL}/api/v1/user/requests/:requestId/responses/:responseId`

Description: Opens one offer with business profile/rating details.

Auth: JWT required, role `user`.

Response: `data.response`.

Key errors: `404 Request not found`, `404 Response not found`, `401 Unauthorized`.

### Accept Offer

`POST {BASE_URL}/api/v1/user/requests/:requestId/responses/:responseId/accept`

Description: Accepts one business offer, rejects other offers, sets the request to `accepted`, and creates or reuses a chat.

Auth: JWT required, role `user`.

Response: `data.request`, `data.chat_id`, `data.message`.

Key errors: `404 Request not found`, `404 Response not found`, `422 Request must be confirmed before accepting an offer`, `401 Unauthorized`.

## Checkout & Orders

### Place Order

`POST {BASE_URL}/api/v1/user/orders`

Description: Creates an order from an accepted offer and delivery address. Payment is currently marked paid in code with a TODO for payment gateway integration.

Auth: JWT required, role `user`.

Body:

| Field | Type | Required |
| --- | --- | --- |
| `request_response_id` | number | yes |
| `delivery_address_id` | number | yes |
| `payment_method` | enum | yes: `knet`, `credit_card`, `apple_pay` |

Response: `201`, `data.order`, `data.message`.

Key errors: `404 Invalid or unavailable response`, `404 Delivery address not found`, `422 Order already exists for this response`, `422 Validation failed`, `500`.

### List Orders

`GET {BASE_URL}/api/v1/user/orders`

Description: Shows user's order history and active orders.

Auth: JWT required, role `user`.

Query: `page`, `limit`, optional `status` (`new`, `pending`, `delivered`, `cancelled`), optional `category_id`.

Response: paginated `data.data[]` order list.

Key errors: `404 Category not found`, `401 Unauthorized`.

### Get Order Detail

`GET {BASE_URL}/api/v1/user/orders/:id`

Description: Opens order detail with request, business, payment, delivery address, additional works, and rating.

Auth: JWT required, role `user`.

Response: `data.order`.

Key errors: `404 Order not found`, `401 Unauthorized`.

### Rate Order

`POST {BASE_URL}/api/v1/user/orders/:id/rate`

Description: Rates a delivered order once.

Auth: JWT required, role `user`.

Body: `rating` number required, min `1`, max `5`.

Response: `data.message`.

Key errors: `404 Order not found`, `422 Only delivered orders can be rated`, `422 Order already rated`, `422 Validation failed`, `500`.

### List Additional Works

`GET {BASE_URL}/api/v1/user/orders/:id/additional-works`

Description: Shows additional work requests raised by the business.

Auth: JWT required, role `user`.

Response: `data.additional_works[]`.

Key errors: `404 Order not found`, `401 Unauthorized`.

### Respond To Additional Work

`PUT {BASE_URL}/api/v1/user/orders/:id/additional-works/:workId/respond`

Description: Accepts or rejects pending additional work. Accepted work is currently marked paid in code.

Auth: JWT required, role `user`.

Body: `action` enum required: `accept`, `reject`.

Response: `data.additional_work`, `data.message`.

Key errors: `404 Order not found`, `404 Additional work not found`, `422 This work has already been responded to`, `422 Validation failed`, `500`.

## Chat

### List Chats

`GET {BASE_URL}/api/v1/user/chats`

Description: Shows chats with selected businesses, including last message and unread count.

Auth: JWT required, role `user`.

Response: `data.chats[]`.

Key errors: `401 Unauthorized`.

### Get Chat Detail

`GET {BASE_URL}/api/v1/user/chats/:id`

Description: Opens chat details and paginated messages; marks business messages as read.

Auth: JWT required, role `user`.

Query: `page`, `limit` where limit is capped at `30`.

Response: `data.chat`, `data.messages[]`, `data.meta`.

Key errors: `404 Chat not found`, `401 Unauthorized`.

### Send Message

`POST {BASE_URL}/api/v1/user/chats/:id/messages`

Description: Sends a text, voice, or attachment message to a business.

Auth: JWT required, role `user`.

Body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `message` | string | conditional | max 2000; at least one of `message`, `voice_note`, `attachment` required |
| `voice_note` | file | conditional | multipart |
| `attachment` | file | conditional | multipart |
| `attachment_type` | enum | no | `image`, `document`; inferred if omitted |

Response: `201`, `data.message` chat message object.

Key errors: `404 Chat not found`, `422 At least one of message, voice_note, or attachment is required`, `422 Validation failed`, `500`.

### Mark Chat Messages Read

`PUT {BASE_URL}/api/v1/user/chats/:id/messages/read`

Description: Marks business-sent messages in the chat as read.

Auth: JWT required, role `user`.

Response: `data.message`.

Key errors: `404 Chat not found`, `401 Unauthorized`.

## Notifications

### Get Unread Notification Count

`GET {BASE_URL}/api/v1/user/notifications/unread-count`

Description: Fetches unread notification count for badges.

Auth: JWT required, role `user`.

Response: `data.unread_count`.

Key errors: `401 Unauthorized`.

### List Notifications

`GET {BASE_URL}/api/v1/user/notifications`

Description: Lists notifications, newest first.

Auth: JWT required, role `user`.

Query: `page`, `limit`, optional `is_read` boolean (`true` or `false`).

Response: paginated notifications plus `data.unread_count`.

Key errors: `401 Unauthorized`.

### Mark All Notifications Read

`PUT {BASE_URL}/api/v1/user/notifications/read-all`

Description: Marks all unread notifications as read.

Auth: JWT required, role `user`.

Response: `data.message`.

Key errors: `401 Unauthorized`.

### Mark Notification Read

`PUT {BASE_URL}/api/v1/user/notifications/:id/read`

Description: Marks one notification as read.

Auth: JWT required, role `user`.

Response: `data.message`.

Key errors: `404 Notification not found`, `401 Unauthorized`.

### Delete Notification

`DELETE {BASE_URL}/api/v1/user/notifications/:id`

Description: Deletes one notification.

Auth: JWT required, role `user`.

Response: `data.message`.

Key errors: `404 Notification not found`, `401 Unauthorized`.

# BUSINESS APP APIs

The Business App flow starts with login and profile completion. A business browses available customer requests, sends or updates offers, rejects irrelevant requests, receives accepted-offer orders, progresses order status, submits additional work, chats with customers, and monitors notifications.

## Onboarding: Login -> Password Recovery -> Session

### Login

`POST {BASE_URL}/api/v1/business/auth/login`

Description: Authenticates an active business account and returns JWT tokens plus business profile.

Auth: Public.

Body: `email` string required, `password` string required.

Response: `data.user`, `data.business_profile`, `data.access_token`, `data.refresh_token`.

Key errors: `401 Invalid credentials`, `422 Validation failed`, `500`.

### Forgot Password

`POST {BASE_URL}/api/v1/business/auth/forgot-password`

Description: Sends a 6-digit OTP to a business email for password reset.

Auth: Public.

Body: `email` string required.

Response: `data.message`.

Key errors: `404 User not found`, `429 Too many attempts. Please try again later.`, `422 Validation failed`, `500`.

### Verify OTP

`POST {BASE_URL}/api/v1/business/auth/verify-otp`

Description: Verifies OTP and returns a reset token.

Auth: Public.

Body: `email` string required, `otp` string required fixed length 6.

Response: `data.reset_token`.

Key errors: `401 Invalid or expired OTP`, `422 Validation failed`, `500`.

### Reset Password

`POST {BASE_URL}/api/v1/business/auth/reset-password`

Description: Sets a new business password after OTP verification.

Auth: Public.

Body: `email`, `token`, `password` min 8, `password_confirmation`.

Response: `data.message`.

Key errors: `401 Invalid or expired token`, `422 Validation failed`, `500`.

### Refresh Token

`POST {BASE_URL}/api/v1/business/auth/refresh-token`

Description: Exchanges a refresh token for a new access token.

Auth: Public.

Body: `refresh_token` string required.

Response: `data.access_token`.

Key errors: `401 Invalid refresh token`, `422 Validation failed`, `500`.

### Logout

`POST {BASE_URL}/api/v1/business/auth/logout`

Description: Revokes all refresh tokens for current business user.

Auth: JWT required, role `business`.

Response: `data.message`.

Key errors: `401 Unauthorized`.

## Business Profile Setup & Settings

### Get Profile

`GET {BASE_URL}/api/v1/business/profile`

Description: Fetches business user and business profile with governorate/area.

Auth: JWT required, role `business`.

Response: `data.user`, `data.business_profile`.

Key errors: `401 Unauthorized`.

### Update Profile

`PUT {BASE_URL}/api/v1/business/profile/update`

Description: Updates account name, business contact details, and optional avatar/logo. Use `multipart/form-data` if uploading an avatar.

Auth: JWT required, role `business`.

Body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | no | Account owner's name |
| `business_name` | string | no | |
| `email` | string | no | |
| `phone_code` | string | no | |
| `phone_number` | string | no | |
| `avatar` | file | no | `jpg`, `jpeg`, `png`, `webp`; max `2mb` |

Response: `data.user`, `data.business_profile` (including `avatar_url`), `data.message`.

Key errors: `422 Validation failed`, `500`.

### [DEPRECATED] Update Avatar

`POST {BASE_URL}/api/v1/business/profile/avatar`

> [!WARNING]
> This endpoint is deprecated and has been removed. Use the `PUT /api/v1/business/profile/update` endpoint to upload avatars/logos instead.

Key errors: `404 Not Found`, `422 Validation failed`, `500`.

### Update Address

`PUT {BASE_URL}/api/v1/business/profile/address`

Description: Updates business operating address.

Auth: JWT required, role `business`.

Body:

| Field | Type | Required |
| --- | --- | --- |
| `governorate_id` | number | no |
| `area_id` | number | no |
| `block` | string | no |
| `street` | string | no |
| `building_name` | string | no |
| `building_no` | string | no |
| `floor_no` | string | no |
| `shop_no` | string | no |
| `latitude` | number | no |
| `longitude` | number | no |

Response: `data.business_profile`, `data.message`.

Key errors: `422 Validation failed`, `500`.

### Update Bank Details

`PUT {BASE_URL}/api/v1/business/profile/bank-details`

Description: Saves payout bank details.

Auth: JWT required, role `business`.

Body:

| Field | Type | Required |
| --- | --- | --- |
| `bank_name` | string | yes |
| `account_name` | string | yes |
| `iban` | string | yes |

Response: `data.message`.

Key errors: `422 Validation failed`, `500`.

### Change Password

`PUT {BASE_URL}/api/v1/business/profile/change-password`

Description: Changes logged-in business password.

Auth: JWT required, role `business`.

Body: `old_password`, `new_password` min 8, `new_password_confirmation`.

Response: `data.message`.

Key errors: `401 Invalid password`, `422 Validation failed`, `500`.

### Update Language

`PUT {BASE_URL}/api/v1/business/profile/language`

Description: Updates app language preference.

Auth: JWT required, role `business`.

Body: `language` enum required: `en`, `ar`.

Response: `data.language`, `data.message`.

Key errors: `422 Validation failed`, `500`.

### Delete Account

`DELETE {BASE_URL}/api/v1/business/profile/delete-account`

Description: Deletes business account and revokes tokens.

Auth: JWT required, role `business`.

Response: `data.message`.

Key errors: `401 Unauthorized`.

## Request Marketplace: Browse Requests -> Send Offer -> Update/Reject

### List Available Requests

`GET {BASE_URL}/api/v1/business/requests`

Description: Shows active customer requests that the business has not rejected. Includes `has_responded` for the current business.

Auth: JWT required, role `business`.

Query:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `page` | number | no | |
| `limit` | number | no | |
| `status` | enum | no | request status |
| `category_id` | number/string | no | id or slug-like category name |
| `area_id` | number | no | applies location-related query when matching business profile area |

Response: paginated `data.data[]` request list.

Key errors: `404 Category not found`, `401 Unauthorized`.

### Get Request Detail

`GET {BASE_URL}/api/v1/business/requests/:id`

Description: Opens customer request detail and the business's existing offer if present.

Auth: JWT required, role `business`.

Response: `data.request`, `data.my_response`.

Key errors: `404 Request not found`, `401 Unauthorized`.

### Send Offer / Respond To Request

`POST {BASE_URL}/api/v1/business/requests/:requestId/respond`

Description: Sends a price offer for a `new` request, changes request status to `confirmed`, and notifies the user.

Auth: JWT required, role `business`.

Body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `notes` | string | no | |
| `price` | number | yes | min 0 |
| `offer_validity_type` | enum | yes | `date`, `open` |
| `offer_valid_until` | date | conditional | required when validity type is `date` |
| `attachment` | file | no | multipart |

Response: `201`, `data.response`, `data.message`.

Key errors: `404 Request not available for response`, `422 You have already responded to this request`, `422 Validation failed`, `500`.

### Update Offer

`PUT {BASE_URL}/api/v1/business/requests/:requestId/respond/:responseId`

Description: Updates a pending offer and optional attachment.

Auth: JWT required, role `business`.

Body:

| Field | Type | Required |
| --- | --- | --- |
| `notes` | string | no |
| `price` | number | no |
| `offer_validity_type` | enum | no: `date`, `open` |
| `offer_valid_until` | date | conditional |
| `attachment` | file | no |

Response: `data.response`, `data.message`.

Key errors: `404 Response not found`, `422 Only pending responses can be updated`, `422 Validation failed`, `500`.

### Reject Request

`PUT {BASE_URL}/api/v1/business/requests/:requestId/reject`

Description: Hides a request from the business by creating a zero-price rejected response marker.

Auth: JWT required, role `business`.

Response: `data.message`.

Key errors: `404 Request not found`, `422 You have already responded to this request`, `401 Unauthorized`.

## Orders: Receive Order -> Progress Status -> Additional Work

### List Orders

`GET {BASE_URL}/api/v1/business/orders`

Description: Shows orders assigned to the business. Supports filtering by status and category.

Auth: JWT required, role `business`.

Query:
- `page` (number, optional) - Page number for pagination
- `limit` (number, optional) - Items per page
- `status` (string, optional) - Filter by status (`new`, `pending`, `delivered`, `cancelled`)
- `category_id` (number/string, optional) - Filter by request category ID or category slug

Response: paginated `data.data[]` order list with customer phone details.

Key errors: `401 Unauthorized`, `404 Category not found`.

### Get Order Detail

`GET {BASE_URL}/api/v1/business/orders/:id`

Description: Opens order detail with request, customer, delivery address, additional works, rating, and status timeline.

Auth: JWT required, role `business`.

Response: `data.order`.

Key errors: `404 Order not found`, `401 Unauthorized`.

### Update Order Status

`PUT {BASE_URL}/api/v1/business/orders/:id/status`

Description: Progresses an order through the allowed flow: `new -> pending -> delivered`.

Auth: JWT required, role `business`.

Body: `status` enum required: `pending`, `delivered`.

Response: `data.order`, `data.message`.

Key errors: `404 Order not found`, `422 Cannot change status from <current> to <target>`, `422 Validation failed`, `500`.

### Add Additional Work

`POST {BASE_URL}/api/v1/business/orders/:id/additional-works`

Description: Requests additional paid work from the user while order is `new` or `pending`.

Auth: JWT required, role `business`.

Body:

| Field | Type | Required |
| --- | --- | --- |
| `notes` | string | no |
| `price` | number | yes |
| `voice_note` | file | no |
| `attachment` | file | no |

Response: `201`, `data.additional_work`, `data.message`.

Key errors: `404 Order not found`, `422 Additional work can only be added to new or pending orders`, `422 Validation failed`, `500`.

### List Additional Works

`GET {BASE_URL}/api/v1/business/orders/:id/additional-works`

Description: Lists additional work records for a business order.

Auth: JWT required, role `business`.

Response: `data.additional_works[]`.

Key errors: `404 Order not found`, `401 Unauthorized`.

### Update Additional Work

`PUT {BASE_URL}/api/v1/business/orders/:id/additional-works/:workId`

Description: Updates a pending additional work request.

Auth: JWT required, role `business`.

Body:

| Field | Type | Required |
| --- | --- | --- |
| `notes` | string | no |
| `price` | number | no |
| `voice_note` | file | no |
| `attachment` | file | no |

Response: `data.additional_work`, `data.message`.

Key errors: `404 Order not found`, `404 Additional work not found`, `422 Only pending works can be updated`, `422 Validation failed`, `500`.

## Chat

### List Chats

`GET {BASE_URL}/api/v1/business/chats`

Description: Shows chats with customers, including last message and unread count.

Auth: JWT required, role `business`.

Response: `data.chats[]`.

Key errors: `401 Unauthorized`.

### Get Chat Detail

`GET {BASE_URL}/api/v1/business/chats/:id`

Description: Opens chat details and paginated messages; marks user messages as read.

Auth: JWT required, role `business`.

Query: `page`, `limit` where limit is capped at `30`.

Response: `data.chat`, `data.messages[]`, `data.meta`.

Key errors: `404 Chat not found`, `401 Unauthorized`.

### Send Message

`POST {BASE_URL}/api/v1/business/chats/:id/messages`

Description: Sends a text, voice, or attachment message to a customer.

Auth: JWT required, role `business`.

Body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `message` | string | conditional | max 2000; at least one of `message`, `voice_note`, `attachment` required |
| `voice_note` | file | conditional | multipart |
| `attachment` | file | conditional | multipart |
| `attachment_type` | enum | no | `image`, `document`; inferred if omitted |

Response: `201`, `data.message` chat message object.

Key errors: `404 Chat not found`, `422 At least one of message, voice_note, or attachment is required`, `422 Validation failed`, `500`.

### Mark Chat Messages Read

`PUT {BASE_URL}/api/v1/business/chats/:id/messages/read`

Description: Marks customer-sent messages in the chat as read.

Auth: JWT required, role `business`.

Response: `data.message`.

Key errors: `404 Chat not found`, `401 Unauthorized`.

## Notifications

### Get Unread Notification Count

`GET {BASE_URL}/api/v1/business/notifications/unread-count`

Description: Fetches unread notification count for badges.

Auth: JWT required, role `business`.

Response: `data.unread_count`.

Key errors: `401 Unauthorized`.

### List Notifications

`GET {BASE_URL}/api/v1/business/notifications`

Description: Lists business notifications, newest first.

Auth: JWT required, role `business`.

Query: `page`, `limit`, optional `is_read` boolean (`true` or `false`).

Response: paginated notifications plus `data.unread_count`.

Key errors: `401 Unauthorized`.

### Mark All Notifications Read

`PUT {BASE_URL}/api/v1/business/notifications/read-all`

Description: Marks all unread notifications as read.

Auth: JWT required, role `business`.

Response: `data.message`.

Key errors: `401 Unauthorized`.

### Mark Notification Read

`PUT {BASE_URL}/api/v1/business/notifications/:id/read`

Description: Marks one notification as read.

Auth: JWT required, role `business`.

Response: `data.message`.

Key errors: `404 Notification not found`, `401 Unauthorized`.

### Delete Notification

`DELETE {BASE_URL}/api/v1/business/notifications/:id`

Description: Deletes one notification.

Auth: JWT required, role `business`.

Response: `data.message`.

Key errors: `404 Notification not found`, `401 Unauthorized`.

# ADDED HOME PAGE APIs

These endpoints are consolidated app-home payloads. They do not replace the existing listing/detail APIs; they provide the screen-ready summaries needed by the User App and Business App home pages.

## USER APP HOME API

### Fetch User Home

`GET {BASE_URL}/api/v1/user/home`

Description: Fetches all data needed for the user app home page: active banners, default vehicle card, localized categories, and tab/badge counts.

Auth: JWT required, role `user`.

Headers:

| Header | Type | Required | Notes |
| --- | --- | --- | --- |
| `Authorization` | string | yes | `Bearer <access_token>` |

Request params/body: none.

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "banners": [
      {
        "id": 1,
        "title": "Enhanced Shock Absorption",
        "description": "Premium suspension parts for a smoother ride",
        "image_url": "/uploads/banners/banner.jpg"
      }
    ],
    "default_vehicle": {
      "id": 5,
      "car_brand_id": 1,
      "car_model_id": 10,
      "year": "2020",
      "registration_number": "12345",
      "vin_number": null,
      "is_default": true,
      "photo_url": "/uploads/vehicles/photo.jpg",
      "car_brand": {},
      "car_model": {}
    },
    "categories": [
      {
        "id": 1,
        "name": "Spare Parts",
        "description": "Find genuine & aftermarket parts",
        "image_url": "/uploads/categories/spare-parts.jpg"
      }
    ],
    "counts": {
      "new_requests_count": 4,
      "new_orders_count": 6,
      "unread_chats_count": 6,
      "unread_notifications_count": 4
    }
  }
}
```

Notes:

- `title`, `description`, category `name`, and category `description` are localized from the authenticated user's `language`.
- `default_vehicle` is `null` when the user has no default vehicle.
- Only active banners and active categories are returned.

Key errors: `401 Unauthorized`.

## BUSINESS APP HOME API

### Fetch Business Home

`GET {BASE_URL}/api/v1/business/home`

Description: Fetches all data needed for the business app home page: KPI cards, request/order status counts, recent request and order lists, and tab/badge counts.

Auth: JWT required, role `business`.

Headers:

| Header | Type | Required | Notes |
| --- | --- | --- | --- |
| `Authorization` | string | yes | `Bearer <access_token>` |

Query:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `request_status` | enum | no | Filters `recent_requests`; values: `new`, `accepted`, `confirmed`, `rejected`, `cancelled` |
| `order_status` | enum | no | Filters `recent_orders`; values: `new`, `pending`, `delivered`, `cancelled` |
| `limit` | number | no | Defaults to `5`; max `20` |

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "kpis": {
      "total_requests": 5,
      "total_orders": 3,
      "total_revenue": 755,
      "pending_amount": 55,
      "received_amount": 700,
      "received_this_month": 755,
      "total_received_this_month": 2,
      "total_orders_this_month": 3
    },
    "request_status_counts": {
      "new": 2,
      "accepted": 1,
      "confirmed": 1,
      "rejected": 0,
      "cancelled": 0
    },
    "order_status_counts": {
      "new": 1,
      "pending": 1,
      "delivered": 1,
      "cancelled": 0
    },
    "recent_requests": [],
    "recent_orders": [],
    "counts": {
      "new_requests_count": 2,
      "new_orders_count": 1,
      "unread_chats_count": 1,
      "unread_notifications_count": 1
    }
  }
}
```

Notes:

- `received_this_month` is the paid revenue amount for the current month.
- `total_received_this_month` is the count of paid orders this month.
- Revenue and order values are scoped to the authenticated business user.
- Recent request objects use the same request serializer as other request APIs.
- Recent order objects use the same order serializer as other order APIs.

Key errors: `401 Unauthorized`.

# ADDED ADMIN BANNER MANAGEMENT APIs

Banner management is available to authenticated admins through JSON APIs and the admin web page at `/admin/banners`.

## List Banners

`GET {BASE_URL}/api/v1/admin/banners`

Auth: JWT/web auth required, role `admin`.

Query: `page`, `limit`, optional `search`.

Response: paginated `data.data[]` banners, each including `image_url`.

## Create Banner

`POST {BASE_URL}/api/v1/admin/banners`

Auth: JWT/web auth required, role `admin`.

Body: multipart form-data.

| Field | Type | Required |
| --- | --- | --- |
| `title_en` | string | yes |
| `title_ar` | string | yes |
| `description_en` | string | no |
| `description_ar` | string | no |
| `sort_order` | number | no |
| `is_active` | boolean | no |
| `image` | file | yes |

Response: `201`, `data.banner`.

Key errors: `422 Validation failed`, `500`.

## Get Banner

`GET {BASE_URL}/api/v1/admin/banners/:id`

Auth: JWT/web auth required, role `admin`.

Response: `data.banner`.

Key errors: `404 Banner not found`.

## Update Banner

`PUT {BASE_URL}/api/v1/admin/banners/:id`

Auth: JWT/web auth required, role `admin`.

Body: same as create banner, but `image` is optional.

Response: `data.banner`.

Key errors: `404 Banner not found`, `422 Validation failed`, `500`.

## Delete Banner

`DELETE {BASE_URL}/api/v1/admin/banners/:id`

Auth: JWT/web auth required, role `admin`.

Response: success message.

Key errors: `404 Banner not found`.

## Toggle Banner Status

`PUT {BASE_URL}/api/v1/admin/banners/:id/toggle-status`

Auth: JWT/web auth required, role `admin`.

Response: `data.banner`.

Key errors: `404 Banner not found`.

## Reorder Banners

`PUT {BASE_URL}/api/v1/admin/banners/reorder`

Auth: JWT/web auth required, role `admin`.

Body:

```json
{
  "items": [
    { "id": 1, "sort_order": 1 },
    { "id": 2, "sort_order": 2 }
  ]
}
```

Response: `data.banners[]`.

Key errors: `422 Validation failed`, `500`.

# CATEGORY DESCRIPTION UPDATE

Category records now support:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `description_en` | string | no | English description |
| `description_ar` | string | no | Arabic description |

Existing category APIs continue to work and now include these fields in serialized category objects. User home returns a localized `description` field for each category.
