import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Category from '#models/category'
import OrderRating from '#models/order_rating'
import Request from '#models/request'
import RequestAttachment from '#models/request_attachment'
import RequestResponse from '#models/request_response'
import User from '#models/user'
import UserVehicle from '#models/user_vehicle'
import type BusinessProfile from '#models/business_profile'
import Order from '#models/order'
import OrderAdditionalWork from '#models/order_additional_work'
import UserAddress from '#models/user_address'
import type { OrderStatus } from '#types/order'
import { publicUrl } from '#helpers/upload'
import { serializeCarBrand, serializeCategory } from '#helpers/masters'

function parseSequenceNumber(value: string | null | undefined, prefix: string): number {
  if (!value) return 0
  const match = value.match(new RegExp(`^${prefix}-(\\d+)$`))
  return match ? Number.parseInt(match[1], 10) : 0
}

function formatSequenceNumber(next: number, prefix: string): string {
  if (next < 1000) {
    return `${prefix}-${String(next).padStart(3, '0')}`
  }
  return `${prefix}-${next}`
}

async function nextSequenceNo(
  table: 'requests' | 'request_responses' | 'orders',
  column: 'request_no' | 'response_no' | 'order_no',
  prefix: 'REQ' | 'RES' | 'ORD',
  trx: TransactionClientContract
): Promise<string> {
  const row = await trx
    .from(table)
    .select(column)
    .orderBy('id', 'desc')
    .forUpdate()
    .first()

  const current = parseSequenceNumber(row?.[column] as string | undefined, prefix)
  return formatSequenceNumber(current + 1, prefix)
}

export async function generateRequestNo(trx: TransactionClientContract): Promise<string> {
  return nextSequenceNo('requests', 'request_no', 'REQ', trx)
}

export async function generateResponseNo(trx: TransactionClientContract): Promise<string> {
  return nextSequenceNo('request_responses', 'response_no', 'RES', trx)
}

export async function generateOrderNo(trx: TransactionClientContract): Promise<string> {
  return nextSequenceNo('orders', 'order_no', 'ORD', trx)
}

// TODO: make configurable from admin
export const DELIVERY_FEE = '2.000'
export const PLATFORM_FEE = '0.000'

export function categorySlug(nameEn: string): string {
  return nameEn.toLowerCase().replace(/\s+/g, '-')
}

export async function resolveCategoryId(input: string | number | undefined): Promise<number | null> {
  if (input === undefined || input === null || input === '') {
    return null
  }

  const asNumber = Number(input)
  if (!Number.isNaN(asNumber) && String(asNumber) === String(input).trim()) {
    const category = await Category.find(asNumber)
    return category?.id ?? null
  }

  const slug = String(input).toLowerCase().trim()
  const categories = await Category.query()
  const match = categories.find((category) => categorySlug(category.nameEn) === slug)
  return match?.id ?? null
}

export async function isGuestUser(userId: number): Promise<boolean> {
  const user = await User.query().where('id', userId).select('password', 'email').first()
  if (!user) {
    return true
  }
  return user.password === null
}

export async function getBusinessRating(businessUserId: number) {
  const row = await OrderRating.query()
    .where('businessUserId', businessUserId)
    .avg('rating as avg')
    .count('* as total')

  const avg = row[0].$extras.avg
  const total = Number(row[0].$extras.total)

  return {
    rating_avg: avg !== null ? Math.round(Number(avg) * 10) / 10 : null,
    total_reviews: total,
  }
}

export function serializeUserBrief(user: User) {
  return {
    id: user.id,
    name: user.name,
    avatar_url: publicUrl(user.avatar),
  }
}

export function serializeUserWithPhone(user: User) {
  return {
    ...serializeUserBrief(user),
    phone_code: user.phoneCode,
    phone_number: user.phoneNumber,
  }
}

export function serializeUserVehicle(vehicle: UserVehicle | null) {
  if (!vehicle) {
    return null
  }

  const data = vehicle.serialize()
  return {
    ...data,
    photo_url: publicUrl(vehicle.photo),
    car_brand: vehicle.carBrand ? serializeCarBrand(vehicle.carBrand) : null,
    car_model: vehicle.carModel ? vehicle.carModel.serialize() : null,
  }
}

export function serializeRequestAttachment(attachment: RequestAttachment) {
  return {
    ...attachment.serialize(),
    file_url: publicUrl(attachment.filePath),
  }
}

export function serializeRequest(
  request: Request,
  options?: { responsesCount?: number; hasResponded?: boolean }
) {
  const data = request.serialize()
  return {
    ...data,
    voice_note_url: publicUrl(request.voiceNote),
    category: request.category ? serializeCategory(request.category) : null,
    user_vehicle: serializeUserVehicle(request.userVehicle ?? null),
    user: request.user ? serializeUserBrief(request.user) : null,
    attachments: request.attachments
      ? request.attachments.map((attachment) => serializeRequestAttachment(attachment))
      : undefined,
    responses_count: options?.responsesCount,
    has_responded: options?.hasResponded,
  }
}

