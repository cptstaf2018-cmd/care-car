import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BarChart3, Camera, Car, CheckCircle2, Clock3, MessageCircle, ShieldCheck, Sparkles, Zap, Phone, Mail, Sun, Moon } from 'lucide-react'
import { activate, confirmPasswordReset, login, register, requestPasswordReset } from '../api/auth'
import { useAuthStore } from '../store/auth'
import { DEFAULT_CENTER_SPECIALTY } from '../constants/centerSpecialties'
import centerHero from '../assets/center-template-red.png'
import loginCar from '../assets/login-car-real.png'
import mobileHero from '../assets/center-hero-mobile.png'

const features = [
  { icon: Car, label: 'سيارات العملاء' },
  { icon: MessageCircle, label: 'حملات واتساب' },
  { icon: Camera, label: 'كاميرات المراكز' },
  { icon: BarChart3, label: 'تقارير تشغيلية' },
]

const serviceSpecialties = [
  { src: '/service-icons-3d/auto-pack/oil-can.webp', label: 'تبديل زيت' },
  { src: '/service-icons-3d/auto-pack/tire-sale-exact.webp', label: 'إطارات' },
  { src: '/service-icons-3d/auto-pack/battery.webp', label: 'كهرباء' },
  { src: '/service-icons-3d/auto-pack/car-wash-full-exact.webp', label: 'غسيل' },
  { src: '/service-icons-3d/auto-pack/service-wrench-car.webp', label: 'ميكانيك' },
  { src: '/service-icons-3d/auto-pack/ac-gas-exact.webp', label: 'تكييف' },
  { src: '/service-icons-3d/auto-pack/paint-spray.webp', label: 'صبغ' },
  { src: '/service-icons-3d/auto-pack/spark-plug.webp', label: 'قطع غيار' },
]

const trustStats = [
  { value: '+24K', label: 'تذكير خدمة' },
  { value: '99.9%', label: 'جاهزية تشغيل' },
  { value: '3x', label: 'عودة عملاء أفضل' },
]

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: 'easeOut' } },
}

const formVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40, transition: { duration: 0.25 } }),
}

