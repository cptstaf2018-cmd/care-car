import { useState } from 'react'
import { CENTER_SPECIALTIES, DEFAULT_CENTER_SPECIALTY } from '../../constants/centerSpecialties'
import { authInputClass as inputClass } from './PasswordForms'

const IRAQI_MOBILE = /^(?:00964|964|0)?7\d{9}$/
const EASTERN_DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' }

const toWesternDigits = (value) => value.replace(/[٠-٩]/g, (d) => EASTERN_DIGITS[d])
const isIraqiMobile = (value) => IRAQI_MOBILE.test(toWesternDigits(value).replace(/\D/g, ''))

/** Second signup step after Google: the three things we need to run the center. */
export default function CenterOnboardingForm({ onSubmit, loading }) {
  const [centerName, setCenterName] = useState('')
  const [specialty, setSpecialty] = useState(DEFAULT_CENTER_SPECIALTY)
  const [whatsapp, setWhatsapp] = useState('')
  const [touched, setTouched] = useState(false)

  const phoneInvalid = touched && whatsapp && !isIraqiMobile(whatsapp)

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!centerName.trim() || !isIraqiMobile(whatsapp)) return
    onSubmit({ center_name: centerName.trim(), specialty, whatsapp: toWesternDigits(whatsapp) })
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

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-bold">شنو يشتغل مركزك؟</legend>
        <div className="grid grid-cols-2 gap-2">
          {CENTER_SPECIALTIES.map((item) => (
            <label
              key={item.value}
              className={`cursor-pointer rounded-2xl border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-oil ${
                specialty === item.value
                  ? 'border-petrol bg-petrol font-bold text-mint'
                  : 'border-mint-dim bg-white text-petrol-deep hover:border-gauge'
              }`}
            >
              <input
                type="radio"
                name="specialty"
                value={item.value}
                checked={specialty === item.value}
                onChange={() => setSpecialty(item.value)}
                className="sr-only"
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

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
        {loading ? 'جاري فتح الحساب…' : 'افتح حساب المركز'}
      </button>
    </form>
  )
}
