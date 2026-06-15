import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'
import { ApiResponse } from '#helpers/response'
import { DateTime } from 'luxon'

export default class SettingController {
  async index({ inertia }: HttpContext) {
    const keys = [
      'user_privacy_policy_en',
      'user_privacy_policy_ar',
      'user_privacy_policy_updated_at',
      'user_terms_conditions_en',
      'user_terms_conditions_ar',
      'user_terms_conditions_updated_at',
      'business_privacy_policy_en',
      'business_privacy_policy_ar',
      'business_privacy_policy_updated_at',
      'business_terms_conditions_en',
      'business_terms_conditions_ar',
      'business_terms_conditions_updated_at',
      'whatsapp_number',
    ]

    const settingsRows = await Setting.query().whereIn('key', keys)
    const settings: Record<string, string> = {}
    
    for (const key of keys) {
      const row = settingsRows.find((r) => r.key === key)
      settings[key] = row?.value ?? ''
    }

    return inertia.render('admin/Settings', { settings })
  }

  async store({ request, response }: HttpContext) {
    try {
      const data = request.all() as Record<string, unknown>

      let userPrivacyChanged = false
      let userTermsChanged = false
      let businessPrivacyChanged = false
      let businessTermsChanged = false

      for (const [key, value] of Object.entries(data)) {
        if (typeof value !== 'string') continue
        if (key.endsWith('_updated_at')) continue

        const existing = await Setting.findBy('key', key)
        const isDifferent = !existing || existing.value !== value

        if (isDifferent) {
          await Setting.updateOrCreate(
            { key },
            { value }
          )

          if (key === 'user_privacy_policy_en' || key === 'user_privacy_policy_ar') {
            userPrivacyChanged = true
          } else if (key === 'user_terms_conditions_en' || key === 'user_terms_conditions_ar') {
            userTermsChanged = true
          } else if (key === 'business_privacy_policy_en' || key === 'business_privacy_policy_ar') {
            businessPrivacyChanged = true
          } else if (key === 'business_terms_conditions_en' || key === 'business_terms_conditions_ar') {
            businessTermsChanged = true
          }
        }
      }

      const nowFormatted = DateTime.now().toFormat('LLLL dd, yyyy') // e.g. June 15, 2026

      if (userPrivacyChanged) {
        await Setting.updateOrCreate({ key: 'user_privacy_policy_updated_at' }, { value: nowFormatted })
      }
      if (userTermsChanged) {
        await Setting.updateOrCreate({ key: 'user_terms_conditions_updated_at' }, { value: nowFormatted })
      }
      if (businessPrivacyChanged) {
        await Setting.updateOrCreate({ key: 'business_privacy_policy_updated_at' }, { value: nowFormatted })
      }
      if (businessTermsChanged) {
        await Setting.updateOrCreate({ key: 'business_terms_conditions_updated_at' }, { value: nowFormatted })
      }

      return ApiResponse.success(response, { message: 'Settings updated successfully' })
    } catch {
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }
}