export default function Login({ initialMode = 'login' }) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(initialMode)
  const [dir, setDir] = useState(1)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('loginTheme') || 'dark'
    } catch {
      return 'dark'
    }
  })
  const isLight = theme === 'light'

  useEffect(() => {
    try {
      localStorage.setItem('loginTheme', theme)
    } catch {
      // localStorage unavailable (e.g. test environment)
    }
  }, [theme])

  // Login state
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loginNotice, setLoginNotice] = useState('')
  const [launching, setLaunching] = useState(false)
  const [resetId, setResetId] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetForm, setResetForm] = useState({ code: '', new_password: '', confirm_password: '' })
  const [resetError, setResetError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  // Register state
  const [centerName, setCenterName] = useState('')
  const [fullName, setFullName] = useState('')
  const [contactMethod, setContactMethod] = useState('whatsapp')
  const [whatsapp, setWhatsapp] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')
  const [regResult, setRegResult] = useState(null)
  const [codeForm, setCodeForm] = useState({ code: '', new_password: '', confirm_password: '' })
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)

  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.login)

  useEffect(() => {
    const nextMode = initialMode === 'register' || location.pathname === '/register' || searchParams.get('mode') === 'register'
      ? 'register'
      : 'login'
    setMode(nextMode)
    setDir(nextMode === 'register' ? 1 : -1)
  }, [initialMode, location.pathname, searchParams])

  const switchMode = (newMode) => {
    setDir(newMode === 'register' ? 1 : -1)
    setMode(newMode)
    setError('')
    setLoginNotice('')
    setRegError('')
    setCodeError('')
    setResetError('')
    navigate(newMode === 'register' ? '/register' : '/login')
  }

  const openForgotPassword = () => {
    setDir(-1)
    setMode('forgot')
    setResetId(loginId)
    setError('')
    setLoginNotice('')
    setResetError('')
    setResetSent(false)
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLaunching(true)
    setLoginNotice('')
    try {
      const res = await login(loginId, password)
      window.setTimeout(() => {
        setAuth(res.data.access_token, { login: loginId, role: res.data.role, tenant_id: res.data.tenant_id })
        navigate(res.data.role === 'superadmin' ? '/admin' : '/')
      }, 760)
    } catch (err) {
      setLaunching(false)
      if (err.response?.status === 401) {
        setError('بيانات الدخول غير صحيحة')
      } else if (err.response?.status === 402) {
        setError('انتهت فترة الاشتراك — تواصل مع الدعم لتجديد اشتراكك')
      } else {
        setError('خطأ في الاتصال، حاول مجددًا')
      }
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setRegLoading(true)
    setRegError('')
    try {
      const res = await register({
        center_name: centerName,
        specialty: DEFAULT_CENTER_SPECIALTY,
        manager_name: fullName || null,
        phone: contactMethod === 'whatsapp' ? whatsapp : null,
        email: contactMethod === 'email' ? regEmail : null,
      })
      setRegResult(res.data)
    } catch (err) {
      const detail = err.response?.data?.detail
      setRegError(detail || 'تعذر إرسال كود التفعيل، حاول مجددًا')
    } finally {
      setRegLoading(false)
    }
  }

  const handleResetRequest = async (e) => {
    e.preventDefault()
    setResetLoading(true)
    setResetError('')
    try {
      await requestPasswordReset(resetId)
      setResetSent(true)
    } catch (err) {
      setResetError(err.response?.data?.detail || 'تعذر إرسال الكود، حاول مجددًا')
    } finally {
      setResetLoading(false)
    }
  }

  const handleResetConfirm = async (e) => {
    e.preventDefault()
    setResetError('')
    if (resetForm.new_password !== resetForm.confirm_password) {
      setResetError('كلمتا المرور غير متطابقتين')
      return
    }
    setResetLoading(true)
    try {
      await confirmPasswordReset(resetId, resetForm.code, resetForm.new_password)
      setPassword(resetForm.new_password)
      setLoginId(resetId)
      setResetForm({ code: '', new_password: '', confirm_password: '' })
      setResetSent(false)
      setMode('login')
      setLoginNotice('تم تغيير كلمة المرور. يمكنك الدخول الآن.')
    } catch (err) {
      setResetError(err.response?.data?.detail || 'كود إعادة التعيين غير صحيح أو منتهي')
    } finally {
      setResetLoading(false)
    }
  }

  const handleActivateSubmit = async (e) => {
    e.preventDefault()
    setCodeError('')
    if (codeForm.new_password !== codeForm.confirm_password) {
      setCodeError('كلمتا المرور غير متطابقتين')
      return
    }
    setCodeLoading(true)
    try {
      const res = await activate(regResult.manager_email, codeForm.code, codeForm.new_password)
        setAuth(res.data.access_token, {
          email: regResult.manager_email,
          role: res.data.role,
          tenant_id: res.data.tenant_id,
        })
        navigate('/center/onboarding')
    } catch (err) {
      setCodeError(err.response?.data?.detail || 'كود التفعيل غير صحيح أو منتهي')
      setCodeLoading(false)
    }
  }

  const cardClass = isLight
    ? 'overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-300/40'
    : 'overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-8 shadow-2xl shadow-black/40 backdrop-blur-2xl'
  const subtleClass = isLight ? 'text-xs text-slate-500' : 'text-xs text-slate-400'
  const tabWrapClass = isLight
    ? 'rounded-xl border border-slate-200 bg-slate-100 p-1'
    : 'rounded-xl border border-white/10 bg-slate-900/60 p-1'
  const inactiveTabClass = isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
  const labelClass = isLight ? 'mb-2 block text-sm font-bold text-slate-700' : 'mb-2 block text-sm font-bold text-slate-200'
  const descClass = isLight ? 'mb-5 text-sm leading-6 text-slate-600' : 'mb-5 text-sm leading-6 text-slate-300'
  const footerLinkClass = isLight ? 'mt-4 text-center text-sm text-slate-500' : 'mt-4 text-center text-sm text-slate-400'
  const inputClass = isLight
    ? 'w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 shadow-inner shadow-black/5 placeholder:text-slate-400 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30'
    : 'w-full rounded-lg border border-white/10 bg-slate-950/30 px-4 py-3.5 text-white shadow-inner shadow-black/20 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30'
  const codeInputClass = isLight
    ? 'w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-center font-mono text-2xl tracking-[0.45em] text-slate-900 shadow-inner shadow-black/5 placeholder:text-slate-400 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30'
    : 'w-full rounded-lg border border-white/10 bg-slate-950/30 px-4 py-3.5 text-center font-mono text-2xl tracking-[0.45em] text-white shadow-inner shadow-black/20 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30'
  const linkMutedClass = isLight ? 'text-slate-600 underline hover:text-slate-800' : 'text-slate-400 underline hover:text-slate-300'
  const trustItemClass = isLight
    ? 'flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-2'
    : 'flex items-center justify-center gap-1.5 rounded-md border border-white/8 bg-white/[0.04] px-2 py-2'

  return (
    <main className={isLight
      ? 'relative min-h-screen overflow-hidden bg-slate-50 text-right text-slate-900'
      : 'relative min-h-screen overflow-hidden bg-[#07111f] text-right text-white'}>
      <button
        type="button"
        onClick={() => setTheme(isLight ? 'dark' : 'light')}
        aria-label={isLight ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع النهاري'}
        className={`fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${
          isLight
            ? 'border-slate-200 bg-white/80 text-slate-700 hover:bg-white'
            : 'border-white/10 bg-slate-950/60 text-cyan-200 hover:bg-slate-900/70'
        }`}
      >
        {isLight ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>
      <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="grid min-h-screen lg:grid-cols-[0.98fr_1.02fr]">
        {/* Hero section */}
        <section className="relative hidden min-h-screen overflow-hidden lg:order-2 lg:block">
          <motion.img
            src={centerHero}
            alt="care-car-saas automotive service platform"
            initial={{ scale: 1.05, opacity: 0.72 }}
            animate={{ scale: 1, opacity: 0.66 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,31,0.26),rgba(7,17,31,0.72)_56%,rgba(7,17,31,0.96))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_42%,rgba(34,211,238,0.18),transparent_34%)]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#07111f] to-transparent" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-400 font-extrabold text-slate-950 shadow-xl shadow-cyan-500/25">CC</div>
              <div>
                <p className="text-xl font-extrabold">care-car-saas</p>
                <p className="text-xs font-semibold uppercase text-cyan-200">AI automotive ERP</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8 mt-10 grid w-fit grid-cols-4 gap-4">
              {serviceSpecialties.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.04 }}
                  className="flex w-28 flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-2 py-3.5 shadow-lg shadow-black/10 backdrop-blur-xl"
                >
                  <img src={item.src} alt="" className="h-10 w-10 object-contain" />
                  <span className="text-sm font-semibold text-slate-200">{item.label}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={cardVariants} initial="hidden" animate="show" className="max-w-2xl pb-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-4 py-2 text-sm font-bold shadow-lg shadow-cyan-950/20 backdrop-blur-xl">
                <Sparkles size={16} className="text-cyan-200" />
                منصة احترافية لإدارة مراكز خدمات السيارات
              </div>
              <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.14] tracking-normal xl:text-[62px]">
                منصة خدمات السيارات
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-200/90">
                إدارة الزبائن، السيارات، الفواتير، المخزون، التذكيرات التسويقية عبر واتساب، وربط الكاميرا من مكان واحد.
              </p>
              <div className="mt-7 grid max-w-xl grid-cols-3 gap-3">
                {trustStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.08 }}
                    className="rounded-lg border border-white/10 bg-white/[0.08] px-4 py-3 shadow-xl shadow-black/10 backdrop-blur-xl"
                  >
                    <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-300">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-5 grid max-w-2xl grid-cols-2 gap-3">
                {features.map((item, index) => <Feature key={item.label} {...item} delay={index * 0.06} />)}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Form section */}
        <section className="relative flex min-h-screen items-center justify-center px-5 py-8 lg:order-1 lg:px-10 xl:px-14">
          <div className="w-full max-w-[540px]">

            {/* Mobile hero */}
            <div className="mb-8 lg:hidden">
              <div className="relative mb-5 aspect-square w-full overflow-hidden rounded-lg border border-white/10 shadow-2xl shadow-black/30">
                <img src={mobileHero} alt="care-car-saas" className="h-full w-full object-cover" />
              </div>
              <p className="text-sm font-extrabold uppercase text-cyan-300">care-car-saas</p>
              <h1 className="mt-2 text-3xl font-extrabold leading-tight">منصة خدمات السيارات</h1>
            </div>

            {/* Card */}
            <motion.div variants={cardVariants} initial="hidden" animate="show"
              className={cardClass}>

              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-cyan-400 font-extrabold text-slate-950 lg:flex">CC</div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-cyan-300">care-car-saas</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow shadow-emerald-400/50"></span>
                      <span className={subtleClass}>Online</span>
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-300 border border-cyan-400/20">7 أيام مجاناً</span>
              </div>

              {/* Tab switcher */}
              <div className={`mb-6 flex ${tabWrapClass}`}>
                <button
                  onClick={() => switchMode('login')}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${mode === 'login' ? 'bg-cyan-400 text-slate-950 shadow-lg' : inactiveTabClass}`}
                >
                  تسجيل الدخول
                </button>
                <button
                  onClick={() => switchMode('register')}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${mode === 'register' ? 'bg-cyan-400 text-slate-950 shadow-lg' : inactiveTabClass}`}
                >
                  حساب جديد
                </button>
              </div>

              {/* Forms */}
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait" custom={dir}>
                  {mode === 'login' ? (
                    <motion.div key="login" custom={dir} variants={formVariants} initial="enter" animate="center" exit="exit">
                      <h2 className="mb-1 text-2xl font-extrabold leading-tight">تسجيل الدخول</h2>
                      <p className={descClass}>
                        ادخل إلى لوحة إدارة مركزك للمتابعة.
                      </p>
                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <label className="block">
                          <span className={labelClass}>الإيميل أو رقم الواتساب</span>
                          <input type="text" inputMode="email" placeholder="email@example.com أو 07xxxxxxxxx" value={loginId}
                            onChange={(e) => setLoginId(e.target.value)} required
                            className={inputClass} />
                        </label>
                        <label className="block">
                          <span className={labelClass}>كلمة المرور</span>
                          <input type="password" placeholder="كلمة المرور" value={password}
                            onChange={(e) => setPassword(e.target.value)} required
                            className={inputClass} />
                        </label>
                        {loginNotice && <p className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm font-bold text-emerald-100">{loginNotice}</p>}
                        {error && <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-200">{error}</p>}
                        <LaunchButton launching={launching} label="دخول النظام" />
                      </form>
                      <button onClick={openForgotPassword} className="mt-4 w-full text-center text-sm font-bold text-cyan-300 transition-colors hover:text-cyan-200">
                        نسيت كلمة المرور؟ إرسال كود جديد
                      </button>
                      <p className={footerLinkClass}>
                        ليس لديك حساب؟{' '}
                        <button onClick={() => switchMode('register')} className="font-bold text-cyan-300 hover:text-cyan-200 transition-colors">
                          سجل مجاناً — 7 أيام تجريبية
                        </button>
                      </p>
                    </motion.div>
                  ) : mode === 'forgot' ? (
                    <motion.div key="forgot" custom={dir} variants={formVariants} initial="enter" animate="center" exit="exit">
                      <h2 className="mb-1 text-2xl font-extrabold leading-tight">استعادة كلمة المرور</h2>
                      <p className={descClass}>
                        أدخل الإيميل أو رقم الواتساب المرتبط بحسابك وسنرسل لك كود إعادة التعيين.
                      </p>
                      {!resetSent ? (
                        <form onSubmit={handleResetRequest} className="space-y-4">
                          <label className="block">
                            <span className={labelClass}>الإيميل أو رقم الواتساب</span>
                            <input type="text" inputMode="email" placeholder="email@example.com أو 07xxxxxxxxx" value={resetId}
                              onChange={(e) => setResetId(e.target.value)} required
                              className={inputClass} />
                          </label>
                          {resetError && <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-200">{resetError}</p>}
                          <LaunchButton launching={resetLoading} label={resetLoading ? 'جاري إرسال الكود...' : 'إرسال كود إعادة التعيين'} />
                        </form>
                      ) : (
                        <form onSubmit={handleResetConfirm} className="space-y-4">
                          <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-bold leading-6 text-emerald-100">
                            تم إرسال الكود. أدخله مع كلمة المرور الجديدة.
                          </div>
                          <label className="block">
                            <span className={labelClass}>كود إعادة التعيين</span>
                            <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={resetForm.code}
                              onChange={(e) => setResetForm({ ...resetForm, code: e.target.value.replace(/\D/g, '') })} required
                              className={codeInputClass} />
                          </label>
                          <label className="block">
                            <span className={labelClass}>كلمة المرور الجديدة</span>
                            <input type="password" placeholder="أدخل كلمة مرور قوية" value={resetForm.new_password}
                              onChange={(e) => setResetForm({ ...resetForm, new_password: e.target.value })} required
                              className={inputClass} />
                          </label>
                          <label className="block">
                            <span className={labelClass}>تأكيد كلمة المرور</span>
                            <input type="password" placeholder="أعد إدخال كلمة المرور" value={resetForm.confirm_password}
                              onChange={(e) => setResetForm({ ...resetForm, confirm_password: e.target.value })} required
                              className={inputClass} />
                          </label>
                          {resetError && <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-200">{resetError}</p>}
                          <LaunchButton launching={resetLoading} label={resetLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'} />
                        </form>
                      )}
                      <p className={footerLinkClass}>
                        تذكرت كلمة المرور؟{' '}
                        <button onClick={() => switchMode('login')} className="font-bold text-cyan-300 hover:text-cyan-200 transition-colors">
                          تسجيل الدخول
                        </button>
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div key="register" custom={dir} variants={formVariants} initial="enter" animate="center" exit="exit">
                      <h2 className="mb-1 text-2xl font-extrabold leading-tight">إنشاء حساب جديد</h2>
                      <p className={descClass}>
                        سجّل مركزك وسنرسل لك كود التفعيل لإكمال الحساب.
                      </p>
                      {regResult ? (
                        <form onSubmit={handleActivateSubmit} className="space-y-4">
                          <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-bold leading-6 text-emerald-100">
                            تم إرسال كود التفعيل. أدخل الكود وكلمة المرور الجديدة للمتابعة.
                          </div>
                          <label className="block">
                            <span className={labelClass}>كود التفعيل</span>
                            <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={codeForm.code}
                              onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value.replace(/\D/g, '') })} required
                              className={codeInputClass} />
                          </label>
                          <label className="block">
                            <span className={labelClass}>كلمة المرور الجديدة</span>
                            <input type="password" placeholder="أدخل كلمة مرور قوية" value={codeForm.new_password}
                              onChange={(e) => setCodeForm({ ...codeForm, new_password: e.target.value })} required
                              className={inputClass} />
                          </label>
                          <label className="block">
                            <span className={labelClass}>تأكيد كلمة المرور</span>
                            <input type="password" placeholder="أعد إدخال كلمة المرور" value={codeForm.confirm_password}
                              onChange={(e) => setCodeForm({ ...codeForm, confirm_password: e.target.value })} required
                              className={inputClass} />
                          </label>
                          {codeError && <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-200">{codeError}</p>}
                          <LaunchButton launching={codeLoading} label={codeLoading ? 'جاري التفعيل...' : 'تفعيل الحساب'} />
                        </form>
                      ) : (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                          <label className="block">
                            <span className={labelClass}>اسم المركز</span>
                            <input type="text" placeholder="مركز الخليج لخدمات السيارات" value={centerName}
                              onChange={(e) => setCenterName(e.target.value)} required
                              className={inputClass} />
                          </label>
                          <label className="block">
                            <span className={labelClass}>اسمك الكامل</span>
                            <input type="text" placeholder="أحمد محمد" value={fullName}
                              onChange={(e) => setFullName(e.target.value)} required
                              className={inputClass} />
                          </label>
                          <div>
                            <span className={labelClass}>طريقة استلام كود التفعيل</span>
                            <div className={`flex ${tabWrapClass}`}>
                              <button type="button" onClick={() => setContactMethod('whatsapp')}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all ${contactMethod === 'whatsapp' ? 'bg-cyan-400 text-slate-950 shadow-lg' : inactiveTabClass}`}>
                                <Phone size={15} /> واتساب
                              </button>
                              <button type="button" onClick={() => setContactMethod('email')}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all ${contactMethod === 'email' ? 'bg-cyan-400 text-slate-950 shadow-lg' : inactiveTabClass}`}>
                                <Mail size={15} /> إيميل
                              </button>
                            </div>
                          </div>
                          {contactMethod === 'whatsapp' ? (
                            <label className="block">
                              <span className={labelClass}>رقم الواتساب</span>
                              <input type="text" placeholder="07xxxxxxxxx" value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)} required
                                className={inputClass} />
                            </label>
                          ) : (
                            <label className="block">
                              <span className={labelClass}>البريد الإلكتروني</span>
                              <input type="email" placeholder="example@mail.com" value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)} required
                                className={inputClass} />
                            </label>
                          )}
                          {regError && <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-200">{regError}</p>}
                          <LaunchButton launching={regLoading} label={regLoading ? 'جاري إرسال الكود...' : 'إرسال كود التفعيل'} />
                          <p className="text-center text-xs text-slate-500">
                            بإنشاء الحساب توافق على{' '}
                            <a href="/terms" target="_blank" rel="noopener noreferrer" className={linkMutedClass}>شروط الاستخدام</a>
                            {' '}و{' '}
                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className={linkMutedClass}>سياسة الخصوصية</a>
                          </p>
                        </form>
                      )}
                      <p className={footerLinkClass}>
                        لديك حساب؟{' '}
                        <button onClick={() => switchMode('login')} className="font-bold text-cyan-300 hover:text-cyan-200 transition-colors">
                          تسجيل الدخول
                        </button>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer stats */}
              <div className="mt-6 grid grid-cols-3 gap-2 text-xs text-slate-300">
                <TrustItem icon={CheckCircle2} label="بيانات معزولة" className={trustItemClass} />
                <TrustItem icon={Clock3} label="تنبيهات مباشرة" className={trustItemClass} />
                <TrustItem icon={MessageCircle} label="واتساب جاهز" className={trustItemClass} />
              </div>

              <p className="mt-4 text-center text-xs text-slate-500">
                دخول موحد: النظام يفتح لوحة المركز تلقائياً بعد التسجيل.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  )
}

