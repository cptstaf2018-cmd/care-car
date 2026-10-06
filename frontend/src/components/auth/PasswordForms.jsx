import { useState } from 'react'
import { confirmPasswordReset, requestPasswordReset } from '../../api/auth'

export const authInputClass =
  'w-full rounded-2xl border border-mint-dim bg-white px-4 py-3.5 text-base text-petrol-deep placeholder:text-gauge focus:border-oil focus:outline-none focus:ring-2 focus:ring-oil/40'

const primaryButton =
  'w-full rounded-full bg-petrol px-6 py-3.5 font-bold text-mint transition hover:bg-petrol-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-oil/50 disabled:opacity-60'

export function ErrorNote({ children }) {
  if (!children) return null
  return <p role="alert" className="rounded-2xl bg-alert/10 px-4 py-3 text-sm font-bold text-alert">{children}</p>
}

/** Email-or-phone + password, for accounts created before Google sign-in and for staff. */
export function PasswordLoginForm({ onSubmit, loading, initialId = '', onForgot }) {
  const [loginId, setLoginId] = useState(initialId)
  const [password, setPassword] = useState('')

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(loginId, password)
      }}
    >
      <label className="grid gap-2">
        <span className="text-sm font-bold">الإيميل أو رقم الواتساب</span>
        <input className={authInputClass} value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" required />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-bold">كلمة المرور</span>
        <input className={authInputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
      <button type="button" onClick={() => onForgot(loginId)} className="justify-self-start text-sm font-bold text-petrol underline underline-offset-4">
        نسيت كلمة المرور؟
      </button>
      <button type="submit" disabled={loading} className={primaryButton}>
        {loading ? 'جاري الدخول…' : 'دخول'}
      </button>
    </form>
  )
}

/** Two steps: send a code to the account's email/WhatsApp, then set a new password with it. */
export function ForgotPasswordForm({ initialId = '', onDone, onBack }) {
  const [identifier, setIdentifier] = useState(initialId)
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async (action, fallback) => {
    setError('')
    setLoading(true)
    try {
      await action()
    } catch (err) {
      setError(err.response?.data?.detail || fallback)
    } finally {
      setLoading(false)
    }
  }

  const requestCode = (e) => {
    e.preventDefault()
    run(async () => {
      await requestPasswordReset(identifier)
      setSent(true)
    }, 'ما وصل الكود، حاول مرة ثانية')
  }

  const confirmReset = (e) => {
    e.preventDefault()
    if (newPassword !== confirm) {
      setError('كلمتا المرور مو متطابقتين')
      return
    }
    run(async () => {
      await confirmPasswordReset(identifier, code, newPassword)
      onDone(identifier)
    }, 'الكود غلط أو انتهت صلاحيته')
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">نغيّر كلمة المرور</h1>
      <ErrorNote>{error}</ErrorNote>
      {!sent ? (
        <form onSubmit={requestCode} className="grid gap-3">
          <p className="text-mint-ink">اكتب الإيميل أو رقم الواتساب المرتبط بحسابك، ونرسلك كود.</p>
          <input className={authInputClass} value={identifier} onChange={(e) => setIdentifier(e.target.value)} required aria-label="الإيميل أو رقم الواتساب" />
          <button type="submit" disabled={loading} className={primaryButton}>{loading ? 'جاري الإرسال…' : 'أرسل الكود'}</button>
        </form>
      ) : (
        <form onSubmit={confirmReset} className="grid gap-3">
          <p className="text-mint-ink">وصلك كود من 6 أرقام. اكتبه هنا مع كلمة المرور الجديدة.</p>
          <input
            className={`${authInputClass} text-center text-2xl tracking-[0.4em]`}
            dir="ltr"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            aria-label="الكود"
            required
          />
          <input className={authInputClass} type="password" placeholder="كلمة المرور الجديدة" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required />
          <input className={authInputClass} type="password" placeholder="أعدها مرة ثانية" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          <button type="submit" disabled={loading} className={primaryButton}>{loading ? 'جاري التغيير…' : 'غيّر كلمة المرور'}</button>
        </form>
      )}
      <button type="button" onClick={onBack} className="justify-self-start text-sm font-bold text-petrol underline underline-offset-4">
        رجوع للدخول
      </button>
    </div>
  )
}
