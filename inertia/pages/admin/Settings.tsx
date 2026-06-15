import { Head } from '@inertiajs/react'
import { useState } from 'react'
import { Card } from '~/components/ui/Card'
import { Input } from '~/components/ui/Input'
import { Button } from '~/components/ui/Button'
import { PageHeader } from '~/components/ui/PageHeader'
import { useToast } from '~/components/ui/Toast'
import { apiMutate, reloadPage } from '~/lib/mutate'
import { cn } from '~/lib/utils'

type Props = {
  settings: Record<string, string>
}

export default function Settings({ settings }: Props) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'user' | 'business' | 'global'>('user')

  const [form, setForm] = useState({
    user_privacy_policy_en: settings.user_privacy_policy_en ?? '',
    user_privacy_policy_ar: settings.user_privacy_policy_ar ?? '',
    user_terms_conditions_en: settings.user_terms_conditions_en ?? '',
    user_terms_conditions_ar: settings.user_terms_conditions_ar ?? '',
    business_privacy_policy_en: settings.business_privacy_policy_en ?? '',
    business_privacy_policy_ar: settings.business_privacy_policy_ar ?? '',
    business_terms_conditions_en: settings.business_terms_conditions_en ?? '',
    business_terms_conditions_ar: settings.business_terms_conditions_ar ?? '',
    whatsapp_number: settings.whatsapp_number ?? '',
  })

  const handleTextareaChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiMutate('POST', '/settings', form)
      toast.success('Settings updated successfully')
      reloadPage()
    } catch (err) {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head title="App Settings" />
      <PageHeader title="App Settings" description="Manage app texts, privacy policies, terms, and support info" />

      {/* Tabs */}
      <div className="mb-6 flex gap-6 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('user')}
          className={cn(
            'pb-3 text-sm font-semibold transition-colors border-b-2',
            activeTab === 'user' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          User Application
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('business')}
          className={cn(
            'pb-3 text-sm font-semibold transition-colors border-b-2',
            activeTab === 'business' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          Business Application
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('global')}
          className={cn(
            'pb-3 text-sm font-semibold transition-colors border-b-2',
            activeTab === 'global' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          Global & Support
        </button>
      </div>

      <form onSubmit={submit}>
        <Card>
          <div className="space-y-6">
            {activeTab === 'user' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-text-primary mb-1">User App - Privacy Policy</h3>
                  <p className="text-xs text-text-muted mb-4">
                    Set privacy policy statements in English and Arabic for the normal user application.
                    {settings.user_privacy_policy_updated_at && (
                      <span className="block mt-1 font-medium text-accent">
                        Last updated: {settings.user_privacy_policy_updated_at}
                      </span>
                    )}
                  </p>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-secondary">Privacy Policy (English)</label>
                      <textarea
                        value={form.user_privacy_policy_en}
                        onChange={(e) => handleTextareaChange('user_privacy_policy_en', e.target.value)}
                        rows={10}
                        className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="Privacy policy content in English..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-secondary text-right">سياسة الخصوصية (عربي)</label>
                      <textarea
                        value={form.user_privacy_policy_ar}
                        onChange={(e) => handleTextareaChange('user_privacy_policy_ar', e.target.value)}
                        rows={10}
                        dir="rtl"
                        className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-right"
                        placeholder="سياسة الخصوصية باللغة العربية..."
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                <div>
                  <h3 className="text-base font-semibold text-text-primary mb-1">User App - Terms & Conditions</h3>
                  <p className="text-xs text-text-muted mb-4">
                    Set terms and conditions in English and Arabic for the normal user application.
                    {settings.user_terms_conditions_updated_at && (
                      <span className="block mt-1 font-medium text-accent">
                        Last updated: {settings.user_terms_conditions_updated_at}
                      </span>
                    )}
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-secondary">Terms & Conditions (English)</label>
                      <textarea
                        value={form.user_terms_conditions_en}
                        onChange={(e) => handleTextareaChange('user_terms_conditions_en', e.target.value)}
                        rows={10}
                        className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="Terms and conditions in English..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-secondary text-right">الشروط والأحكام (عربي)</label>
                      <textarea
                        value={form.user_terms_conditions_ar}
                        onChange={(e) => handleTextareaChange('user_terms_conditions_ar', e.target.value)}
                        rows={10}
                        dir="rtl"
                        className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-right"
                        placeholder="الشروط والأحكام باللغة العربية..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-text-primary mb-1">Business App - Privacy Policy</h3>
                  <p className="text-xs text-text-muted mb-4">
                    Set privacy policy statements in English and Arabic for the partner/business application.
                    {settings.business_privacy_policy_updated_at && (
                      <span className="block mt-1 font-medium text-accent">
                        Last updated: {settings.business_privacy_policy_updated_at}
                      </span>
                    )}
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-secondary">Privacy Policy (English)</label>
                      <textarea
                        value={form.business_privacy_policy_en}
                        onChange={(e) => handleTextareaChange('business_privacy_policy_en', e.target.value)}
                        rows={10}
                        className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="Privacy policy content in English..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-secondary text-right">سياسة الخصوصية (عربي)</label>
                      <textarea
                        value={form.business_privacy_policy_ar}
                        onChange={(e) => handleTextareaChange('business_privacy_policy_ar', e.target.value)}
                        rows={10}
                        dir="rtl"
                        className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-right"
                        placeholder="سياسة الخصوصية باللغة العربية..."
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                <div>
                  <h3 className="text-base font-semibold text-text-primary mb-1">Business App - Terms & Conditions</h3>
                  <p className="text-xs text-text-muted mb-4">
                    Set terms and conditions in English and Arabic for the partner/business application.
                    {settings.business_terms_conditions_updated_at && (
                      <span className="block mt-1 font-medium text-accent">
                        Last updated: {settings.business_terms_conditions_updated_at}
                      </span>
                    )}
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-secondary">Terms & Conditions (English)</label>
                      <textarea
                        value={form.business_terms_conditions_en}
                        onChange={(e) => handleTextareaChange('business_terms_conditions_en', e.target.value)}
                        rows={10}
                        className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="Terms and conditions in English..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-secondary text-right">الشروط والأحكام (عربي)</label>
                      <textarea
                        value={form.business_terms_conditions_ar}
                        onChange={(e) => handleTextareaChange('business_terms_conditions_ar', e.target.value)}
                        rows={10}
                        dir="rtl"
                        className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-right"
                        placeholder="الشروط والأحكام باللغة العربية..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'global' && (
              <div className="space-y-6 max-w-lg">
                <div>
                  <h3 className="text-base font-semibold text-text-primary mb-1">WhatsApp Integration</h3>
                  <p className="text-xs text-text-muted mb-4">Set the WhatsApp number/link used across the user and business applications for quick support chat.</p>

                  <Input
                    label="WhatsApp Support Number (include country code)"
                    value={form.whatsapp_number}
                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    placeholder="e.g. +965 12345678"
                  />
                  <p className="text-xs text-text-muted mt-1.5">
                    Admins can write standard phone formats. The mobile applications will use this value to direct users to WhatsApp Web or app links.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-border pt-6 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </Card>
      </form>
    </>
  )
}
