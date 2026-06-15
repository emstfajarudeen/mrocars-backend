import { Head, Link, router } from '@inertiajs/react'
import { ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Input } from '~/components/ui/Input'
import { PageHeader } from '~/components/ui/PageHeader'
import { Select } from '~/components/ui/Select'
import { useToast } from '~/components/ui/Toast'
import { apiMutate } from '~/lib/mutate'
import { cn } from '~/lib/utils'

type Governorate = { id: number; nameEn: string; nameAr: string }
type Area = { id: number; governorateId: number; nameEn: string; nameAr: string }

type Props = {
  governorates: Governorate[]
  areas: Area[]
}

export default function BusinessCreate({ governorates = [], areas = [] }: Props) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'address' | 'bank'>('general')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone_code: '+965',
    phone_number: '',
    password: '',
    business_name: '',
    
    // Address Details
    address_label: '',
    governorate_id: '',
    area_id: '',
    block: '',
    street: '',
    building_name: '',
    building_no: '',
    floor_no: '',
    shop_no: '',
    latitude: '',
    longitude: '',

    // Bank Details
    bank_name: '',
    account_name: '',
    iban: '',
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatar(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    // General details are required
    if (!form.name || !form.email || !form.phone_code || !form.phone_number || !form.password || !form.business_name) {
      toast.error('Please fill in all General details')
      setActiveTab('general')
      return false
    }
    return true
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)

    const formData = new FormData()
    formData.append('name', form.name)
    formData.append('email', form.email)
    formData.append('phone_code', form.phone_code)
    formData.append('phone_number', form.phone_number)
    formData.append('password', form.password)
    formData.append('business_name', form.business_name)

    if (avatar) {
      formData.append('avatar', avatar)
    }

    if (form.address_label) formData.append('address_label', form.address_label)
    if (form.governorate_id) formData.append('governorate_id', form.governorate_id)
    if (form.area_id) formData.append('area_id', form.area_id)
    if (form.block) formData.append('block', form.block)
    if (form.street) formData.append('street', form.street)
    if (form.building_name) formData.append('building_name', form.building_name)
    if (form.building_no) formData.append('building_no', form.building_no)
    if (form.floor_no) formData.append('floor_no', form.floor_no)
    if (form.shop_no) formData.append('shop_no', form.shop_no)
    if (form.latitude) formData.append('latitude', form.latitude)
    if (form.longitude) formData.append('longitude', form.longitude)

    if (form.bank_name) formData.append('bank_name', form.bank_name)
    if (form.account_name) formData.append('account_name', form.account_name)
    if (form.iban) formData.append('iban', form.iban)

    try {
      await apiMutate('POST', '/businesses', formData)
      toast.success('Business created')
      router.visit('/admin/businesses')
    } catch (err) {
      toast.error('Failed', (err as { message?: string }).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head title="Add Business" />
      <Link href="/admin/businesses" className="mb-4 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader title="Add Business Account" />

      <div className="mb-6 flex gap-6 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={cn(
            'pb-3 text-sm font-semibold transition-colors border-b-2',
            activeTab === 'general' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          General Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('address')}
          className={cn(
            'pb-3 text-sm font-semibold transition-colors border-b-2',
            activeTab === 'address' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          Address Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bank')}
          className={cn(
            'pb-3 text-sm font-semibold transition-colors border-b-2',
            activeTab === 'bank' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          Bank Details
        </button>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <label className="block text-sm font-medium text-text-secondary">Avatar Image</label>
                <div className="relative group cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="h-24 w-24 rounded-full border-2 border-dashed border-border bg-bg-secondary flex items-center justify-center overflow-hidden relative transition-colors group-hover:border-accent">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="h-full w-full object-cover" alt="Preview" />
                    ) : (
                      <div className="text-text-muted flex flex-col items-center gap-1">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-xs">Upload</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Business Name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
              <Input label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Phone Code" value={form.phone_code} onChange={(e) => setForm({ ...form, phone_code: e.target.value })} required />
                <Input label="Phone Number" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} required />
              </div>
              <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
          )}

          {activeTab === 'address' && (
            <div className="space-y-4">
              <Input label="Address Label (e.g. Head Office)" value={form.address_label} onChange={(e) => setForm({ ...form, address_label: e.target.value })} />
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Governorate"
                  value={form.governorate_id}
                  onChange={(val) => setForm({ ...form, governorate_id: val, area_id: '' })}
                  options={governorates.map((g) => ({ value: String(g.id), label: g.nameEn }))}
                  placeholder="Select Governorate"
                />

                <Select
                  label="Area"
                  value={form.area_id}
                  onChange={(val) => setForm({ ...form, area_id: val })}
                  options={areas
                    .filter((a) => !form.governorate_id || a.governorateId === Number(form.governorate_id))
                    .map((a) => ({ value: String(a.id), label: a.nameEn }))}
                  placeholder="Select Area"
                  disabled={!form.governorate_id}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Block" value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} />
                <Input label="Street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Building Name" value={form.building_name} onChange={(e) => setForm({ ...form, building_name: e.target.value })} />
                <Input label="Building No" value={form.building_no} onChange={(e) => setForm({ ...form, building_no: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Floor No" value={form.floor_no} onChange={(e) => setForm({ ...form, floor_no: e.target.value })} />
                <Input label="Shop No" value={form.shop_no} onChange={(e) => setForm({ ...form, shop_no: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} type="number" step="any" />
                <Input label="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} type="number" step="any" />
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="space-y-4">
              <Input label="Bank Name" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
              <Input label="Account Name" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} />
              <Input label="IBAN" value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
            </div>
          )}

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            {activeTab !== 'general' && (
              <Button type="button" variant="outline" onClick={() => setActiveTab(activeTab === 'bank' ? 'address' : 'general')}>
                Previous
              </Button>
            )}
            {activeTab !== 'bank' ? (
              <Button type="button" onClick={() => setActiveTab(activeTab === 'general' ? 'address' : 'bank')}>
                Next
              </Button>
            ) : (
              <Button type="submit" loading={loading}>
                Create Business
              </Button>
            )}
          </div>
        </form>
      </Card>
    </>
  )
}
