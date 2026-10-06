import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Building2, CheckCircle2, Clock3, CreditCard, MessageCircle,
  Package, Phone, Receipt, RefreshCw, Search, Settings, ShieldAlert, User, Wrench
} from 'lucide-react'
import Layout from '../../components/Layout'
import { getTenantMonitoring, updateTenant } from '../../api/tenants'
import { IQD, tenantPlanLabel } from '../../constants/plans'
import { getSpecialtyLabel } from '../../constants/centerSpecialties'

const healthMeta = {
  healthy: {
    label: 'مستقر',
    icon: CheckCircle2,
    row: 'border-emerald-200',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    mark: 'bg-emerald-500',
  },
  warning: {
    label: 'يحتاج متابعة',
    icon: AlertTriangle,
    row: 'border-amber-200',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    mark: 'bg-amber-400',
  },
  critical: {
    label: 'خطر',
    icon: ShieldAlert,
    row: 'border-rose-200',
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    mark: 'bg-rose-500',
  },
}

const filters = [
  ['all', 'الكل'],
  ['critical', 'خطر'],
  ['warning', 'متابعة'],
  ['healthy', 'مستقر'],
  ['issues', 'مشاكل'],
]

function formatDate(value) {
  if (!value) return 'لا يوجد نشاط'
  return new Date(value).toLocaleString('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' })
}

function expiryText(days) {
  if (days === null || days === undefined) return 'بدون تاريخ'
  if (days < 0) return `منتهي منذ ${Math.abs(days)} يوم`
  if (days === 0) return 'ينتهي اليوم'
  return `باقي ${days} يوم`
}

export default function Monitoring() {
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [lastCheckedAt, setLastCheckedAt] = useState(new Date())
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['tenant-monitoring'],
    queryFn: () => getTenantMonitoring().then(r => r.data),
    refetchInterval: 60000,
  })

  const rows = data?.tenants || []
  const summary = data?.summary || {}
  const quickFix = useMutation({
    mutationFn: ({ id, data }) => updateTenant(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-monitoring'] })
      qc.invalidateQueries({ queryKey: ['tenants'] })
    },
  })

  useEffect(() => {
    if (data) setLastCheckedAt(new Date())
  }, [data])

  function renewTenant(row) {
    const today = new Date()
    const base = row.subscription_ends_at && row.days_to_expiry > 0 ? new Date(row.subscription_ends_at) : today
    base.setDate(base.getDate() + 30)
    quickFix.mutate({
      id: row.tenant_id,
      data: {
        is_active: true,
        subscription_starts_at: today.toISOString().split('T')[0],
        subscription_ends_at: base.toISOString().split('T')[0],
        subscription_request_plan: null,
        subscription_request_ref: null,
      },
    })
  }

  const filtered = useMemo(() => {
    return rows.filter(row => {
      const matchesFilter = filter === 'all' || (filter === 'issues' ? row.health !== 'healthy' : row.health === filter)
      const needle = query.trim().toLowerCase()
      const matchesQuery = !needle || [row.name, getSpecialtyLabel(row.specialty), row.manager_name, row.manager_email, row.contact_phone, row.whatsapp_number]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(needle))
      return matchesFilter && matchesQuery
    })
  }, [rows, filter, query])

  return (
    <Layout compact>
      <div className="mx-auto max-w-[1320px]">
        <section className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-cyan-300">
                <Building2 size={21} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">مراقبة المراكز</h2>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  آخر فحص: {lastCheckedAt.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 text-sm font-black text-slate-950 shadow-sm transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCw size={17} className={isFetching ? 'animate-spin' : ''} />
                {isFetching ? 'جاري الفحص' : 'فحص الآن'}
              </button>
              <button
                onClick={() => setFilter(filter === 'issues' ? 'all' : 'issues')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-700 transition hover:bg-amber-100"
              >
                <Wrench size={17} />
                المشاكل فقط
              </button>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[620px]">
                <Metric icon={Building2} label="المراكز" value={summary.total || 0} detail={`${summary.active || 0} نشط`} />
                <Metric icon={Receipt} label="إيراد 30 يوم" value={IQD(summary.revenue_30_days || 0)} detail="فواتير" />
                <Metric icon={CreditCard} label="الديون" value={IQD(summary.debt_total || 0)} detail="تحصيل" danger={summary.debt_total > 0} />
                <Metric icon={MessageCircle} label="تنبيهات" value={(summary.failed_messages_30_days || 0) + (summary.low_inventory_count || 0)} detail="واتساب/مخزون" danger />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="بحث باسم المركز، المدير، الإيميل، أو الهاتف"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
            </div>
            <div className="grid grid-cols-5 gap-2 lg:w-[520px]">
              {filters.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`h-11 rounded-lg text-sm font-black transition ${
                    filter === key
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.25fr_0.95fr_1.25fr_0.9fr_1fr_0.95fr] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-500 xl:grid">
            <span>المركز</span>
            <span>الحالة والاشتراك</span>
            <span>الأرقام</span>
            <span>النشاط</span>
            <span>التنبيهات</span>
            <span>الإجراء</span>
          </div>

          {isLoading && (
            <div className="p-8 text-center text-sm font-bold text-slate-500">جاري تحميل المراقبة...</div>
          )}

          {!isLoading && filtered.map(row => (
            <MonitorRow
              key={row.tenant_id}
              row={row}
              onRenew={() => renewTenant(row)}
              fixing={quickFix.isPending}
            />
          ))}

          {!isLoading && !filtered.length && (
            <div className="p-10 text-center text-sm font-bold text-slate-400">
              لا توجد مراكز مطابقة للبحث الحالي
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}

function Metric({ icon: Icon, label, value, detail, danger = false }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${danger ? 'bg-rose-50 text-rose-600' : 'bg-cyan-50 text-cyan-700'}`}>
          <Icon size={16} />
        </span>
        <span className="truncate text-[11px] font-bold text-slate-400">{detail}</span>
      </div>
      <p className="mt-2 text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-lg font-black text-slate-950">{value}</p>
    </div>
  )
}

