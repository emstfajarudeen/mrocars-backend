import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import app from '@adonisjs/core/services/app'
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

  if (!file.validated) {
    file.sizeLimit = options.size
    file.allowedExtensions = options.extnames
    file.validate()
  }

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

  try {
    // Ensure the target directory exists (prevents ENOENT on first upload)
    const storagePath = app.makePath('storage', dirname(key))
    console.log('[storeFile] Creating dir:', storagePath)
    await mkdir(storagePath, { recursive: true })
    console.log('[storeFile] Moving file to:', key)
    await file.moveToDisk(key)
    console.log('[storeFile] Success:', key)
  } catch (err) {
    console.error('[storeFile] FAILED:', err)
    throw err
  }

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
