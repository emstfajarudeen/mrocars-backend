import { randomUUID } from 'node:crypto'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import drive from '@adonisjs/drive/services/main'

const DEFAULT_IMAGE_OPTIONS = {
  size: '2mb' as const,
  extnames: ['jpg', 'jpeg', 'png', 'webp'],
}

export function validateFile(
  file: MultipartFile | null,
  fieldName: string,
  options: { size: string; extnames: string[] },
  required = false
): Record<string, string[]> | null {
  if (!file) {
    return required ? { [fieldName]: ['File is required'] } : null
  }

  file.sizeLimit = options.size
  file.allowedExtensions = options.extnames
  file.validate()

  if (!file.isValid) {
    return {
      [fieldName]: file.errors.map((error) => error.message),
    }
  }

  return null
}

export function validateImageFile(
  file: MultipartFile | null,
  fieldName = 'avatar',
  required = true
): Record<string, string[]> | null {
  return validateFile(file, fieldName, DEFAULT_IMAGE_OPTIONS, required)
}

export async function storeFile(file: MultipartFile, folder: string): Promise<string> {
  const fileName = `${randomUUID()}.${file.extname}`
  const key = `${folder}/${fileName}`
  await file.moveToDisk(key)
  return key
}

export async function deleteFileIfExists(path: string | null | undefined) {
  if (!path) {
    return
  }

  try {
    await drive.use().delete(path)
  } catch {
    // File may already be missing
  }
}

export function publicUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null
  }

  return `/uploads/${path}`
}