export function serializeRequestResponse(
  response: RequestResponse,
  options?: { includeBusinessProfile?: boolean }
) {
  const data = response.serialize()
  const serialized: Record<string, unknown> = {
    ...data,
    attachment_url: publicUrl(response.attachment),
    business_user: response.businessUser ? serializeUserBrief(response.businessUser) : null,
  }

  if (options?.includeBusinessProfile && response.businessUser?.businessProfile) {
    serialized.business_profile = {
      ...response.businessUser.businessProfile.serialize(),
      avatar_url: publicUrl(response.businessUser.businessProfile.avatar),
    }
  }

  return serialized
}

export async function enrichResponseWithRating(
  response: RequestResponse,
  includeBusinessProfile = false
) {
  const rating = await getBusinessRating(response.businessUserId)
  const serialized = serializeRequestResponse(response, { includeBusinessProfile })

  if (response.businessUser?.businessProfile) {
    serialized.business_profile = serializeBusinessProfileBrief(
      response.businessUser.businessProfile,
      rating
    )
  }

  return serialized
}

export function serializeBusinessProfileBrief(profile: BusinessProfile, rating: Awaited<ReturnType<typeof getBusinessRating>>) {
  return {
    business_name: profile.businessName,
    avatar_url: publicUrl(profile.avatar),
    ...rating,
  }
}

export async function findOwnedRequest(userId: number, requestId: number) {
  return Request.query().where('id', requestId).where('userId', userId).first()
}

export function isRejectionMarker(response: RequestResponse): boolean {
  return response.status === 'rejected' && Number(response.price) === 0
}

export function applyRealOffersFilter<T extends { where: (column: string, operator: string, value: number) => T }>(
  query: T
): T {
  return query.where('price', '>', 0)
}

export function serializeDeliveryAddress(address: UserAddress | null) {
  if (!address) {
    return null
  }

  return {
    ...address.serialize(),
    governorate: address.governorate?.serialize() ?? null,
    area: address.area?.serialize() ?? null,
  }
}

export function serializeBusinessProfileForOrder(profile: BusinessProfile | null) {
  if (!profile) {
    return null
  }

  return {
    business_name: profile.businessName,
    avatar_url: publicUrl(profile.avatar),
    address: {
      governorate: profile.governorate?.serialize() ?? null,
      area: profile.area?.serialize() ?? null,
      block: profile.block,
      street: profile.street,
      building_name: profile.buildingName,
      building_no: profile.buildingNo,
      floor_no: profile.floorNo,
      shop_no: profile.shopNo,
      latitude: profile.latitude,
      longitude: profile.longitude,
    },
    phone: {
      phone_code: profile.phoneCode,
      phone_number: profile.phoneNumber,
    },
    working_hours: null,
  }
}

export function serializeOrderAdditionalWork(work: OrderAdditionalWork) {
  return {
    ...work.serialize(),
    voice_note_url: publicUrl(work.voiceNote),
    attachment_url: publicUrl(work.attachment),
  }
}

export function buildPaymentBreakdown(order: Order) {
  return {
    parts_price: order.partsPrice,
    delivery_fee: order.deliveryFee,
    platform_fee: order.platformFee,
    total_amount: order.totalAmount,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
  }
}

export function buildOrderStatusTimeline(status: OrderStatus) {
  const steps: OrderStatus[] = ['new', 'pending', 'delivered']
  const currentIndex = steps.indexOf(status)

  return steps.map((step, index) => ({
    step,
    completed: status !== 'cancelled' && currentIndex >= index,
    current: step === status,
  }))
}

export function serializeOrder(
  order: Order,
  options?: { includeTimeline?: boolean; includePayment?: boolean }
) {
  const data: Record<string, unknown> = {
    ...order.serialize(),
    request: order.request ? serializeRequest(order.request) : null,
    request_response: order.requestResponse
      ? serializeRequestResponse(order.requestResponse)
      : null,
    user: order.user ? serializeUserBrief(order.user) : null,
    business_user: order.businessUser ? serializeUserBrief(order.businessUser) : null,
    business_profile: order.businessUser?.businessProfile
      ? serializeBusinessProfileForOrder(order.businessUser.businessProfile)
      : null,
    delivery_address: serializeDeliveryAddress(order.deliveryAddress ?? null),
    additional_works: order.additionalWorks
      ? order.additionalWorks.map((work) => serializeOrderAdditionalWork(work))
      : undefined,
    order_rating: order.rating?.serialize() ?? null,
  }

  if (options?.includePayment !== false) {
    data.payment = buildPaymentBreakdown(order)
  }

  if (options?.includeTimeline) {
    data.status_timeline = buildOrderStatusTimeline(order.status)
  }

  return data
}

export async function findOwnedOrder(userId: number, orderId: number) {
  return Order.query().where('id', orderId).where('userId', userId).first()
}

export async function findBusinessOrder(businessUserId: number, orderId: number) {
  return Order.query().where('id', orderId).where('businessUserId', businessUserId).first()
}
