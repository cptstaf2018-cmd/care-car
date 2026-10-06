import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { completeGoogleSignup, googleLogin, login } from '../api/auth'
import { useAuthStore } from '../store/auth'
import AuthShell from '../components/auth/AuthShell'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import WhatsAppIcon from '../components/WhatsAppIcon'
import CenterOnboardingForm from '../components/auth/CenterOnboardingForm'
import { ErrorNote, ForgotPasswordForm, PasswordLoginForm } from '../components/auth/PasswordForms'
import { TRIAL_DAYS, whatsappLink } from '../constants/contact'

const TRIAL_ENDED_MESSAGE = 'انتهت تجربتك المجانية. كلّمنا على الواتساب حتى نفعّل اشتراكك.'

function loginErrorMessage(err) {
  const status = err.response?.status
  if (status === 402) return TRIAL_ENDED_MESSAGE
  if (status === 403) return 'هذا الحساب موقوف. كلّمنا على الواتساب.'
  if (status === 401) return null
  return 'ما كدرنا نتصل بالخادم. تأكد من الإنترنت وحاول مرة ثانية.'
}

function AuthTabs({ isRegister, onChange }) {
  const tab = (active) =>
    `flex-1 whitespace-nowrap rounded-full px-2 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil ${
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

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.login)

  const [subMode, setSubMode] = useState(null) // 'forgot' | 'onboarding' on top of the route's mode
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
        {isRegister ? `${TRIAL_DAYS} يوم مجاناً بكل الميزات. بدون دفع وبدون بطاقة.` : 'ادخل بحساب Google، أو بالإيميل أو الرقم وكلمة المرور.'}
      </p>

      <div className="grid gap-5">
        {notice && <p role="status" className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-petrol">{notice}</p>}
        <ErrorNote>{error}</ErrorNote>
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
          <div className="grid gap-3">
            <GoogleSignInButton onCredential={handleGoogle} label="سجّل بحساب Google" disabled={loading} />
            <p className="text-center text-sm text-mint-ink">بعدها نسألك عن مركزك: اسمه، شنو يشتغل، ورقم واتسابه.</p>
          </div>
        ) : (
          <>
            <GoogleSignInButton onCredential={handleGoogle} label="ادخل بحساب Google" disabled={loading} />
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

      <p className="mt-8 flex flex-wrap items-center gap-2 border-t border-mint-dim pt-5 text-sm text-mint-ink">
        تحتاج مساعدة؟
        <a
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-bold text-petrol-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil"
          href={whatsappLink(isRegister ? 'مرحبا، أريد أسجّل مركزي بكير كار' : 'مرحبا، أحتاج مساعدة بالدخول لكير كار')}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon size={18} />
          كلّمنا على واتساب
        </a>
      </p>
    </AuthShell>
  )
}
