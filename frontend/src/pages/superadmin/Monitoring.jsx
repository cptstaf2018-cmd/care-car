import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, Activity, Building2, CheckCircle2, Clock3, CreditCard,
  Gauge, MessageCircle, Package, Phone, Receipt, Search, ShieldAlert, User
} from 'lucide-react'
import Layout from '../../components/Layout'
import { getTenantMonitoring } from '../../api/tenants'
import { IQD, planShortName } from '../../constants/plans'

const healthMeta = {
  healthy: { label: 'مستقر', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  warning: { label: 'يحتاج متابعة', icon: AlertTriangle, className: 'bg-amber-100 text-amber-700 border-amber-200' },
  critical: { label: 'خطر', icon: ShieldAlert, className: 'bg-rose-100 text-rose-700 border-rose-200' },
}

function formatDate(value) {
  if (!value) return 'لا يوجد'
  return new Date(value).toLocaleString('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' })
}

function expiryText(days) {
  if (days === null || days === undefined) return 'بدون تاريخ'
  if (days < 0) return `منتهي منذ ${Math.abs(days)} يوم`
  if (days === 0) return 'ينتهي اليوم'
  return `باقي ${days} يوم`
}

export default function Monitoring() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const { data, isLoading } = useQuery({
    queryKey: ['tenant-monitoring'],
    queryFn: () => getTenantMonitoring().then(r => r.data),
    refetchInterval: 60000,
  })

  const rows = data?.tenants || []
  const summary = data?.summary || {}
  const filtered = useMemo(() => {
    return rows.filter(row => {
      const matchesFilter = filter === 'all' || row.health === filter
      const needle = query.trim().toLowerCase()
      const matchesQuery = !needle || [row.name, row.manager_name, row.manager_email, row.contact_phone, row.whatsapp_number]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(needle))
      return matchesFilter && matchesQuery
    })
  }, [rows, filter, query])

  return (
    <Layout>
      <section className="mb-5 rounded-lg border border-slate-900 bg-slate-950 p-6 text-white shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-cyan-300">operations center</p>
            <h2 className="mt-2 text-3xl font-black">مراقبة المراكز</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              رؤية تشغيلية لحالة كل مركز، الاشتراك، النشاط، الرسائل، المخزون، والتنبيهات التي تحتاج متابعة.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
            <MiniStat label="مستقر" value={summary.healthy || 0} tone="emerald" />
            <MiniStat label="متابعة" value={summary.warning || 0} tone="amber" />
            <MiniStat label="خطر" value={summary.critical || 0} tone="rose" />
          </div>
        </div>
      </section>

      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Building2} label="المراكز" value={summary.total || 0} detail={`${summary.active || 0} نشط`} />
        <Metric icon={Receipt} label="إيراد 30 يوم" value={IQD(summary.revenue_30_days || 0)} detail="حسب الفواتير" />
        <Metric icon={CreditCard} label="الديون" value={IQD(summary.debt_total || 0)} detail="تحتاج تحصيل" danger={summary.debt_total > 0} />
        <Metric icon={MessageCircle} label="مشاكل واتساب/مخزون" value={(summary.failed_messages_30_days || 0) + (summary.low_inventory_count || 0)} detail="آخر 30 يوم" danger />
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="بحث باسم المركز، المدير، الإيميل، أو الهاتف"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-4 pr-10 text-sm font-semibold outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          />
        </div>
        <div className="grid grid-cols-4 gap-2 lg:w-[460px]">
          {[
            ['all', 'الكل'],
            ['critical', 'خطر'],
            ['warning', 'متابعة'],
            ['healthy', 'مستقر'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-3 text-sm font-black transition ${filter === key ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="grid gap-3">
        {isLoading && <div className="rounded-lg bg-white p-8 text-center text-sm font-bold text-slate-500">جاري تحميل المراقبة...</div>}
        {!isLoading && filtered.map(row => <MonitorCard key={row.tenant_id} row={row} />)}
        {!isLoading && !filtered.length && (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400">
            لا توجد مراكز مطابقة للبحث الحالي
          </div>
        )}
      </section>
    </Layout>
  )
}

function MiniStat({ label, value, tone }) {
  const colors = {
    emerald: 'bg-emerald-400 text-slate-950',
    amber: 'bg-amber-300 text-slate-950',
    rose: 'bg-rose-400 text-white',
  }
  return (
    <div className={`rounded-lg px-4 py-3 ${colors[tone]}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-black">{label}</p>
    </div>
  )
}

function Metric({ icon: Icon, label, value, detail, danger = false }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${danger ? 'bg-rose-50 text-rose-600' : 'bg-cyan-50 text-cyan-700'}`}>
          <Icon size={19} />
        </span>
        <span className="text-xs font-bold text-slate-400">{detail}</span>
      </div>
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  )
}

function MonitorCard({ row }) {
  const meta = healthMeta[row.health] || healthMeta.warning
  const Icon = meta.icon
  const issuePreview = row.issues?.length ? row.issues : ['لا توجد مشاكل واضحة']

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-4 border-b border-slate-100 p-4 xl:grid-cols-[1.25fr_1.1fr_0.9fr]">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Building2 size={21} />
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-slate-950">{row.name}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-black ${meta.className}`}>
                <Icon size={13} /> {meta.label}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{planShortName(row.plan)}</span>
            </div>
            <div className="grid gap-1 text-sm text-slate-500 sm:grid-cols-2">
              <Info icon={User} text={row.manager_name || 'لا يوجد اسم مدير'} />
              <Info icon={Phone} text={row.contact_phone || row.whatsapp_number || 'لا يوجد رقم'} ltr />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Tiny label="سيارات" value={row.car_count} />
          <Tiny label="خدمات" value={row.service_count} />
          <Tiny label="فواتير" value={row.invoice_count} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Tiny label="إيراد 30 يوم" value={IQD(row.revenue_30_days || 0)} />
          <Tiny label="ديون" value={IQD(row.debt_total || 0)} danger={row.debt_total > 0} />
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[1fr_1fr_1.2fr]">
        <div className="space-y-2">
          <Info icon={Clock3} label="آخر نشاط" text={formatDate(row.last_activity_at)} />
          <Info icon={CreditCard} label="الاشتراك" text={expiryText(row.days_to_expiry)} />
        </div>
        <div className="space-y-2">
          <Info icon={MessageCircle} label="رسائل فاشلة" text={`${row.failed_messages_30_days || 0} خلال 30 يوم`} />
          <Info icon={Package} label="مخزون منخفض" text={`${row.low_inventory_count || 0} عنصر`} />
        </div>
        <div className="flex flex-wrap gap-2">
          {issuePreview.map(issue => (
            <span key={issue} className={`rounded-full px-3 py-1.5 text-xs font-black ${row.issues?.length ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {issue}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}

function Tiny({ label, value, danger = false }) {
  return (
    <div className={`rounded-lg px-3 py-2 ${danger ? 'bg-rose-50' : 'bg-slate-50'}`}>
      <p className="text-[11px] font-black text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-sm font-black ${danger ? 'text-rose-700' : 'text-slate-950'}`}>{value}</p>
    </div>
  )
}

function Info({ icon: Icon, label, text, ltr = false }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <Icon size={15} className="shrink-0 text-slate-400" />
      {label && <span className="shrink-0 font-bold text-slate-400">{label}:</span>}
      <span className="truncate font-bold text-slate-700" dir={ltr ? 'ltr' : undefined}>{text}</span>
    </div>
  )
}