function MonitorRow({ row, onRenew, fixing }) {
  const meta = healthMeta[row.health] || healthMeta.warning
  const Icon = meta.icon
  const issues = row.issues?.length ? row.issues : ['لا توجد مشاكل واضحة']

  return (
    <article className={`relative border-b border-slate-100 bg-white px-4 py-3 last:border-b-0 hover:bg-slate-50/80 xl:grid xl:grid-cols-[1.25fr_0.95fr_1.25fr_0.9fr_1fr_0.95fr] xl:items-center xl:gap-4 ${meta.row}`}>
      <span className={`absolute right-0 top-0 h-full w-1 ${meta.mark}`} />

      <div className="min-w-0 pr-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Building2 size={19} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-slate-950">{row.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
              <Info icon={Wrench} text={getSpecialtyLabel(row.specialty)} />
              <Info icon={User} text={row.manager_name || 'لا يوجد مدير'} />
              <Info icon={Phone} text={row.contact_phone || row.whatsapp_number || 'لا يوجد رقم'} ltr />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 xl:mt-0">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-black ${meta.badge}`}>
          <Icon size={13} /> {meta.label}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
          {tenantPlanLabel(row)}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">
          {expiryText(row.days_to_expiry)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2 xl:mt-0">
        <Tiny label="سيارات" value={row.car_count} />
        <Tiny label="خدمات" value={row.service_count} />
        <Tiny label="فواتير" value={row.invoice_count} />
        <Tiny label="إيراد" value={IQD(row.revenue_30_days || 0)} />
        <Tiny label="ديون" value={IQD(row.debt_total || 0)} danger={row.debt_total > 0} />
      </div>

      <div className="mt-3 space-y-1 xl:mt-0">
        <Line icon={Clock3} text={formatDate(row.last_activity_at)} />
        <Line icon={MessageCircle} text={`${row.failed_messages_30_days || 0} رسائل فاشلة`} />
        <Line icon={Package} text={`${row.low_inventory_count || 0} مخزون منخفض`} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 xl:mt-0">
        {issues.slice(0, 3).map(issue => (
          <span
            key={issue}
            className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
              row.issues?.length ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
            }`}
          >
            {issue}
          </span>
        ))}
        {issues.length > 3 && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
            +{issues.length - 3}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 xl:mt-0 xl:justify-end">
        <RowActions row={row} onRenew={onRenew} fixing={fixing} />
      </div>
    </article>
  )
}

function RowActions({ row, onRenew, fixing }) {
  const issueText = (row.issues || []).join(' ')
  const needsSubscription = !row.is_active || issueText.includes('اشتراك') || row.days_to_expiry === null || row.days_to_expiry <= 7
  const needsData = issueText.includes('مدير') || issueText.includes('تواصل')
  const needsAlerts = row.failed_messages_30_days > 0 || row.low_inventory_count > 0

  if (row.health === 'healthy') {
    return (
      <span className="inline-flex h-9 items-center gap-1 rounded-lg bg-emerald-50 px-3 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
        <CheckCircle2 size={14} />
        لا يحتاج إصلاح
      </span>
    )
  }

  return (
    <>
      {needsSubscription && (
        <button
          onClick={onRenew}
          disabled={fixing}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CreditCard size={14} />
          {fixing ? 'جاري الإصلاح' : 'فعّل +30 يوم'}
        </button>
      )}
      {needsData && (
        <ActionLink to={`/admin/tenants?tenant=${row.tenant_id}`} icon={Settings} label="إصلاح البيانات" tone="slate" />
      )}
      {needsAlerts && (
        <ActionLink to={`/admin/tenants?tenant=${row.tenant_id}`} icon={Wrench} label="فتح المركز" tone="amber" />
      )}
      {!needsSubscription && !needsData && !needsAlerts && (
        <ActionLink to={`/admin/tenants?tenant=${row.tenant_id}`} icon={Wrench} label="مراجعة المركز" tone="slate" />
      )}
    </>
  )
}

function ActionLink({ to, icon: Icon, label, tone }) {
  const tones = {
    dark: 'bg-slate-950 text-white hover:bg-slate-800',
    slate: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100 hover:bg-amber-100',
  }
  return (
    <Link to={to} className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-black transition ${tones[tone]}`}>
      <Icon size={14} />
      {label}
    </Link>
  )
}

function Tiny({ label, value, danger = false }) {
  return (
    <div className={`min-w-0 rounded-md px-2 py-1.5 ${danger ? 'bg-rose-50' : 'bg-slate-50'}`}>
      <p className="truncate text-[10px] font-black text-slate-400">{label}</p>
      <p className={`mt-0.5 truncate text-xs font-black ${danger ? 'text-rose-700' : 'text-slate-950'}`}>{value}</p>
    </div>
  )
}

function Info({ icon: Icon, text, ltr = false }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <Icon size={13} className="shrink-0 text-slate-400" />
      <span className="max-w-[170px] truncate" dir={ltr ? 'ltr' : undefined}>{text}</span>
    </span>
  )
}

function Line({ icon: Icon, text }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-slate-600">
      <Icon size={14} className="shrink-0 text-slate-400" />
      <span className="truncate">{text}</span>
    </div>
  )
}
