import { BaseSeeder } from '@adonisjs/lucid/seeders'
import hash from '@adonisjs/core/services/hash'
import Category from '#models/category'
import User from '#models/user'

export default class InitialDataSeeder extends BaseSeeder {
  async run() {
    await Category.updateOrCreateMany('nameEn', [
      { nameEn: 'Spare Parts', nameAr: 'قطع غيار', sortOrder: 0, isActive: true },
      { nameEn: 'Garage Services', nameAr: 'خدمات المرآب', sortOrder: 1, isActive: true },
      { nameEn: 'Tyres', nameAr: 'إطارات', sortOrder: 2, isActive: true },
      { nameEn: 'Winch', nameAr: 'ونش', sortOrder: 3, isActive: true },
    ])

    await User.updateOrCreate(
      { email: 'admin@mrocars.com' },
      {
        name: 'Admin',
        password: await hash.make('Admin@123'),
        role: 'admin',
        isActive: true,
      }
    )
  }
}
