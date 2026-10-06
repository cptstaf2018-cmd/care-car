import { useState } from 'react'
import { activate, register } from '../../api/auth'
import { DEFAULT_CENTER_SPECIALTY } from '../../constants/centerSpecialties'
import { normalizeIraqiMobile } from '../../utils/iraqiPhone'
import { authInputClass as inputClass, ErrorNote } from './PasswordForms'
import SpecialtyPicker from './SpecialtyPicker'

const MIN_PASSWORD_LENGTH = 6
const CODE_LENGTH = 6
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const submitClass =
  'rounded-full bg-oil px-6 py-4 text-lg font-bold text-petrol-deep transition hover:bg-oil-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-oil/50 disabled:opacity-60'

const CHANNELS = {
  phone: { label: 'رقم الواتساب', placeholder: '07XX XXX XXXX', type: 'tel', dir: 'ltr', sentVia: 'واتساب' },
  email: { label: 'الإيميل', placeholder: 'name@example.com', type: 'email', dir: 'ltr', sentVia: 'الإيميل' },
}

/**
 * Sign up with a phone number (code arrives on WhatsApp) or an email (code arrives by mail).
 * Step 1 collects the center details, step 2 confirms the code and sets a password.
 */
export default function ContactSignup({ method, onActivated }) {
  const channel = CHANNELS[method]
  const [step, setStep] = useState('details')
  const [centerName, setCenterName] = useState('')
  const [specialty, setSpecialty] = useState(DEFAULT_CENTER_SPECIALTY)
  const [ownerName, setOwnerName] = useState('')
  const [contact, setContact] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const contactValue = method === 'phone' ? normalizeIraqiMobile(contact) : EMAIL_PATTERN.test(contact.trim()) ? contact.trim() : null

  const sendCode = async (e) => {
    e.preventDefault()
    setError('')
    if (!centerName.trim()) return setError('اكتب اسم المركز')
    if (!contactValue) {
      return setError(method === 'phone' ? 'الرقم لازم يكون عراقي ويبدي بـ 07، مثل 07801234567' : 'اكتب إيميل صحيح')
    }
    setLoading(true)
    try {
      const { data } = await register({
        center_name: centerName.trim(),
        specialty,
        manager_name: ownerName.trim() || null,
        phone: method === 'phone' ? contactValue : null,
        email: method === 'email' ? contactValue : null,
      })
      setAccountId(data.manager_email)
      setStep('code')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'ما كدرنا نرسل الكود. حاول مرة ثانية أو سجّل بحساب Google.')
    } finally {
      setLoading(false)
    }
  }

  const confirm = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`كلمة المرور ${MIN_PASSWORD_LENGTH} أحرف أو أكثر`)
    setLoading(true)
    try {
      const { data } = await activate(accountId, code, password)
      onActivated(data, { email: accountId })
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'الكود غلط أو انتهت صلاحيته')
      setLoading(false)
    }
  }

  if (step === 'code') {
    return (
      <form onSubmit={confirm} className="grid gap-4" noValidate>
        <p className="rounded-2xl bg-white p-4 text-sm leading-7 text-petrol-deep">
          أرسلنا كود من {CODE_LENGTH} أرقام على {channel.sentVia}{' '}
          <b dir="ltr" className="whitespace-nowrap">{contactValue}</b>. اكتبه هنا واختار كلمة مرور.
        </p>
        <ErrorNote>{error}</ErrorNote>
        <label className="grid gap-2">
          <span className="text-sm font-bold">الكود</span>
          <input
            className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            autoFocus
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-bold">كلمة المرور الجديدة</span>
          <input className={inputClass} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <span className="text-sm text-mint-ink">تدخل بيها بعدين بـ {method === 'phone' ? 'رقمك' : 'إيميلك'}.</span>
        </label>
        <button type="submit" disabled={loading || code.length < CODE_LENGTH} className={submitClass}>
          {loading ? 'جاري التفعيل…' : 'فعّل الحساب وادخل'}
        </button>
        <button type="button" onClick={() => { setStep('details'); setError('') }} className="justify-self-start text-sm font-bold text-petrol underline underline-offset-4">
          رجوع وغيّر {method === 'phone' ? 'الرقم' : 'الإيميل'}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={sendCode} className="grid gap-5" noValidate>
      <ErrorNote>{error}</ErrorNote>
      <label className="grid gap-2">
        <span className="text-sm font-bold">اسم المركز</span>
        <input className={inputClass} value={centerName} onChange={(e) => setCenterName(e.target.value)} placeholder="مثلاً: مركز الخليج لتبديل الزيت" autoComplete="organization" required />
      </label>
      <SpecialtyPicker value={specialty} onChange={setSpecialty} />
      <label className="grid gap-2">
        <span className="text-sm font-bold">اسمك</span>
        <input className={inputClass} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="مثلاً: أحمد محمد" autoComplete="name" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-bold">{channel.label}</span>
        <input
          className={`${inputClass} text-left`}
          dir={channel.dir}
          type={channel.type}
          inputMode={method === 'phone' ? 'tel' : 'email'}
          autoComplete={method === 'phone' ? 'tel' : 'email'}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={channel.placeholder}
          required
        />
        <span className="text-sm text-mint-ink">نرسل عليه كود التفعيل. {method === 'phone' ? 'ومنه تطلع تذكيرات زبائنك.' : ''}</span>
      </label>
      <button type="submit" disabled={loading} className={submitClass}>
        {loading ? 'جاري إرسال الكود…' : 'أرسل لي كود التفعيل'}
      </button>
    </form>
  )
}
