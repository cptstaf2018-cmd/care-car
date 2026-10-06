import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { completeGoogleSignup, googleLogin, login } from '../api/auth'
import { useAuthStore } from '../store/auth'
import AuthShell from '../components/auth/AuthShell'
import GoogleLoginPill from '../components/auth/GoogleLoginPill'
import CenterOnboardingForm from '../components/auth/CenterOnboardingForm'
import { ErrorNote, ForgotPasswordForm, PasswordLoginForm } from '../components/auth/PasswordForms'
import StartEngineButton from '../components/launch/StartEngineButton'
import useLaunch, { PHASE_RPM } from '../components/launch/useLaunch'
import { TRIAL_DAYS, whatsappLink } from '../constants/contact'

const TRIAL_ENDED_MESSAGE = 'انتهت تجربتك المجانية. كلّمنا على الواتساب حتى نفعّل اشتراكك.'
const CAR_GONE_PAUSE_MS = 250
const RPM_PER_FORM_STEP = 1.4
const STEP_RPM = { account: 1.5, details: 3, launch: 7.5 }

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
  const { phase, press, hold, release, msUntilGone } = useLaunch()

  const [subMode, setSubMode] = useState(null) // 'forgot' | 'onboarding' on top of the route's mode
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastId, setLastId] = useState('')
  const [signup, setSignup] = useState(null) // { token, name, email } after Google, before onboarding
  const [formStep, setFormStep] = useState(0) // onboarding fields completed, raises the idle revs

  const mode = subMode || (location.pathname === '/register' ? 'register' : 'login')
  const launching = phase === 'igniting' || phase === 'driving' || phase === 'away'
  const stepInfo = launching
    ? { step: 3, rpm: STEP_RPM.launch }
    : mode === 'onboarding'
      ? { step: 2, rpm: STEP_RPM.details + formStep * RPM_PER_FORM_STEP }
      : { step: 1, rpm: STEP_RPM.account }
  const shellProps = { ...stepInfo, phase, idleRpm: PHASE_RPM.parked + (mode === 'onboarding' ? formStep * RPM_PER_FORM_STEP : 0) }

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
      hold() // Google answered: keep the car gone while we verify
      try {
        const { data } = await googleLogin(credential)
        if (data.status === 'logged_in') {
          await wait(msUntilGone() + CAR_GONE_PAUSE_MS)
          enterApp(data, {})
          return
        }
        setSignup({ token: data.signup_token, name: data.name, email: data.email })
        setSubMode('onboarding')
        release() // new account: the car comes back for the next step
      } catch (err) {
        setError(loginErrorMessage(err) || 'ما كدرنا نتحقق من حساب Google. حاول مرة ثانية.')
        release()
      } finally {
        setLoading(false)
      }
    },
    [enterApp, hold, release, msUntilGone],
  )

  const handleOnboarding = async (fields) => {
    setError('')
    setLoading(true)
    press()
    try {
      const { data } = await completeGoogleSignup({ signup_token: signup.token, ...fields })
      hold()
      await wait(msUntilGone() + CAR_GONE_PAUSE_MS)
      enterApp(data, { email: signup.email })
    } catch (err) {
      const detail = err.response?.data?.detail
      if (err.response?.status === 401) {
        setSignup(null)
        setSubMode(null)
        navigate('/register')
      }
      setError(typeof detail === 'string' ? detail : 'ما انفتح الحساب. حاول مرة ثانية.')
      release()
      setLoading(false)
    }
  }

  const handlePassword = async (loginId, password) => {
    setError('')
    setLoading(true)
    press()
    try {
      const { data } = await login(loginId, password)
      hold()
      await wait(msUntilGone() + CAR_GONE_PAUSE_MS)
      enterApp(data, { login: loginId })
    } catch (err) {
      setError(loginErrorMessage(err) || 'الإيميل أو الرقم أو كلمة المرور غلط')
      release()
      setLoading(false)
    }
  }

  if (mode === 'onboarding' && signup) {
    return (
      <AuthShell
        {...shellProps}
        launch={<StartEngineButton mode="submit" formId="onboarding-form" phase={phase} disabled={loading} caption="اضغط وافتح حسابك وانطلق" onDark />}
      >
        <h1 className="text-2xl font-bold">أهلاً {signup.name}، عرّفنا على مركزك</h1>
        <p className="mb-6 mt-2 text-mint-ink">كل ما تكمّل معلومة يعلى دوران المحرك. وتجربتك {TRIAL_DAYS} يوم تبدأ لما تضغط START.</p>
        <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>
        <CenterOnboardingForm formId="onboarding-form" hideSubmit onSubmit={handleOnboarding} onProgress={setFormStep} loading={loading} />
      </AuthShell>
    )
  }

  if (mode === 'forgot') {
    return (
      <AuthShell {...shellProps}>
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

  const errorBlock = (
    <>
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
    </>
  )

  const launch = isRegister ? (
    <StartEngineButton phase={phase} onPress={press} onCredential={handleGoogle} disabled={loading} onDark />
  ) : (
    <StartEngineButton mode="submit" formId="password-login" phase={phase} disabled={loading} caption="اضغط للدخول" onDark />
  )

  return (
    <AuthShell {...shellProps} launch={launch}>
      <AuthTabs isRegister={isRegister} onChange={go} />

      <h1 className="text-2xl font-bold">{isRegister ? 'افتح حساب مركزك' : 'أهلاً بيك من جديد'}</h1>
      <p className="mb-5 mt-2 text-mint-ink">
        {isRegister ? `${TRIAL_DAYS} يوم مجاناً بكل الميزات. بدون دفع وبدون بطاقة.` : 'اكتب إيميلك أو رقمك وكلمة المرور، وبعدها اضغط START.'}
      </p>

      {isRegister ? (
        <>
          <div className="grid gap-5">
            {errorBlock}
            <p className="text-center text-sm text-mint-ink">بعدها نسألك عن مركزك: اسمه، شنو يشتغل، ورقم واتسابه.</p>
          </div>
        </>
      ) : (
        <div className="grid gap-5">
          {errorBlock}
          <PasswordLoginForm
            key={lastId}
            formId="password-login"
            hideSubmit
            initialId={lastId}
            loading={loading}
            onSubmit={handlePassword}
            onForgot={(id) => {
              setLastId(id)
              go('forgot')
            }}
          />
          <div className="flex items-center gap-3 text-sm text-gauge" aria-hidden="true">
            <span className="h-px flex-1 bg-mint-dim" />أو<span className="h-px flex-1 bg-mint-dim" />
          </div>
          <GoogleLoginPill onPress={press} onCredential={handleGoogle} disabled={loading} />
        </div>
      )}

    </AuthShell>
  )
}
