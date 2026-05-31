import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Activity, Building2, CalendarClock, CreditCard, Image, MessageCircle, ShieldAlert, Sparkles } from 'lucide-react'
import Layout from '../../components/Layout'
import StatCard from '../../components/StatCard'
import { getTenantMonitoring, getTenants } from '../../api/tenants'
import { PLAN_DETAILS, PLAN_ORDER, planShortName, IQD } from '../../constants/plans'

const planPrice = {
  basic: PLAN_DETAILS.basic.adminPrice,
  pro: PLAN_DETAILS.pro.adminPrice,
  enterprise: PLAN_DETAILS.enterprise.adminPrice,
}

function remainingDays(date) {
  if (!date) return null
  const end = new Date(date)
  const today = new Date()
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
}

export default function AdminOverview() {
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => getTenants().then(r => r.data),
  })
  const { data: monitoring } = useQuery({
    queryKey: ['tenant-monitoring', 'overview'],
    queryFn: () => getTenantMonitoring().then(r => r.data),
    refetchInterval: 60000,
  })
  const active = tenants.filter(t => t.is_active).length
  const suspended = tenants.length - active
  const connectedCameras = tenants.filter(t => t.ip_camera_url).length
  const connectedWhatsapp = tenants.filter(t => t.whatsapp_number).length
  const mrr = tenants.filter(t => t.is_active).reduce((sum, t) => sum + (planPrice[t.plan] || 0), 0)
  const visibleTenants = [...tenants].sort((a, b) => Number(a.is_active) - Number(b.is_active) || a.name.localeCompare(b.name, 'ar'))
  const expiringSoon = tenants.filter(t => {
    const days = remainingDays(t.subscription_ends_at)
    return days !== null && days <= 7
  })
  const withoutSubscriptionDate = tenants.filter(t => !t.subscription_ends_at)

  return (
    <Layout>
      <section className="mb-5 overflow-hidden rounded-lg border border-slate-900 bg-slate-950 text-white shadow-2xl">
        <div className="grid gap-5 p-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <p className="text-xs font-black uppercase text-cyan-300">care-car-saas</p>
            <h2 className="mt-2 text-3xl font-black">لوحة السوبر أدمن</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              هذه اللوحة لإدارة المشتركين والاشتراكات وحالة حسابات المراكز فقط. تفاصيل السيارات والفواتير والمخزون تبقى داخل لوحة كل مركز.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <p className="text-xs text-slate-300">MRR</p>
              <p className="mt-1 text-3xl font-black">{IQD(mrr)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <p className="text-xs text-slate-300">Active Centers</p>
              <p className="mt-1 text-3xl font-black">{active}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={Building2} label="المراكز المشتركة" value={tenants.length} color="blue" trend={`${active} نشط`} loading={isLoading} />
        <StatCard icon={CreditCard} label="الاشتراكات" value={IQD(mrr)} color="green" trend="MRR" loading={isLoading} />
        <StatCard icon={MessageCircle} label="واتساب مفعل" value={connectedWhatsapp} color="purple" trend={`من ${tenants.length}`} loading={isLoading} />
        <StatCard icon={ShieldAlert} label="مراكز موقوفة" value={suspended} color="orange" trend={suspended ? 'تحتاج متابعة' : 'كلها فعالة'} loading={isLoading} />
      </div>

      {monitoring?.summary && (
        <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="font-black text-slate-950">نبض المراكز الآن</h3>
                <p className="text-xs text-slate-500">مراقبة تلقائية تتحدث كل دقيقة</p>
              </div>
            </div>
            <Link to="/admin/monitoring" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-300">
              فتح غرفة المراقبة
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Pulse label="مستقرة" value={monitoring.summary.healthy} tone="green" />
            <Pulse label="تحتاج متابعة" value={monitoring.summary.warning} tone="amber" />
            <Pulse label="خطر" value={monitoring.summary.critical} tone="red" />
            <Pulse label="مشاكل واتساب/مخزون" value={(monitoring.summary.failed_messages_30_days || 0) + (monitoring.summary.low_inventory_count || 0)} tone="slate" />
          </div>
        </section>
      )}

      <section className="mb-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="premium-card rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
                <CreditCard size={17} />
              </div>
              <div>
                <h3 className="font-black text-slate-950">ملخص الاشتراكات</h3>
                <p className="text-xs text-slate-500">تظهر هنا داخل لوحة السوبر أدمن مباشرة</p>
              </div>
            </div>
            <Link to="/admin/subscriptions" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white">
              إدارة الاشتراكات
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {PLAN_ORDER.map(plan => {
              const count = tenants.filter(t => t.plan === plan).length
              const activeCount = tenants.filter(t => t.plan === plan && t.is_active).length
              return (
                <div key={plan} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-500">{planShortName(plan)}</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{count}</p>
                  <p className="mt-1 text-xs text-slate-500">{activeCount} نشط · {IQD(planPrice[plan])}/شهر</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="premium-card rounded-lg p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white">
              <CalendarClock size={17} />
            </div>
            <div>
              <h3 className="font-black text-slate-950">اشتراكات تحتاج متابعة</h3>
              <p className="text-xs text-slate-500">منتهية، قريبة الانتهاء، أو بدون تاريخ</p>
            </div>
          </div>
          <div className="space-y-2">
            {[...tenants.filter(t => !t.is_active), ...expiringSoon, ...withoutSubscriptionDate].filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i).slice(0, 5).map(t => {
              const days = remainingDays(t.subscription_ends_at)
              return (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-black text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{planShortName(t.plan)} · {t.subscription_ends_at || 'بدون تاريخ انتهاء'}</p>
                  </div>
                  <Badge
                    text={!t.is_active ? 'موقوف' : days === null ? 'أضف تاريخ' : days < 0 ? 'منتهي' : `باقي ${days} يوم`}
                    tone={!t.is_active || days === null || days < 0 ? 'red' : 'slate'}
                  />
                </div>
              )
            })}
            {!tenants.filter(t => !t.is_active).length && !expiringSoon.length && !withoutSubscriptionDate.length && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-4 text-center text-sm font-bold text-emerald-700">
                كل الاشتراكات واضحة ولا تحتاج متابعة عاجلة
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Platform Ads quick link */}
      <div className="mb-5 flex items-center justify-between rounded-lg border border-slate-900 bg-slate-950 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
            <Image size={18} />
          </div>
          <div>
            <p className="font-black">إعلانات لوحة التحكم</p>
            <p className="text-xs text-slate-400">الصور التي تظهر في كاروسيل لوحة كل مركز</p>
          </div>
        </div>
        <Link to="/admin/ads" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-300 transition-colors">
          إدارة الإعلانات
        </Link>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="premium-card overflow-hidden rounded-lg">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-black text-slate-950">المراكز المشتركة</h3>
            <p className="mt-1 text-xs text-slate-500">المراكز الموقوفة تظهر أولا حتى لا تختفي عن السوبر أدمن</p>
          </div>
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>{['المركز', 'الخطة', 'انتهاء الاشتراك', 'حالة الإعداد', 'الحالة'].map(h => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {visibleTenants.map(t => (
                <tr key={t.id} className={`border-t border-slate-100 text-sm hover:bg-slate-50 ${!t.is_active ? 'bg-rose-50/45' : ''}`}>
                  <td className="px-5 py-4"><p className="font-black text-slate-950">{t.name}</p><p className="text-xs text-slate-500">{t.contact_phone || 'لا يوجد هاتف'}</p></td>
                  <td className="px-5 py-4"><Badge text={`${planShortName(t.plan)} · ${((planPrice[t.plan] || 0)/1000).toFixed(0)}K د.ع`} tone="slate" /></td>
                  <td className="px-5 py-4">{t.subscription_ends_at || 'غير محدد'}</td>
                  <td className="px-5 py-4">
                    <Badge
                      text={t.whatsapp_number || t.ip_camera_url ? 'جزئي/جاهز' : 'غير مكتمل'}
                      tone={t.whatsapp_number || t.ip_camera_url ? 'green' : 'slate'}
                    />
                  </td>
                  <td className="px-5 py-4"><Badge text={t.is_active ? 'نشط' : 'موقوف'} tone={t.is_active ? 'green' : 'red'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tenants.length && <p className="py-10 text-center text-sm font-semibold text-slate-400">لا توجد مراكز بعد</p>}
        </div>

        <div className="grid gap-4">
          <AdminPanel title="ملخص المنصة" icon={Sparkles}>
            <Alert text={`${connectedWhatsapp}/${tenants.length} مراكز أكملت إعداد واتساب`} />
            <Alert text={`${connectedCameras}/${tenants.length} مراكز لديها رابط كاميرا محفوظ`} />
            <Alert text={suspended ? `${suspended} مراكز موقوفة بسبب الاشتراك` : 'لا توجد مراكز موقوفة'} />
          </AdminPanel>
          <div className="premium-card rounded-lg p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white"><ShieldAlert size={17} /></div>
              <h3 className="font-black text-slate-950">توزيع الخطط</h3>
            </div>
            <div className="space-y-2">
              {PLAN_ORDER.map(plan => {
                const count = tenants.filter(t => t.plan === plan).length
                return (
                  <div key={plan} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm font-bold text-slate-700">{planShortName(plan)}</span>
                    <span className="text-sm font-black text-slate-950">{count} مركز</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

function Badge({ text, tone }) {
  const tones = {
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-rose-100 text-rose-700',
    slate: 'bg-slate-100 text-slate-700',
  }
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${tones[tone]}`}>{text}</span>
}

function AdminPanel({ title, icon: Icon, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="premium-card rounded-lg p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white"><Icon size={17} /></div>
        <h3 className="font-black text-slate-950">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </motion.div>
  )
}

function Alert({ text }) {
  return <div className="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-800">{text}</div>
}

function Pulse({ label, value, tone }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-rose-50 text-rose-700 border-rose-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  }
  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <p className="text-2xl font-black">{value || 0}</p>
      <p className="mt-1 text-xs font-black">{label}</p>
    </div>
  )
}
