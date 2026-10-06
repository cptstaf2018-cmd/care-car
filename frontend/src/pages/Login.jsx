import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mail, Smartphone } from 'lucide-react'
import { completeGoogleSignup, googleLogin, login } from '../api/auth'
import { useAuthStore } from '../store/auth'
import AuthShell from '../components/auth/AuthShell'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import ContactSignup from '../components/auth/ContactSignup'
import CenterOnboardingForm from '../components/auth/CenterOnboardingForm'
import { ErrorNote, ForgotPasswordForm, PasswordLoginForm } from '../components/auth/PasswordForms'
import { SUPPORT_WHATSAPP_DISPLAY, TRIAL_DAYS, whatsappLink } from '../constants/contact'

const TRIAL_ENDED_MESSAGE = 'انتهت تجربتك المجانية. كلّمنا على الواتساب حتى نفعّل اشتراكك.'

const SIGNUP_METHODS = [
  { id: 'google', label: 'Google', hint: 'الأسرع', icon: <GoogleMark /> },
  { id: 'phone', label: 'رقم الهاتف', hint: 'كود واتساب', icon: <Smartphone size={18} aria-hidden="true" /> },
  { id: 'email', label: 'الإيميل', hint: 'كود بالإيميل', icon: <Mail size={18} aria-hidden="true" /> },
]

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function loginErrorMessage(err) {
  const status = err.response?.status
  if (status === 402) return TRIAL_ENDED_MESSAGE
  if (status === 403) return 'هذا الحساب موقوف. كلّمنا على الواتساب.'
  if (status === 401) return null
  return 'ما كدرنا نتصل بالخادم. تأكد من الإنترنت وحاول مرة ثانية.'
}

function AuthTabs({ isRegister, onChange }) {
  const tab = (active) =>
    `flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil ${
      active ? 'bg-petrol text-mint' : 'text-petrol hover:bg-white'
    }`
  return (
    <div role="tablist" aria-label="نوع الدخول" className="mb-6 flex gap-1 rounded-full bg-mint-dim p-1">
      <button role="tab" aria-selected={isRegister} type="button" className={tab(isRegister)} onClick={() => onChange('register')}>
        حساب جديد
      </button>
      <button role="tab" aria-selected={!isRegister} type="button" className={tab(!isRegister)} onClick={() => onChange('login')}>
        تسجيل الدخول
      </button>
    </div>
  )
}

function MethodPicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="طريقة التسجيل" className="grid grid-cols-3 gap-2">
      {SIGNUP_METHODS.map((m) => {
        const selected = value === m.id
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(m.id)}
            className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil ${
              selected ? 'border-oil bg-petrol text-mint' : 'border-transparent bg-white text-petrol-deep hover:border-mint-dim'
            }`}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-petrol-deep">{m.icon}</span>
            <b className="text-sm">{m.label}</b>
            <span className={`text-[11px] ${selected ? 'text-gauge-light' : 'text-mint-ink'}`}>{m.hint}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.login)

  const [subMode, setSubMode] = useState(null) // 'forgot' | 'onboarding' on top of the route's mode
  const [method, setMethod] = useState('google')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastId, setLastId] = useState('')
  const [signup, setSignup] = useState(null) // { token, name, email } after Google, before onboarding

  const mode = subMode || (location.pathname === '/register' ? 'register' : 'login')

  const go = (nextMode) => {
    setError('')
    setNotice('')
    if (nextMode === 'login' || nextMode === 'register') {
      setSubMode(null)
      navigate(nextMode === 'register' ? '/register' : '/login')
    } else {
      setSubMode(nextMode)
    }
  }

  const enterApp = useCallback(
    (data, identity) => {
      setAuth(data.access_token, { ...identity, role: data.role, tenant_id: data.tenant_id })
      navigate(data.role === 'superadmin' ? '/admin' : '/center')
    },
    [navigate, setAuth],
  )

  const handleGoogle = useCallback(
    async (credential) => {
      setError('')
      setLoading(true)
      try {
        const { data } = await googleLogin(credential)
        if (data.status === 'logged_in') {
          enterApp(data, {})
          return
        }
        setSignup({ token: data.signup_token, name: data.name, email: data.email })
        setSubMode('onboarding')
      } catch (err) {
        setError(loginErrorMessage(err) || 'ما كدرنا نتحقق من حساب Google. حاول مرة ثانية.')
      } finally {
        setLoading(false)
      }
    },
    [enterApp],
  )

  const handleOnboarding = async (fields) => {
    setError('')
    setLoading(true)
    try {
      const { data } = await completeGoogleSignup({ signup_token: signup.token, ...fields })
      enterApp(data, { email: signup.email })
    } catch (err) {
      const detail = err.response?.data?.detail
      if (err.response?.status === 401) {
        setSignup(null)
        setSubMode(null)
        navigate('/register')
      }
      setError(typeof detail === 'string' ? detail : 'ما انفتح الحساب. حاول مرة ثانية.')
      setLoading(false)
    }
  }

  const handlePassword = async (loginId, password) => {
    setError('')
    setLoading(true)
    setLastId(loginId)
    try {
      const { data } = await login(loginId, password)
      enterApp(data, { login: loginId })
    } catch (err) {
      setError(loginErrorMessage(err) || 'الإيميل أو الرقم أو كلمة المرور غلط')
      setLoading(false)
    }
  }

  if (mode === 'onboarding' && signup) {
    return (
      <AuthShell>
        <h1 className="text-2xl font-bold">أهلاً {signup.name}، عرّفنا على مركزك</h1>
        <p className="mb-6 mt-2 text-mint-ink">ثلاث معلومات وتدخل النظام. تجربتك {TRIAL_DAYS} يوم تبدأ هسه.</p>
        <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>
        <CenterOnboardingForm onSubmit={handleOnboarding} loading={loading} />
      </AuthShell>
    )
  }

  if (mode === 'forgot') {
    return (
      <AuthShell>
        <ForgotPasswordForm
          initialId={lastId}
          onBack={() => go('login')}
          onDone={(id) => {
            setLastId(id)
            go('login')
            setNotice('تغيّرت كلمة المرور. ادخل بيها هسه.')
          }}
        />
      </AuthShell>
    )
  }

  const isRegister = mode === 'register'

  return (
    <AuthShell>
      <AuthTabs isRegister={isRegister} onChange={go} />

      <h1 className="text-2xl font-bold">{isRegister ? 'افتح حساب مركزك' : 'أهلاً بيك من جديد'}</h1>
      <p className="mb-6 mt-2 text-mint-ink">
        {isRegister ? `${TRIAL_DAYS} يوم مجاناً بكل الميزات. بدون دفع وبدون بطاقة.` : 'ادخل بحساب Google، أو بالرقم والإيميل وكلمة المرور.'}
      </p>

      <div className="grid gap-5">
        {notice && <p role="status" className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-petrol">{notice}</p>}
        {!(isRegister && method !== 'google') && <ErrorNote>{error}</ErrorNote>}
        {error === TRIAL_ENDED_MESSAGE && (
          <a
            href={whatsappLink('مرحبا، انتهت تجربتي بكير كار وأريد أفعّل الاشتراك')}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#25D366] px-5 py-3 text-center font-bold text-[#063]"
          >
            كلّمنا واتساب للتفعيل
          </a>
        )}

        {isRegister ? (
          <>
            <MethodPicker value={method} onChange={(m) => { setMethod(m); setError('') }} />
            {method === 'google' ? (
              <div className="grid gap-3">
                <GoogleSignInButton onCredential={handleGoogle} text="signup_with" disabled={loading} />
                <p className="text-center text-sm text-mint-ink">بعدها نسألك عن مركزك: اسمه، شنو يشتغل، ورقم واتسابه.</p>
              </div>
            ) : (
              <ContactSignup key={method} method={method} onActivated={enterApp} />
            )}
          </>
        ) : (
          <>
            <GoogleSignInButton onCredential={handleGoogle} text="signin_with" disabled={loading} />
            <div className="flex items-center gap-3 text-sm text-gauge" aria-hidden="true">
              <span className="h-px flex-1 bg-mint-dim" />أو<span className="h-px flex-1 bg-mint-dim" />
            </div>
            <PasswordLoginForm
              key={lastId}
              initialId={lastId}
              loading={loading}
              onSubmit={handlePassword}
              onForgot={(id) => {
                setLastId(id)
                go('forgot')
              }}
            />
          </>
        )}
      </div>

      <p className="mt-8 border-t border-mint-dim pt-5 text-sm text-mint-ink">
        تحتاج مساعدة؟{' '}
        <a
          className="font-bold text-petrol underline underline-offset-4"
          href={whatsappLink(isRegister ? 'مرحبا، أريد أسجّل مركزي بكير كار' : 'مرحبا، أحتاج مساعدة بالدخول لكير كار')}
          target="_blank"
          rel="noopener noreferrer"
        >
          كلّمنا واتساب <span dir="ltr">{SUPPORT_WHATSAPP_DISPLAY}</span>
        </a>
      </p>
    </AuthShell>
  )
}
