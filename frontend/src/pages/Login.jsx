import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, Camera, Car, CheckCircle2, Clock3, MessageCircle, Sparkles } from 'lucide-react'
import { login } from '../api/auth'
import { useAuthStore } from '../store/auth'
import centerHero from '../assets/center-template-red.png'
import loginCar from '../assets/login-car-real.png'

const features = [
  { icon: Car, label: 'سيارات العملاء' },
  { icon: MessageCircle, label: 'حملات واتساب' },
  { icon: Camera, label: 'كاميرات المراكز' },
  { icon: BarChart3, label: 'تقارير تشغيلية' },
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

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [launching, setLaunching] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.login)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLaunching(true)
    try {
      const res = await login(email, password)
      window.setTimeout(() => {
        setAuth(res.data.access_token, { email, role: res.data.role, tenant_id: res.data.tenant_id })
        navigate(res.data.role === 'superadmin' ? '/admin' : '/')
      }, 760)
    } catch (err) {
      setLaunching(false)
      if (err.response?.status === 401) {
        setError('بيانات الدخول غير صحيحة')
      } else if (err.response?.status === 402) {
        setError('trial_expired')
      } else if (err.response?.status === 403) {
        setError('هذا الحساب موقوف، تواصل مع الإدارة')
      } else {
        setError('خطأ في الاتصال، حاول مجددًا')
      }
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="grid min-h-screen lg:grid-cols-[0.98fr_1.02fr]">
        <section className="relative hidden min-h-screen overflow-hidden lg:block">
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

            <motion.div variants={cardVariants} initial="hidden" animate="show" className="max-w-2xl pb-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-4 py-2 text-sm font-bold shadow-lg shadow-cyan-950/20 backdrop-blur-xl">
                <Sparkles size={16} className="text-cyan-200" />
                منصة احترافية لإدارة مراكز السيارات والزيوت
              </div>
              <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.14] tracking-normal xl:text-[62px]">
                كل مركز سيارات يحتاج نظاما يبدو مثل شركته
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

        <section className="relative flex min-h-screen items-center justify-center px-5 py-8 lg:px-10 xl:px-14">
          <div className="w-full max-w-[540px]">
            <div className="mb-8 lg:hidden">
              <div className="mb-5 h-56 overflow-hidden rounded-lg border border-white/10 shadow-2xl shadow-black/30">
                <img src={centerHero} alt="care-car-saas" className="h-full w-full object-cover" />
              </div>
              <p className="text-sm font-extrabold uppercase text-cyan-300">care-car-saas</p>
              <h1 className="mt-2 text-3xl font-extrabold">منصة إدارة مراكز السيارات</h1>
            </div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="show"
              className="relative overflow-hidden rounded-lg border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.105),rgba(255,255,255,0.055))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-8"
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-cyan-200/70 to-transparent" />
              <div className="pointer-events-none absolute -left-20 -top-20 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
              <div className="mb-7">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-400 text-lg font-black text-slate-950 shadow-lg shadow-cyan-500/30">
                    CC
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]" />
                    Online
                  </div>
                </div>
                <p className="text-sm font-extrabold uppercase text-cyan-300">care-car-saas</p>
                <h2 className="mt-2 text-3xl font-extrabold leading-tight">تسجيل الدخول</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  ادخل إلى لوحة السوبر أدمن أو لوحة المركز حسب صلاحيات حسابك.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-200">البريد الإلكتروني</span>
                  <input type="email" placeholder="admin@oil.com" value={email}
                    onChange={e => setEmail(e.target.value)} required
                    className="w-full rounded-lg border border-white/10 bg-slate-950/30 px-4 py-3.5 text-white shadow-inner shadow-black/20 outline-none transition duration-200 placeholder:text-slate-500 hover:border-white/20 hover:bg-slate-950/20 focus:border-cyan-300 focus:bg-slate-950/20 focus:ring-4 focus:ring-cyan-400/10" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-200">كلمة المرور</span>
                  <input type="password" placeholder="كلمة المرور" value={password}
                    onChange={e => setPassword(e.target.value)} required
                    className="w-full rounded-lg border border-white/10 bg-slate-950/30 px-4 py-3.5 text-white shadow-inner shadow-black/20 outline-none transition duration-200 placeholder:text-slate-500 hover:border-white/20 hover:bg-slate-950/20 focus:border-cyan-300 focus:bg-slate-950/20 focus:ring-4 focus:ring-cyan-400/10" />
                </label>
                {error && error !== 'trial_expired' && (
                  <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-200">{error}</p>
                )}
                {error === 'trial_expired' && (
                  <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    <p className="font-bold">انتهت فترة التجربة المجانية</p>
                    <p className="mt-1 text-xs">اشترك الآن للمتابعة — اذهب إلى إعدادات المركز بعد الدخول.</p>
                  </div>
                )}
                <LaunchButton launching={launching} />
              </form>

              <div className="mt-5 rounded-lg border border-cyan-200/15 bg-cyan-300/8 px-4 py-3 text-center text-sm font-bold leading-6 text-cyan-100">
                دخول موحد: النظام يفتح لوحة السوبر أدمن أو لوحة المركز تلقائياً حسب صلاحية الحساب.
              </div>
              <p className="mt-4 text-center text-sm text-slate-400">
                ليس لديك حساب؟{' '}
                <a href="/register" className="font-bold text-cyan-300 hover:text-cyan-200">سجل مجاناً — 3 أيام تجريبية</a>
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-300">
                <TrustItem icon={CheckCircle2} label="بيانات معزولة" />
                <TrustItem icon={Clock3} label="تنبيهات مباشرة" />
                <TrustItem icon={MessageCircle} label="واتساب جاهز" />
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  )
}

