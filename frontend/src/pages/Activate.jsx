import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { activate } from '../api/auth'
import { useAuthStore } from '../store/auth'

export default function Activate() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore(s => s.login)
  const [form, setForm] = useState({ email: '', code: '', new_password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const resolveLoginId = (value) => {
    const trimmed = value.trim()
    if (!trimmed.includes('@') && /^[+\d][\d\s-]{6,}$/.test(trimmed)) {
      return `${trimmed.replace(/[\s-]/g, '')}@carecar.app`
    }
    return trimmed
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm_password) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }
    if (form.new_password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }
    setLoading(true)
    try {
      const res = await activate(resolveLoginId(form.email), form.code, form.new_password)
      const { access_token, role, tenant_id } = res.data
      storeLogin(access_token, { role, tenant_id })
      navigate(role === 'superadmin' ? '/admin' : '/center', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'حدث خطأ، تحقق من البيانات')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-cyan-700">care-car-saas</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">تفعيل الحساب</h1>
          <p className="mt-2 text-sm text-slate-500">أدخل الكود الذي وصلك عبر الواتساب وضع كلمة مرورك الجديدة</p>
        </div>

        <form onSubmit={handleSubmit} className="surface rounded-xl p-8 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الإيميل أو رقم الواتساب</label>
            <input
              type="text"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="manager@example.com أو 07xxxxxxxxx"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">كود التفعيل</label>
            <input
              type="text"
              required
              maxLength={6}
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })}
              placeholder="123456"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 text-center tracking-widest font-mono text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              required
              value={form.new_password}
              onChange={e => setForm({ ...form, new_password: e.target.value })}
              placeholder="8 أحرف على الأقل"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">تأكيد كلمة المرور</label>
            <input
              type="password"
              required
              value={form.confirm_password}
              onChange={e => setForm({ ...form, confirm_password: e.target.value })}
              placeholder="أعد كتابة كلمة المرور"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-950 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'جاري التفعيل...' : 'تفعيل الحساب'}
          </button>

          <p className="text-center text-sm text-slate-500">
            لديك حساب مفعل؟{' '}
            <a href="/login" className="text-cyan-600 hover:underline">تسجيل الدخول</a>
          </p>
        </form>
      </div>
    </div>
  )
}
