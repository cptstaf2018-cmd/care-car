import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AlertTriangle, Car, MessageCircle, Package, PlusCircle, Receipt, Wrench } from 'lucide-react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { getDailyReport, getMonthlyReport } from '../api/reports'
import { getCars } from '../api/cars'
import { getInventory } from '../api/inventory'
import { getInvoices } from '../api/invoices'
import { getCenterSettings } from '../api/settings'
import { getPlatformAds } from '../api/platform'
import { useAuthStore } from '../store/auth'
import centerTemplateRed from '../assets/center-template-red.png'
import centerTemplateSuv from '../assets/center-template-suv.png'
import centerTemplateWhite from '../assets/center-template-white.png'
import centerTemplateService from '../assets/center-template-service.png'
import centerCarCarousel from '../assets/center-car-carousel.png'
import centerOilCarousel from '../assets/center-oil-carousel.png'

const FALLBACK_IMAGES = [centerOilCarousel, centerCarCarousel, centerTemplateService, centerTemplateRed, centerTemplateWhite, centerTemplateSuv]

function daysUntilReminder(car) {
  const seed = Number(car.id || 1) * 7
  return (seed % 18) - 3
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const [promoIndex, setPromoIndex] = useState(0)
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()

  const dailyQuery = useQuery({
    queryKey: ['daily', today],
    queryFn: () => getDailyReport(today).then(r => r.data),
  })
  const monthlyQuery = useQuery({
    queryKey: ['monthly', now.getFullYear(), now.getMonth() + 1],
    queryFn: () => getMonthlyReport(now.getFullYear(), now.getMonth() + 1).then(r => r.data),
  })
  const carsQuery = useQuery({
    queryKey: ['cars', 'dashboard'],
    queryFn: () => getCars().then(r => r.data),
  })
  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data),
  })
  const invoicesQuery = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getInvoices().then(r => r.data),
  })
  const centerQuery = useQuery({
    queryKey: ['center-settings', 'dashboard'],
    queryFn: () => getCenterSettings().then(r => r.data),
  })
  const adsQuery = useQuery({
    queryKey: ['platform-ads'],
    queryFn: () => getPlatformAds().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const daily = dailyQuery.data
  const monthly = monthlyQuery.data
  const cars = carsQuery.data || []
  const inventory = inventoryQuery.data || []
  const invoices = invoicesQuery.data || []
  const centerName = centerQuery.data?.name || 'مركزك'
  const isOilCenter = (centerQuery.data?.specialty || 'quick_service') === 'quick_service'
  const lowStock = inventory.filter(item => item.low_stock)
  const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid')
  const dueCars = isOilCenter ? cars
    .map(car => ({ ...car, days_left: daysUntilReminder(car) }))
    .filter(car => car.days_left <= 5)
    .slice(0, 6) : []
  const apiAds = adsQuery.data || []
  const promoItems = apiAds.length > 0
    ? apiAds.map(a => a.url)
    : FALLBACK_IMAGES
  const platformAds = [
    {
      title: 'أدر مركز خدمات السيارات باحترافية تامة',
      text: 'فواتير، مخزون، سيارات، وتذكيرات الصيانة — كل شيء في نظام واحد.',
    },
    {
      title: 'ذكّر عملاءك بموعد الصيانة برسالة واتساب تلقائية',
      text: 'نظام التذكيرات يُرسل رسائل احترافية قبل موعد خدمة كل سيارة.',
    },
    {
      title: 'تتبّع أداء مركزك اليومي والشهري بلمحة واحدة',
      text: 'تقارير واضحة للمبيعات، الخدمات المنجزة، والمخزون المتاح.',
    },
  ]
  const activeAd = platformAds[promoIndex % platformAds.length]

  useEffect(() => {
    setPromoIndex(0)
    const timer = window.setInterval(() => {
      setPromoIndex(index => (index + 1) % promoItems.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [promoItems.length])

  return (
    <Layout compact>
      {/* Hero banner — quarter height with carousel */}
      <section className="relative mb-5 overflow-hidden rounded-2xl border border-slate-900 bg-[#050b17] text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(34,211,238,0.13),transparent_32%)]" />

        {/* Mobile: image carousel strip */}
        <div className="relative h-36 overflow-hidden lg:hidden">
          {promoItems.map((src, index) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-1000 ease-out ${
                index === promoIndex ? 'scale-100 opacity-100' : 'scale-[1.015] opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050b17]/20 to-[#050b17]/90" />
          <div className="absolute bottom-3 right-4 left-4 flex items-end justify-between" dir="rtl">
            <div>
              <p className="text-[9px] font-black tracking-widest text-amber-300 uppercase">منصة care-car-saas</p>
              <p className="text-sm font-black text-white leading-snug mt-0.5">{activeAd.title}</p>
            </div>
            <div className="flex gap-1.5 mb-0.5">
              {promoItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPromoIndex(index)}
                  className={`h-1 rounded-full transition-all ${index === promoIndex ? 'w-5 bg-cyan-300' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid h-[290px] gap-0 lg:grid-cols-[minmax(0,1fr)_310px_320px] xl:grid-cols-[minmax(0,1fr)_360px_340px]" dir="ltr">

          {/* Info panel */}
          <div className="relative z-10 flex h-full flex-col justify-between border-l border-white/10 bg-[#050b17]/92 px-5 py-3 lg:order-3" dir="rtl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">مباشر الآن</p>
                <h2 className="text-base font-black text-white">{centerName}</h2>
                <p className="mt-0.5 text-xs font-bold text-slate-400">نشاط اليوم</p>
              </div>
              <div className="hidden gap-3 sm:flex">
                <HeroMetric label="خدمات منجزة" value={daily?.service_count ?? '—'} />
                <HeroMetric label="فواتير معلقة" value={unpaidInvoices.length} alert={unpaidInvoices.length > 0} />
                <HeroMetric label="مواد ناقصة" value={lowStock.length} alert={lowStock.length > 0} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <QuickLink to="/center/cars" icon={Car} text="سيارة" compact />
              <QuickLink to="/center/inventory" icon={Package} text="مخزون" compact />
              <QuickLink to="/center/services/new" icon={PlusCircle} text="خدمة جديدة" primary compact />
            </div>
          </div>

          {/* Premium ad space */}
          <div className="relative hidden h-full overflow-hidden border-l border-white/10 bg-[#050b17] px-6 py-5 lg:order-2 lg:flex" dir="rtl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_16%,rgba(245,158,11,0.18),transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.25),rgba(2,6,23,0.88))]" />
            <motion.div
              className="absolute right-6 top-8 h-px w-52 bg-gradient-to-l from-transparent via-amber-300 to-transparent"
              animate={{ x: [58, -150, 58], opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              key={activeAd.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="relative z-10 flex h-full flex-col justify-center text-right"
            >
              <p className="text-[11px] font-black tracking-[0.06em] text-amber-200/90">
                منصة care-car-saas لخدمات السيارات
              </p>
              <h3 className="mt-4 bg-gradient-to-l from-[#fff7cc] via-[#f7c948] to-[#d69b2d] bg-clip-text text-[25px] font-black leading-[1.55] text-transparent drop-shadow-[0_10px_30px_rgba(245,158,11,0.22)]">
                {activeAd.title}
              </h3>
              <p className="mt-3 max-w-[300px] text-sm font-bold leading-7 text-slate-300">
                {activeAd.text}
              </p>
              <motion.div
                className="mt-5 h-0.5 w-full rounded-full bg-gradient-to-l from-transparent via-amber-300 to-transparent"
                animate={{ scaleX: [0.28, 1, 0.28], opacity: [0.28, 0.9, 0.28] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          {/* Image carousel */}
          <div className="relative hidden h-full overflow-hidden lg:order-1 lg:block">
            {promoItems.map((src, index) => (
              <img
                key={src}
                src={src}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-1000 ease-out ${
                  index === promoIndex ? 'scale-100 opacity-100' : 'scale-[1.015] opacity-0'
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050b17]/10 via-transparent to-[#050b17]/32" />
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050b17] to-transparent" />
            <div className="absolute bottom-2.5 left-4 flex gap-1.5">
              {promoItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPromoIndex(index)}
                  className={`h-1 rounded-full transition-all ${index === promoIndex ? 'w-6 bg-cyan-300' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={Wrench}        label="خدمات اليوم"   value={daily?.service_count}  color="blue"   helper="سيارات تمت خدمتها اليوم"  loading={dailyQuery.isLoading} />
        <StatCard icon={Receipt}       label="إيرادات اليوم" value={daily?.total_sales != null ? `${daily.total_sales.toLocaleString()} IQD` : null} color="green" helper="إجمالي الفواتير المدفوعة" loading={dailyQuery.isLoading} />
        <StatCard
          icon={MessageCircle}
          label={isOilCenter ? 'مواعيد الصيانة' : 'رسائل الديون'}
          value={isOilCenter ? dueCars.length : unpaidInvoices.length}
          color="orange"
          helper={isOilCenter ? 'سيارات تقترب من موعد خدمتها' : 'مطالبات دين يمكن إرسالها'}
          loading={isOilCenter ? carsQuery.isLoading : invoicesQuery.isLoading}
        />
        <StatCard icon={AlertTriangle} label="مستحقات العملاء" value={monthly?.pending_debts != null ? `${monthly.pending_debts.toLocaleString()} IQD` : null} color="red" helper={`${unpaidInvoices.length} فاتورة غير مسددة`} loading={monthlyQuery.isLoading} />
      </div>

      {/* Panels row 1 */}
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="تنبيهات اليوم" icon={AlertTriangle}>
          <ActionAlert
            tone={lowStock.length ? 'amber' : 'green'}
            title={lowStock.length ? 'قطع ومواد ناقصة' : 'المخزون كافٍ'}
            text={lowStock.length ? `${lowStock.length} مواد وصلت للحد الأدنى` : 'جميع قطع الغيار والمواد متوفرة'}
            to="/center/inventory"
          />
          <ActionAlert
            tone={unpaidInvoices.length ? 'rose' : 'green'}
            title={unpaidInvoices.length ? 'فواتير غير مسددة' : 'جميع الفواتير مسددة'}
            text={unpaidInvoices.length ? `${unpaidInvoices.length} فواتير تحتاج تحصيل` : 'لا توجد مستحقات متأخرة'}
            to="/center/invoices"
          />
          {isOilCenter ? (
            <ActionAlert
              tone={dueCars.length ? 'cyan' : 'green'}
              title={dueCars.length ? 'مواعيد صيانة قريبة' : 'لا مواعيد عاجلة'}
              text={dueCars.length ? `${dueCars.length} سيارة تقترب من موعد صيانتها` : 'جميع مواعيد الصيانة بعيدة'}
              to="/center/cars"
            />
          ) : (
            <ActionAlert
              tone={unpaidInvoices.length ? 'rose' : 'green'}
              title={unpaidInvoices.length ? 'رسائل ديون جاهزة' : 'لا توجد ديون للتذكير'}
              text={unpaidInvoices.length ? 'استخدم صفحة الديون للإرسال اليدوي أو التلقائي' : 'كل الفواتير مسددة لهذا المركز'}
              to="/center/debts"
            />
          )}
        </Panel>

        <Panel title="آخر فواتير الخدمة" icon={Receipt}>
          {invoices.slice(0, 6).map(inv => (
            <div key={inv.id} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 border-b border-slate-100 py-2.5 last:border-0">
              <span className="font-mono text-sm font-black text-slate-400">#{inv.id}</span>
              <div>
                <p className="text-sm font-bold text-slate-800">{Number(inv.amount).toLocaleString()} IQD</p>
                <p className="text-xs text-slate-400">{inv.invoice_date}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {inv.status === 'paid' ? 'مدفوعة' : 'مفتوحة'}
              </span>
            </div>
          ))}
          {!invoices.length && <EmptyState text="لا توجد فواتير بعد" />}
        </Panel>
      </section>

      {/* Panels row 2 */}
      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title={isOilCenter ? 'مواعيد الصيانة القادمة' : 'متابعة رسائل الديون'} icon={MessageCircle}>
          {isOilCenter && dueCars.length ? dueCars.map(car => (
            <div key={car.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <div>
                <p className="font-mono font-black text-slate-950">{car.plate_number}</p>
                <p className="text-xs text-slate-400">{car.owner_name || 'صاحب السيارة'} · {car.phone || 'لا يوجد رقم'}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${car.days_left <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-cyan-100 text-cyan-700'}`}>
                {car.days_left <= 0 ? 'موعد الصيانة اليوم' : `بعد ${car.days_left} أيام`}
              </span>
            </div>
          )) : isOilCenter ? (
            <EmptyState text="لا توجد مواعيد صيانة قريبة" />
          ) : unpaidInvoices.length ? (
            unpaidInvoices.slice(0, 6).map(inv => (
              <div key={inv.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                <div>
                  <p className="font-black text-slate-950">فاتورة #{inv.id}</p>
                  <p className="text-xs text-slate-400">{inv.invoice_date || 'تاريخ غير محدد'}</p>
                </div>
                <Link to="/center/debts" className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-rose-700">
                  تذكير دين
                </Link>
              </div>
            ))
          ) : (
            <EmptyState text="لا توجد ديون للتذكير" />
          )}
        </Panel>

        <Panel title="آخر السيارات المخدومة" icon={Car}>
          {cars.slice(0, 6).map(car => (
            <div key={car.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <div>
                <p className="font-mono font-black text-slate-950">{car.plate_number}</p>
                <p className="text-xs text-slate-400">{car.owner_name || 'صاحب السيارة'} · {car.car_type || 'النوع غير محدد'}</p>
              </div>
              <Link to="/center/services/new" className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-black text-white transition hover:bg-slate-700">خدمة جديدة</Link>
            </div>
          ))}
          {!cars.length && <EmptyState text="لا توجد سيارات مسجلة بعد" />}
        </Panel>
      </section>
    </Layout>
  )
}

function QuickLink({ to, icon: Icon, text, primary, compact }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 rounded-xl ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'} font-black transition ${
        primary ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'border border-white/15 bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      <Icon size={16} />
      {text}
    </Link>
  )
}

function HeroMetric({ label, value, alert }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
      <span className="text-sm text-slate-300">{label}</span>
      <span className={`text-xl font-black ${alert ? 'text-amber-300' : 'text-white'}`}>{value}</span>
    </div>
  )
}

function Panel({ title, icon: Icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card rounded-2xl p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
          <Icon size={17} />
        </div>
        <h3 className="font-black text-slate-950">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </motion.div>
  )
}

function ActionAlert({ title, text, tone, to }) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300',
    rose:  'border-rose-200 bg-rose-50 text-rose-900 hover:border-rose-300',
    cyan:  'border-cyan-200 bg-cyan-50 text-cyan-900 hover:border-cyan-300',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300',
  }
  return (
    <Link to={to} className={`block rounded-xl border p-4 transition hover:scale-[1.01] ${tones[tone]}`}>
      <p className="font-black">{title}</p>
      <p className="mt-1 text-sm leading-6 opacity-80">{text}</p>
    </Link>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  )
}
