import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'
import { ApiResponse } from '#helpers/response'

export default class SettingController {
  async show({ params, response }: HttpContext) {
    try {
      const { key } = params
      
      const settingEn = await Setting.query().where('key', `${key}_en`).first()
      const settingAr = await Setting.query().where('key', `${key}_ar`).first()
      const updatedAt = await Setting.query().where('key', `${key}_updated_at`).first()

      if (!settingEn && !settingAr) {
        const simpleSetting = await Setting.query().where('key', key).first()
        if (!simpleSetting) {
          return ApiResponse.error(response, 'Setting not found', undefined, 404)
        }
        return ApiResponse.success(response, { key: simpleSetting.key, value: simpleSetting.value })
      }

      return ApiResponse.success(response, {
        key,
        value_en: settingEn?.value ?? '',
        value_ar: settingAr?.value ?? '',
        last_updated: updatedAt?.value ?? '',
      })
    } catch {
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }
}
