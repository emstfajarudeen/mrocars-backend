import { Head } from '@inertiajs/react'
import { useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Input } from '~/components/ui/Input'
import { PageHeader } from '~/components/ui/PageHeader'
import { useToast } from '~/components/ui/Toast'
import { apiMutate } from '~/lib/mutate'
import { useState } from 'react'

type Props = {
  user: {
    id: number
    name: string
    email: string
  }
}

export default function Profile({ user }: Props) {
  const toast = useToast()
  const profileForm = useForm({ name: user.name })
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await apiMutate('PUT', '/profile/update', { name: profileForm.data.name })
      toast.success('Profile updated')
    } catch (err) {
      const error = err as { errors?: Record<string, string[]>; message?: string }
      if (error.errors?.name) profileForm.setError('name', error.errors.name[0])
      toast.error(error.message ?? 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordErrors({})
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors({ confirm_password: 'Passwords do not match' })
      return
    }
    setSavingPassword(true)
    try {
      await apiMutate('PUT', '/profile/change-password', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      })
      toast.success('Password changed')
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      const error = err as { errors?: Record<string, string[]>; message?: string }
      if (error.errors) {
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(error.errors)) mapped[k] = v[0]
        setPasswordErrors(mapped)
      }
      toast.error(error.message ?? 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <Head title="Profile" />
      <PageHeader title="Profile" description="Manage your admin account" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Edit Profile">
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text-secondary">Email</label>
              <Input value={user.email} disabled />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-secondary">Name</label>
              <Input
                value={profileForm.data.name}
                onChange={(e) => profileForm.setData('name', e.target.value)}
              />
              {profileForm.errors.name ? <p className="mt-1 text-xs text-danger">{profileForm.errors.name}</p> : null}
            </div>
            <Button type="submit" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save Changes'}</Button>
          </form>
        </Card>
        <Card title="Change Password">
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text-secondary">Current Password</label>
              <Input
                type="password"
                value={passwordForm.old_password}
                onChange={(e) => setPasswordForm((f) => ({ ...f, old_password: e.target.value }))}
              />
              {passwordErrors.old_password ? <p className="mt-1 text-xs text-danger">{passwordErrors.old_password}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-secondary">New Password</label>
              <Input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
              />
              {passwordErrors.new_password ? <p className="mt-1 text-xs text-danger">{passwordErrors.new_password}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-secondary">Confirm Password</label>
              <Input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirm_password: e.target.value }))}
              />
              {passwordErrors.confirm_password ? <p className="mt-1 text-xs text-danger">{passwordErrors.confirm_password}</p> : null}
            </div>
            <Button type="submit" disabled={savingPassword}>{savingPassword ? 'Updating…' : 'Update Password'}</Button>
          </form>
        </Card>
      </div>
    </>
  )
}