function LaunchButton({ launching }) {
  return (
    <motion.button
      type="submit"
      disabled={launching}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      className="group relative mt-1 h-[86px] w-full overflow-hidden rounded-lg border border-cyan-200/30 bg-[linear-gradient(180deg,#48e6f7,#1fc8dd)] px-5 text-slate-950 shadow-[0_22px_54px_rgba(34,211,238,0.28)] transition hover:shadow-[0_28px_70px_rgba(34,211,238,0.38)] disabled:cursor-wait"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.62),transparent_42%)]" />
      <span className="absolute bottom-3 left-7 right-7 h-px bg-slate-950/15" />
      <motion.span
        className="absolute left-1/2 top-1 block h-14 w-40 -translate-x-1/2"
        animate={launching ? { x: [0, 34, -460], scale: [1, 0.98, 1.05] } : { x: 0, scale: 1 }}
        transition={launching ? { duration: 0.78, times: [0, 0.28, 1], ease: ['easeOut', 'easeIn'] } : { duration: 0.2 }}
      >
        <img src={loginCar} alt="" className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_14px_16px_rgba(127,29,29,0.38)]" />
        <Wheel className="left-[33px] top-[35px]" launching={launching} />
        <Wheel className="left-[110px] top-[35px]" launching={launching} />
        <motion.span
          className="absolute right-[130px] top-[36px] h-3 w-14 rounded-full bg-amber-200/70 blur-sm"
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

      <span className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 text-sm font-extrabold">
        دخول النظام
        <ArrowLeft size={17} className="transition group-hover:-translate-x-1" />
      </span>
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
      className={`absolute h-[18px] w-[18px] rounded-full border-[4px] border-slate-950 bg-slate-400 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35)] ${className}`}
      animate={launching ? { rotate: [0, -1080] } : { rotate: 0 }}
      transition={launching ? { duration: 0.78, ease: 'easeIn' } : { duration: 0.2 }}
    >
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-700" />
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
      className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm font-extrabold shadow-xl shadow-black/10 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-white/[0.14]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-300 text-slate-950">
        <Icon size={18} />
      </span>
      {label}
    </motion.div>
  )
}

function TrustItem({ icon: Icon, label }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-md border border-white/8 bg-white/[0.04] px-2 py-2">
      <Icon size={13} className="text-cyan-200" />
      <span className="font-semibold">{label}</span>
    </div>
  )
}
