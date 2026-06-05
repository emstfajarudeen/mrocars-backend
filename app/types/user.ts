export type UserRole = 'admin' | 'business' | 'user'

export type UserLanguage = 'en' | 'ar'

export interface AuthenticatedUser {
  id: number
  role: UserRole
}