function LaunchButton({ launching, label = 'دخول النظام' }) {
  return (
    <motion.button
      type="submit"
      disabled={launching}
      whileHover={{ scale: 0.985 }}
      whileTap={{ scale: 0.985 }}
      className="group relative mt-1 h-[86px] w-full overflow-hidden rounded-lg border border-cyan-200/30 bg-[linear-gradient(180deg,#48e8e8,#22c4c4)] font-extrabold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.62),transparent_42%)]" />
      <span className="absolute bottom-3 left-7 right-7 h-px bg-slate-950/15" />
      <motion.span
        className="absolute left-1/2 top-1 block h-14 w-36 -translate-x-1/2"
        animate={launching ? { x: [0, 34, -460], scale: [1, 0.98, 1.05] } : { x: 0, scale: 1 }}
        transition={launching ? { duration: 0.78, times: [0, 0.28, 1], ease: ['easeOut', 'easeIn'] } : { duration: 0.2 }}
      >
        <img src={loginCar} alt="" className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_14px_16px_rgba(127,29,29,0.38)]" />
        <Wheel className="left-[33px] top-[35px]" launching={launching} />
        <Wheel className="left-[110px] top-[35px]" launching={launching} />
        <motion.span
          className="absolute right-[-1px] top-[36px] h-3 w-14 rounded-full bg-amber-200/70 blur-sm"
          animate={launching ? { opacity: [0, 0.85, 0], x: [8, 34, 52], scaleX: [0.4, 1.5, 2.2] } : { opacity: 0 }}
          transition={{ duration: 0.7 }}
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-amber-100/80"
            style={{ right: 132 + i * 4, top: 38 + (i % 2) * 8, width: 4 + i, height: 4 + i }}
            animate={launching ? { opacity: [0, 0.75, 0], x: [0, 34 + i * 12], y: [0, -6 + i * 3], scale: [0.4, 1, 0.2] } : { opacity: 0 }}
            transition={{ duration: 0.62, delay: i * 0.025 }}
          />
        ))}
      </motion.span>
      <motion.span className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 text-sm font-extrabold">
        {label}
        <ArrowLeft size={17} className="transition group-hover:-translate-x-1" />
      </motion.span>
      <motion.span
        className="absolute inset-y-0 -right-1/3 w-1/3 skew-x-12 bg-white/35 opacity-0"
        animate={launching ? { right: ['-35%', '110%'], opacity: [0, 0.9, 0] } : {}}
        transition={{ duration: 0.6 }}
      />
    </motion.button>
  )
}

function Wheel({ className, launching }) {
  return (
    <motion.span
      className={`absolute ${className} block h-4 w-px`}
      animate={launching ? { rotate: [0, 360 * 3] } : {}}
      transition={{ duration: 0.78, ease: 'linear' }}
    >
      <span className="absolute left-1/2 top-1/2 block h-full w-px -translate-x-1/2 bg-slate-700" />
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-700" />
    </motion.span>
  )
}

function Feature({ icon: Icon, label, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 + delay }}
      className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm font-extrabold shadow-xl shadow-black/10"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-300 text-slate-950">
        <Icon size={18} />
      </span>
      {label}
    </motion.div>
  )
}

function TrustItem({ icon: Icon, label, className = 'flex items-center justify-center gap-1.5 rounded-md border border-white/8 bg-white/[0.04] px-2 py-2' }) {
  return (
    <div className={className}>
      <Icon size={13} className="text-cyan-200" />
      <span className="font-semibold">{label}</span>
    </div>
  )
}
