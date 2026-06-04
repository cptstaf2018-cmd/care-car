import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Clock3, Lock, Mail, MessageCircle, Phone } from 'lucide-react'
import { activate, register } from '../api/auth'
import { useAuthStore } from '../store/auth'
import { CENTER_SPECIALTIES, DEFAULT_CENTER_SPECIALTY } from '../constants/centerSpecialties'

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.login)
  const [contactType, setContactType] = useState('phone')
  const [form, setForm] = useState({
    center_name: '',
    specialty: localStorage.getItem('register_specialty') || DEFAULT_CENTER_SPECIALTY,
    manager_name: '',
    email: '',
    phone: '',
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeForm, setCodeForm] = useState({ code: '', new_password: '', confirm_password: '' })
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    localStorage.setItem('register_specialty', form.specialty)
  }, [form.specialty])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await register({
        center_name: form.center_name.trim(),
        specialty: form.specialty,
        manager_name: form.manager_name.trim() || null,
        email: contactType === 'email' ? form.email.trim() : null,
        phone: contactType === 'phone' ? form.phone.trim() : null,
      })
      localStorage.removeItem('register_specialty')
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'حدث خطأ، تحقق من البيانات')
    } finally {
      setLoading(false)
    }
  }

  async function handleActivate(e) {
    e.preventDefault()
    setCodeError('')
    if (codeForm.new_password !== codeForm.confirm_password) {
      setCodeError('كلمتا المرور غير متطابقتين')
      return
    }
    setCodeLoading(true)
    try {
      const res = await activate(result.manager_email, codeForm.code, codeForm.new_password)
      setAuth(res.data.access_token, {
        email: result.manager_email,
        role: res.data.role,
        tenant_id: res.data.tenant_id,
      })
      navigate('/center')
    } catch (err) {
      setCodeError(err.response?.data?.detail || 'كود خاطئ أو منتهي')
      setCodeLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-5 py-8 text-white" dir="rtl">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-[560px] rounded-lg border border-white/15 bg-white/[0.08] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-8"
      >
        <div className="mb-7 flex items-start justify-between gap-4">
          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
            3 أيام مجاناً
          </span>
          <div className="text-left">
            <div className="mb-4 mr-auto flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-300 text-lg font-black text-slate-950 shadow-lg shadow-cyan-500/25">
              CC
            </div>
            <p className="text-xs font-black uppercase text-cyan-200">care-car-saas</p>
            <h1 className="mt-2 text-3xl font-black">إنشاء حساب جديد</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              سجّل مركزك وابدأ التجربة المجانية، لا حاجة لبطاقة.
            </p>
          </div>
        </div>

        {result ? (
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-bold leading-6 text-emerald-100">
              تم إرسال كود التفعيل. أدخل الكود الذي وصلك لإكمال الحساب.
            </div>

            <Input
              label="كود التفعيل"
              maxLength={6}
              placeholder="000000"
              value={codeForm.code}
              onChange={(value) => setCodeForm({ ...codeForm, code: value.replace(/\D/g, '') })}
              center
              required
            />
            <Input
              icon={Lock}
              label="كلمة المرور الجديدة"
              placeholder="أدخل كلمة مرور قوية"
              type="password"
              value={codeForm.new_password}
              onChange={(value) => setCodeForm({ ...codeForm, new_password: value })}
              required
            />
            <Input
              icon={Lock}
              label="تأكيد كلمة المرور"
              placeholder="أعد إدخال كلمة المرور"
              type="password"
              value={codeForm.confirm_password}
              onChange={(value) => setCodeForm({ ...codeForm, confirm_password: value })}
              required
            />

            {codeError && <ErrorText>{codeError}</ErrorText>}

            <PrimaryButton disabled={codeLoading || codeForm.code.length < 6}>
              {codeLoading ? 'جاري التفعيل...' : 'تفعيل وتسجيل الدخول'}
            </PrimaryButton>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="اسم المركز"
              placeholder="مركز الخليج لخدمات السيارات"
              value={form.center_name}
              onChange={(value) => update('center_name', value)}
              required
            />
            <div>
              <span className="mb-2 block text-sm font-bold text-slate-200">اختصاص المركز</span>
              <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/20 p-2 sm:grid-cols-2">
                {CENTER_SPECIALTIES.map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => update('specialty', item.value)}
                    className={`rounded-lg border px-3 py-2.5 text-right transition ${
                      form.specialty === item.value
                        ? 'border-cyan-300 bg-cyan-300/15 text-white shadow-lg shadow-cyan-950/20'
                        : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className="mt-1 block text-[11px] font-semibold leading-5 text-slate-400">{item.description}</span>
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="اسمك الكامل"
              placeholder="أحمد محمد"
              value={form.manager_name}
              onChange={(value) => update('manager_name', value)}
            />

            <div>
              <span className="mb-2 block text-sm font-bold text-slate-200">طريقة استلام كود التفعيل</span>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceButton active={contactType === 'phone'} icon={Phone} onClick={() => setContactType('phone')}>
                  واتساب
                </ChoiceButton>
                <ChoiceButton active={contactType === 'email'} icon={Mail} onClick={() => setContactType('email')}>
                  إيميل
                </ChoiceButton>
              </div>
            </div>

            {contactType === 'phone' ? (
              <Input
                label="رقم الواتساب"
                placeholder="07xxxxxxxxx"
                value={form.phone}
                onChange={(value) => update('phone', value)}
                required
              />
            ) : (
              <Input
                label="البريد الإلكتروني"
                placeholder="owner@example.com"
                type="email"
                value={form.email}
                onChange={(value) => update('email', value)}
                required
              />
            )}

            {error && <ErrorText>{error}</ErrorText>}

            <PrimaryButton disabled={loading}>
              {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب مجاناً'}
            </PrimaryButton>

            <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
              <TrustItem icon={CheckCircle2} label="بيانات معزولة" />
              <TrustItem icon={Clock3} label="تجربة مجانية" />
              <TrustItem icon={MessageCircle} label="واتساب جاهز" />
            </div>

            <p className="text-center text-sm text-slate-400">
              لديك حساب؟{' '}
              <Link to="/login" className="font-bold text-cyan-200 hover:text-cyan-100">
                تسجيل الدخول
              </Link>
            </p>
          </form>
        )}
      </motion.section>
    </main>
  )
}

function Input({ center = false, icon: Icon, label, onChange, type = 'text', value, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-200">{label}</span>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-lg border border-white/10 bg-slate-950/35 px-4 py-3.5 text-white shadow-inner shadow-black/20 outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/10 ${Icon ? 'pr-10' : ''} ${center ? 'text-center font-mono text-2xl tracking-[0.45em]' : ''}`}
          {...props}
        />
      </div>
    </label>
  )
}

function ChoiceButton({ active, children, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-bold transition ${
        active ? 'border-cyan-300 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20'
      }`}
    >
      <Icon size={16} />
      {children}
    </button>
  )
}

function PrimaryButton({ children, disabled }) {
  return (
    <motion.button
      type="submit"
      disabled={disabled}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3.5 text-sm font-black text-slate-950 shadow-[0_20px_54px_rgba(34,211,238,0.26)] transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60"
    >
      {children}
      {!disabled && <ArrowLeft size={16} />}
    </motion.button>
  )
}

function TrustItem({ icon: Icon, label }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-2">
      <Icon size={13} className="text-cyan-200" />
      <span className="font-semibold">{label}</span>
    </div>
  )
}

function ErrorText({ children }) {
  return (
    <p className="rounded-lg border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-sm font-bold leading-6 text-rose-100">
      {children}
    </p>
  )
}
