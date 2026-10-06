import { useEffect, useState } from 'react'
import { DEFAULT_CENTER_SPECIALTY } from '../../constants/centerSpecialties'
import { normalizeIraqiMobile } from '../../utils/iraqiPhone'
import { authInputClass as inputClass } from './PasswordForms'
import SpecialtyPicker from './SpecialtyPicker'

/** Second signup step after Google: the three things we need to run the center. */
export default function CenterOnboardingForm({ onSubmit, onProgress, loading }) {
  const [centerName, setCenterName] = useState('')
  const [specialty, setSpecialty] = useState(DEFAULT_CENTER_SPECIALTY)
  const [whatsapp, setWhatsapp] = useState('')
  const [touched, setTouched] = useState(false)

  const phone = normalizeIraqiMobile(whatsapp)
  const phoneInvalid = touched && whatsapp && !phone
  const completed = (centerName.trim() ? 1 : 0) + (phone ? 1 : 0)

  useEffect(() => {
    onProgress?.(completed)
  }, [completed, onProgress])

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!centerName.trim() || !phone) return
    onSubmit({ center_name: centerName.trim(), specialty, whatsapp: phone })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      <label className="grid gap-2">
        <span className="text-sm font-bold">اسم المركز</span>
        <input
          className={inputClass}
          value={centerName}
          onChange={(e) => setCenterName(e.target.value)}
          placeholder="مثلاً: مركز الخليج لتبديل الزيت"
          autoComplete="organization"
          required
        />
        {touched && !centerName.trim() && <span className="text-sm text-alert">اكتب اسم المركز</span>}
      </label>

      <SpecialtyPicker value={specialty} onChange={setSpecialty} />

      <label className="grid gap-2">
        <span className="text-sm font-bold">رقم الواتساب</span>
        <input
          className={`${inputClass} text-left`}
          dir="ltr"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="07XX XXX XXXX"
          required
        />
        <span className={`text-sm ${phoneInvalid ? 'text-alert' : 'text-mint-ink'}`}>
          {phoneInvalid ? 'الرقم لازم يكون عراقي ويبدي بـ 07، مثل 07801234567' : 'منه تطلع تذكيرات الزبائن، ومنه نتواصل وياك.'}
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-oil px-6 py-4 text-lg font-bold text-petrol-deep transition hover:bg-oil-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-oil/50 disabled:opacity-60"
      >
        {loading ? 'جاري الانطلاق…' : 'افتح الحساب وانطلق'}
      </button>
    </form>
  )
}
