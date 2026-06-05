import { DateTime } from 'luxon'
import { basename } from 'node:path'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import Chat from '#models/chat'
import ChatMessage from '#models/chat_message'
import type { AttachmentType } from '#types/chat'
import { publicUrl, storeFile, validateFile } from '#helpers/upload'
import { serializeCategory } from '#helpers/masters'
import { serializeUserBrief, serializeUserVehicle } from '#helpers/request_helper'

export const VOICE_NOTE_OPTIONS = {
  size: '10mb' as const,
  extnames: ['mp3', 'mp4', 'wav', 'm4a'],
}

export const CHAT_ATTACHMENT_OPTIONS = {
  size: '10mb' as const,
  extnames: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
}

export function serializeLastMessagePreview(message: ChatMessage | null) {
  if (!message) {
    return null
  }

  return {
    id: message.id,
    message: message.message,
    has_voice_note: !!message.voiceNote,
    attachment_name: message.attachment ? basename(message.attachment) : null,
    attachment_type: message.attachmentType,
    created_at: message.createdAt,
  }
}

export function serializeChatMessage(message: ChatMessage, chat: Chat) {
  return {
    id: message.id,
    chat_id: message.chatId,
    sender_id: message.senderId,
    sender_type: message.senderId === chat.userId ? ('user' as const) : ('business' as const),
    message: message.message,
    voice_note_url: publicUrl(message.voiceNote),
    attachment_url: publicUrl(message.attachment),
    attachment_type: message.attachmentType,
    is_read: message.isRead,
    created_at: message.createdAt,
  }
}

export function serializeRequestBrief(chat: Chat) {
  if (!chat.request) {
    return null
  }

  return {
    title: chat.request.title,
    request_no: chat.request.requestNo,
    category: chat.request.category ? serializeCategory(chat.request.category) : null,
    user_vehicle: chat.request.userVehicle
      ? serializeUserVehicle(chat.request.userVehicle)
      : undefined,
  }
}

export function serializeUserChatListItem(
  chat: Chat,
  lastMessage: ChatMessage | null,
  unreadCount: number
) {
  return {
    ...chat.serialize(),
    business_user: chat.businessUser ? serializeUserBrief(chat.businessUser) : null,
    business_profile: chat.businessUser?.businessProfile
      ? { business_name: chat.businessUser.businessProfile.businessName }
      : null,
    request: serializeRequestBrief(chat),
    last_message: serializeLastMessagePreview(lastMessage),
    unread_count: unreadCount,
  }
}

export function serializeBusinessChatListItem(
  chat: Chat,
  lastMessage: ChatMessage | null,
  unreadCount: number
) {
  return {
    ...chat.serialize(),
    user: chat.user ? serializeUserBrief(chat.user) : null,
    request: serializeRequestBrief(chat),
    last_message: serializeLastMessagePreview(lastMessage),
    unread_count: unreadCount,
  }
}

export function serializeUserChatDetail(chat: Chat) {
  return {
    ...chat.serialize(),
    request: chat.request
      ? {
          ...serializeRequestBrief(chat),
          user_vehicle: chat.request.userVehicle
            ? serializeUserVehicle(chat.request.userVehicle)
            : null,
        }
      : null,
    business_user: chat.businessUser ? serializeUserBrief(chat.businessUser) : null,
    business_profile: chat.businessUser?.businessProfile
      ? { business_name: chat.businessUser.businessProfile.businessName }
      : null,
  }
}

export function serializeBusinessChatDetail(chat: Chat) {
  return {
    ...chat.serialize(),
    request: chat.request ? serializeRequestBrief(chat) : null,
    user: chat.user
      ? {
          ...serializeUserBrief(chat.user),
          phone_code: chat.user.phoneCode,
          phone_number: chat.user.phoneNumber,
        }
      : null,
  }
}

export async function findUserChat(userId: number, chatId: number) {
  return Chat.query().where('id', chatId).where('userId', userId).first()
}

export async function findBusinessChat(businessUserId: number, chatId: number) {
  return Chat.query().where('id', chatId).where('businessUserId', businessUserId).first()
}

export async function getUnreadCount(chatId: number, authUserId: number) {
  const result = await ChatMessage.query()
    .where('chatId', chatId)
    .whereNot('senderId', authUserId)
    .where('isRead', false)
    .count('* as total')

  return Number(result[0].$extras.total)
}

export async function getLastMessagesByChatIds(chatIds: number[]) {
  if (chatIds.length === 0) {
    return new Map<number, ChatMessage>()
  }

  const messages = await ChatMessage.query()
    .whereIn('chatId', chatIds)
    .orderBy('createdAt', 'desc')

  const map = new Map<number, ChatMessage>()
  for (const message of messages) {
    if (!map.has(message.chatId)) {
      map.set(message.chatId, message)
    }
  }

  return map
}

export async function markMessagesAsRead(chatId: number, senderId: number) {
  await ChatMessage.query()
    .where('chatId', chatId)
    .where('senderId', senderId)
    .where('isRead', false)
    .update({ isRead: true })
}

export async function ensureChatLastMessageAt(chat: Chat) {
  if (chat.lastMessageAt) {
    return
  }

  const latest = await ChatMessage.query()
    .where('chatId', chat.id)
    .orderBy('createdAt', 'desc')
    .first()

  chat.lastMessageAt = latest?.createdAt ?? DateTime.now()
  await chat.save()
}

export function validateMessageContent(
  message: string | undefined,
  voiceNote: MultipartFile | null,
  attachment: MultipartFile | null
): Record<string, string[]> | null {
  const hasText = !!message?.trim()
  const hasVoice = !!voiceNote
  const hasAttachment = !!attachment

  if (!hasText && !hasVoice && !hasAttachment) {
    return {
      message: ['At least one of message, voice_note, or attachment is required'],
    }
  }

  return null
}

export async function storeChatMessageFiles(
  chatId: number,
  voiceNote: MultipartFile | null,
  attachment: MultipartFile | null
) {
  let voiceNotePath: string | null = null
  let attachmentPath: string | null = null

  if (voiceNote) {
    voiceNotePath = await storeFile(voiceNote, `chats/voice-notes/${chatId}`)
  }

  if (attachment) {
    attachmentPath = await storeFile(attachment, `chats/attachments/${chatId}`)
  }

  return { voiceNotePath, attachmentPath }
}

export function inferAttachmentType(
  attachment: MultipartFile | null,
  explicitType?: AttachmentType
): AttachmentType | null {
  if (!attachment) {
    return null
  }

  if (explicitType) {
    return explicitType
  }

  const imageExtensions = ['jpg', 'jpeg', 'png']
  return imageExtensions.includes(attachment.extname ?? '') ? 'image' : 'document'
}

export function buildChatNotificationBody(
  message: string | null | undefined,
  hasVoiceNote: boolean,
  hasAttachment: boolean
): string {
  if (message?.trim()) {
    return message.trim()
  }
  if (hasVoiceNote) {
    return 'Sent a voice note'
  }
  if (hasAttachment) {
    return 'Sent an attachment'
  }
  return 'Sent a message'
}

export function validateChatFiles(
  voiceNote: MultipartFile | null,
  attachment: MultipartFile | null
): Record<string, string[]> | null {
  const voiceErrors = validateFile(voiceNote, 'voice_note', VOICE_NOTE_OPTIONS, false)
  if (voiceErrors) {
    return voiceErrors
  }

  const attachmentErrors = validateFile(
    attachment,
    'attachment',
    CHAT_ATTACHMENT_OPTIONS,
    false
  )
  if (attachmentErrors) {
    return attachmentErrors
  }

  return null
}
