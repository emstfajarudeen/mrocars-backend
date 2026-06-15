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
import type { UserLanguage } from '#types/user'
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
  const row = await trx.from(table).select(column).orderBy('id', 'desc').forUpdate().first()

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

export async function resolveCategoryId(
  input: string | number | undefined
): Promise<number | null> {
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

export async function getBusinessRating(businessUserId: number) {
  const row = await OrderRating.query()
    .where('businessUserId', businessUserId)
    .avg('rating as avg')
    .count('* as total')

  const avg = row[0].$extras.avg
  const total = Number(row[0].$extras.total)

  return {
    rating_avg: avg !== null ? Math.round(Number(avg) * 10) / 10 : null,
    ratingAvg: avg !== null ? Math.round(Number(avg) * 10) / 10 : null,
    total_reviews: total,
    totalReviews: total,
  }
}

export async function getBusinessRatingsMap(businessUserIds: number[]) {
  if (businessUserIds.length === 0) {
    return new Map<number, { rating_avg: number | null, ratingAvg: number | null, total_reviews: number, totalReviews: number }>()
  }

  const rows = await OrderRating.query()
    .whereIn('businessUserId', businessUserIds)
    .groupBy('businessUserId')
    .select('businessUserId')
    .avg('rating as avg')
    .count('* as total')

  const ratingsMap = new Map<number, { rating_avg: number | null, ratingAvg: number | null, total_reviews: number, totalReviews: number }>()
  for (const row of rows) {
    const avg = row.$extras.avg
    const total = Number(row.$extras.total)
    ratingsMap.set(row.businessUserId, {
      rating_avg: avg !== null ? Math.round(Number(avg) * 10) / 10 : null,
      ratingAvg: avg !== null ? Math.round(Number(avg) * 10) / 10 : null,
      total_reviews: total,
      totalReviews: total,
    })
  }

  return ratingsMap
}

export function serializeUserBrief(user: User) {
  return {
    id: user.id,
    name: user.name,
    avatar_url: publicUrl(user.avatar),
    avatarUrl: publicUrl(user.avatar),
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

  const { carBrand, carModel, ...data } = vehicle.serialize()
  const photoUrls = (vehicle.photos || []).map((p) => publicUrl(p)).filter(Boolean)
  return {
    ...data,
    photo_url: photoUrls.length > 0 ? photoUrls[0] : null,
    photoUrl: photoUrls.length > 0 ? photoUrls[0] : null,
    photo_urls: photoUrls,
    photoUrls: photoUrls,
    brand: vehicle.carBrand?.name || null,
    model: vehicle.carModel?.name || null,
    car_brand: vehicle.carBrand ? serializeCarBrand(vehicle.carBrand) : null,
    carBrand: vehicle.carBrand ? serializeCarBrand(vehicle.carBrand) : null,
    car_model: vehicle.carModel ? vehicle.carModel.serialize() : null,
    carModel: vehicle.carModel ? vehicle.carModel.serialize() : null,
  }
}

export function serializeRequestAttachment(attachment: RequestAttachment) {
  return {
    ...attachment.serialize(),
    file_url: publicUrl(attachment.filePath),
    fileUrl: publicUrl(attachment.filePath),
  }
}

export function serializeRequest(
  request: Request,
  options?: { responsesCount?: number; hasResponded?: boolean }
) {
  const data = request.serialize()
  return {
    ...data,
    request_no: request.requestNo,
    requestNo: request.requestNo,
    spare_part_type: request.sparePartType,
    sparePartType: request.sparePartType,
    no_of_tyres: request.noOfTyres,
    noOfTyres: request.noOfTyres,
    when_needed: request.whenNeeded,
    whenNeeded: request.whenNeeded,
    scheduled_date: request.scheduledDate ? request.scheduledDate.toISODate() : null,
    scheduledDate: request.scheduledDate ? request.scheduledDate.toISODate() : null,
    scheduled_time: request.scheduledTime,
    scheduledTime: request.scheduledTime,
    pickup_location_name: request.pickupLocationName,
    pickupLocationName: request.pickupLocationName,
    pickup_latitude: request.pickupLatitude,
    pickupLatitude: request.pickupLatitude,
    pickup_longitude: request.pickupLongitude,
    pickupLongitude: request.pickupLongitude,
    delivery_location_name: request.deliveryLocationName,
    deliveryLocationName: request.deliveryLocationName,
    delivery_latitude: request.deliveryLatitude,
    deliveryLatitude: request.deliveryLatitude,
    delivery_longitude: request.deliveryLongitude,
    deliveryLongitude: request.deliveryLongitude,
    voice_note_url: publicUrl(request.voiceNote),
    voiceNoteUrl: publicUrl(request.voiceNote),
    created_at: request.createdAt ? request.createdAt.toISO() : null,
    createdAt: request.createdAt ? request.createdAt.toISO() : null,
    updated_at: request.updatedAt ? request.updatedAt.toISO() : null,
    updatedAt: request.updatedAt ? request.updatedAt.toISO() : null,
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

export function serializeBusinessProfile(profile: BusinessProfile, language: UserLanguage = 'en') {
  const data = profile.serialize()
  return {
    ...data,
    business_name: profile.businessName,
    businessName: profile.businessName,
    avatar_url: publicUrl(profile.avatar),
    avatarUrl: publicUrl(profile.avatar),
    governorate: profile.governorate
      ? language === 'ar'
        ? profile.governorate.nameAr
        : profile.governorate.nameEn
      : null,
    area: profile.area ? (language === 'ar' ? profile.area.nameAr : profile.area.nameEn) : null,
  }
}

export function serializeRequestResponse(
  response: RequestResponse,
  options?: { includeBusinessProfile?: boolean; language?: UserLanguage }
) {
  const data = response.serialize()
  const language = options?.language || 'en'
  const serialized: Record<string, unknown> = {
    ...data,
    response_no: response.responseNo,
    responseNo: response.responseNo,
    request_id: response.requestId,
    requestId: response.requestId,
    business_user_id: response.businessUserId,
    businessUserId: response.businessUserId,
    offer_validity_type: response.offerValidityType,
    offerValidityType: response.offerValidityType,
    offer_valid_until: response.offerValidUntil ? response.offerValidUntil.toISODate() : null,
    offerValidUntil: response.offerValidUntil ? response.offerValidUntil.toISODate() : null,
    attachment_urls: (response.attachments ?? []).map((p) => publicUrl(p)).filter(Boolean),
    business_user: response.businessUser ? serializeUserBrief(response.businessUser) : null,
  }

  if (options?.includeBusinessProfile && response.businessUser?.businessProfile) {
    serialized.business_profile = serializeBusinessProfile(
      response.businessUser.businessProfile,
      language
    )
  }

  return serialized
}

export async function enrichResponseWithRating(
  response: RequestResponse,
  includeBusinessProfile = false,
  language: UserLanguage = 'en'
) {
  const rating = await getBusinessRating(response.businessUserId)
  const serialized = serializeRequestResponse(response, { includeBusinessProfile, language })

  if (response.businessUser?.businessProfile) {
    const brief = serializeBusinessProfileBrief(response.businessUser.businessProfile, rating)
    serialized.business_profile = {
      ...((serialized.business_profile as Record<string, unknown>) || {}),
      ...brief,
    }
  }

  return serialized
}

export function serializeBusinessProfileBrief(
  profile: BusinessProfile,
  rating: Awaited<ReturnType<typeof getBusinessRating>>
) {
  return {
    business_name: profile.businessName,
    businessName: profile.businessName,
    avatar_url: publicUrl(profile.avatar),
    avatarUrl: publicUrl(profile.avatar),
    ...rating,
  }
}

export async function findOwnedRequest(userId: number, requestId: number) {
  return Request.query().where('id', requestId).where('userId', userId).first()
}

export function isRejectionMarker(response: RequestResponse): boolean {
  return response.status === 'rejected' && Number(response.price) === 0
}

export function applyRealOffersFilter<
  T extends { where: (column: string, operator: string, value: number) => T },
>(query: T): T {
  return query.where('price', '>', 0)
}

export function serializeDeliveryAddress(
  address: UserAddress | null,
  language: UserLanguage = 'en'
) {
  if (!address) {
    return null
  }

  return {
    ...address.serialize(),
    governorate: address.governorate
      ? language === 'ar'
        ? address.governorate.nameAr
        : address.governorate.nameEn
      : null,
    area: address.area ? (language === 'ar' ? address.area.nameAr : address.area.nameEn) : null,
  }
}

export function serializeBusinessProfileForOrder(
  profile: BusinessProfile | null,
  language: UserLanguage = 'en'
) {
  if (!profile) {
    return null
  }

  return {
    business_name: profile.businessName,
    avatar_url: publicUrl(profile.avatar),
    address: {
      governorate: profile.governorate
        ? language === 'ar'
          ? profile.governorate.nameAr
          : profile.governorate.nameEn
        : null,
      area: profile.area ? (language === 'ar' ? profile.area.nameAr : profile.area.nameEn) : null,
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
  const attachments = work.attachments || []
  return {
    ...work.serialize(),
    voice_note_url: publicUrl(work.voiceNote),
    attachments: attachments.map((p) => publicUrl(p)).filter(Boolean),
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
  options?: { includeTimeline?: boolean; includePayment?: boolean; language?: UserLanguage }
) {
  const language = options?.language || 'en'
  const data: Record<string, unknown> = {
    ...order.serialize(),
    request: order.request ? serializeRequest(order.request) : null,
    request_response: order.requestResponse
      ? serializeRequestResponse(order.requestResponse, { language })
      : null,
    user: order.user ? serializeUserBrief(order.user) : null,
    business_user: order.businessUser ? serializeUserBrief(order.businessUser) : null,
    business_profile: order.businessUser?.businessProfile
      ? serializeBusinessProfileForOrder(order.businessUser.businessProfile, language)
      : null,
    delivery_address: serializeDeliveryAddress(order.deliveryAddress ?? null, language),
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

export async function serializeUserOrder(order: Order, language: UserLanguage = 'en') {
  const rating = await getBusinessRating(order.businessUserId)

  const category = order.request?.category
    ? (language === 'ar' ? order.request.category.nameAr : order.request.category.nameEn)
    : null

  let vehicle = null
  if (order.request?.userVehicle) {
    vehicle = {
      id: order.request.userVehicle.id,
      brand: order.request.userVehicle.carBrand?.name || null,
      model: order.request.userVehicle.carModel?.name || null,
      year: order.request.userVehicle.year || null,
    }
  }

  let businessProfile = null
  const profile = order.businessUser?.businessProfile
  if (profile) {
    businessProfile = {
      id: order.businessUserId,
      business_name: profile.businessName,
      avatar: profile.avatar ? publicUrl(profile.avatar) : null,
      rating: rating.rating_avg,
      reviews_count: rating.total_reviews,
      phone_code: profile.phoneCode,
      phone_number: profile.phoneNumber,
      governorate: profile.governorate
        ? (language === 'ar' ? profile.governorate.nameAr : profile.governorate.nameEn)
        : null,
      area: profile.area ? (language === 'ar' ? profile.area.nameAr : profile.area.nameEn) : null,
      block: profile.block,
      street: profile.street,
      building_name: profile.buildingName,
      building_no: profile.buildingNo,
      floor_no: profile.floorNo,
      shop_no: profile.shopNo,
      latitude: profile.latitude ? Number(profile.latitude) : null,
      longitude: profile.longitude ? Number(profile.longitude) : null,
    }
  }

  const requestDetails = order.request
    ? {
        title: order.request.title,
        no_of_tyres: order.request.noOfTyres,
        status: order.request.status,
        when_needed: order.request.whenNeeded,
        scheduled_date: order.request.scheduledDate?.toISODate() ?? null,
        scheduled_time: order.request.scheduledTime,
        pickup_location_name: order.request.pickupLocationName,
        pickup_latitude: order.request.pickupLatitude,
        pickup_longitude: order.request.pickupLongitude,
        delivery_location_name: order.request.deliveryLocationName,
        delivery_latitude: order.request.deliveryLatitude,
        delivery_longitude: order.request.deliveryLongitude,
      }
    : null

  return {
    order_no: order.orderNo,
    request_no: order.request?.requestNo || null,
    category,
    vehicle,
    business_profile: businessProfile,
    total_amount: order.totalAmount,
    payment_method: order.paymentMethod,
    request_details: requestDetails,
    order_date: order.createdAt?.toISO() ?? null,
    service_fee: order.platformFee,
    delivery_fee: order.deliveryFee,
    additional_work_count: order.additionalWorks ? order.additionalWorks.length : 0,
    order_rating: order.rating?.serialize() ?? null,
  }
}

export async function serializeUserOrderList(
  order: Order,
  language: UserLanguage = 'en',
  ratingsMap?: Map<number, { rating_avg: number | null; total_reviews: number }>
) {
  const rating = ratingsMap?.get(order.businessUserId) ?? await getBusinessRating(order.businessUserId)

  const businessProfile = order.businessUser?.businessProfile
    ? {
        id: order.businessUserId,
        business_name: order.businessUser.businessProfile.businessName,
        avatar: order.businessUser.businessProfile.avatar
          ? publicUrl(order.businessUser.businessProfile.avatar)
          : null,
        rating: {
          rating_avg: rating.rating_avg,
          rating_count: rating.total_reviews,
        },
      }
    : null

  const vehicle = order.request?.userVehicle
    ? {
        id: order.request.userVehicle.id,
        brand: order.request.userVehicle.carBrand?.name || null,
        model: order.request.userVehicle.carModel?.name || null,
        year: order.request.userVehicle.year || null,
      }
    : null

  const category = order.request?.category
    ? (language === 'ar' ? order.request.category.nameAr : order.request.category.nameEn)
    : null

  const request = order.request
    ? {
        id: order.request.id,
        title: order.request.title,
        no_of_tyres: order.request.noOfTyres,
        description: order.request.description,
        vehicle,
        category,
      }
    : null

  return {
    business_profile: businessProfile,
    status: order.status,
    request,
    order_no: order.orderNo,
    additional_work_count: order.additionalWorks ? order.additionalWorks.length : 0,
  }
}


