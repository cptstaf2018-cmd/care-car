import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, BadgeCheck, Bell, CheckCircle2, ChevronDown, ChevronUp, Clock, Lock, Unlock, X } from 'lucide-react'
import Layout from '../../components/Layout'
import { getTenants, updateTenant } from '../../api/tenants'
import { PLAN_DETAILS, PLAN_ORDER, planShortName } from '../../constants/plans'

const PLAN_IQD = {
  basic: '100,000 IQD',
  pro: '150,000 IQD',
  enterprise: '250,000 IQD',
}

function daysLeft(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
  return diff
}

function trialDaysLeft(dt) {
  if (!dt) return null
  return Math.ceil((new Date(dt) - new Date()) / 86400000)
}

function statusBadge(t) {
  if (!t.is_active) return { label: 'مقفول', color: 'bg-rose-100 text-rose-700 border-rose-200' }
  if (t.subscription_ends_at) {
    const d = daysLeft(t.subscription_ends_at)
    if (d < 0) return { label: 'منتهي الاشتراك', color: 'bg-rose-100 text-rose-700 border-rose-200' }
    if (d <= 7) return { label: `ينتهي خلال ${d} يوم`, color: 'bg-amber-100 text-amber-700 border-amber-200' }
    return { label: `نشط · ${d} يوم`, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  }
  if (t.trial_ends_at) {
    const d = trialDaysLeft(t.trial_ends_at)
    if (d < 0) return { label: 'انتهت التجربة', color: 'bg-rose-100 text-rose-700 border-rose-200' }
    return { label: `تجريبي · ${d} يوم`, color: 'bg-blue-100 text-blue-700 border-blue-200' }
  }
  return { label: 'بدون تاريخ', color: 'bg-slate-100 text-slate-600 border-slate-200' }
}

export default function Subscriptions() {
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const highlightedId = Number(searchParams.get('tenant') || 0)
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => getTenants().then(r => r.data),
  })
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!highlightedId) return
    setExpanded(highlightedId)
    window.setTimeout(() => {
      document.getElementById(`subscription-${highlightedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 250)
  }, [highlightedId, tenants.length])

  const update = useMutation({
    mutationFn: ({ id, data }) => updateTenant(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })

  function approvePayment(t) {
    const plan = t.subscription_request_plan || t.plan
    const today = new Date()
    const ends = new Date(today)
    ends.setDate(ends.getDate() + 30)
    const endsStr = ends.toISOString().split('T')[0]
    update.mutate({
      id: t.id,
      data: {
        plan,
        is_active: true,
        subscription_starts_at: today.toISOString().split('T')[0],
        subscription_ends_at: endsStr,
        subscription_request_plan: null,
        subscription_request_ref: null,
      },
    })
  }

  function rejectRequest(t) {
    update.mutate({ id: t.id, data: { subscription_request_plan: null, subscription_request_ref: null } })
  }

  const pendingRequests = tenants.filter(t => t.subscription_request_ref)
  const sorted = [...tenants].sort((a, b) => {
    const aUrgent = !a.is_active || (a.subscription_ends_at && daysLeft(a.subscription_ends_at) < 0)
    const bUrgent = !b.is_active || (b.subscription_ends_at && daysLeft(b.subscription_ends_at) < 0)
    if (aUrgent !== bUrgent) return aUrgent ? -1 : 1
    return a.name.localeCompare(b.name, 'ar')
  })

  return (
    <Layout>
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wider text-cyan-600">care-car-saas</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">اشتراكات المراكز</h2>
        <p className="mt-1 text-sm text-slate-500">إدارة الاشتراكات والدفع والتفعيل لجميع المراكز</p>
      </div>

      {/* Pending payment requests */}
      <AnimatePresence>
        {pendingRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bell size={16} className="text-amber-600" />
              <p className="font-black text-amber-800">
                {pendingRequests.length} طلب دفع جديد يحتاج موافقة
              </p>
            </div>
            <div className="space-y-3">
              {pendingRequests.map(t => (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-4 py-3">
                  <div>
                    <p className="font-black text-slate-950">{t.name}</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      يطلب: <span className="font-bold text-slate-800">{planShortName(t.subscription_request_plan)} · {PLAN_IQD[t.subscription_request_plan]}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      رقم الإيشال: <span className="font-mono font-bold text-slate-800">{t.subscription_request_ref}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => rejectRequest(t)} disabled={update.isPending}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                      <X size={14} /> رفض
                    </button>
                    <button onClick={() => approvePayment(t)} disabled={update.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                      <CheckCircle2 size={14} /> تفعيل الاشتراك
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All centers */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : (
        <div className="space-y-3">
          {sorted.map(t => {
            const badge = statusBadge(t)
            const isOpen = expanded === t.id
            const days = daysLeft(t.subscription_ends_at)
            const trial = trialDaysLeft(t.trial_ends_at)
            const hasPending = !!t.subscription_request_ref
            return (
              <div
                key={t.id}
                id={`subscription-${t.id}`}
                className={`overflow-hidden rounded-xl border bg-white transition-shadow ${
                  highlightedId === t.id ? 'ring-4 ring-cyan-100 border-cyan-300' : hasPending ? 'border-amber-300' : !t.is_active ? 'border-rose-200' : 'border-slate-200'
                }`}
              >
                {/* Row header */}
                <div className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4"
                  onClick={() => setExpanded(isOpen ? null : t.id)}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg font-black ${!t.is_active ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-950">{t.name}</p>
                        {hasPending && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">طلب دفع</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {planShortName(t.plan)} · {PLAN_IQD[t.plan]}
                        {t.contact_phone ? ` · ${t.contact_phone}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded controls */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Plan */}
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-bold text-slate-500">الخطة</span>
                          <select value={t.plan}
                            onChange={e => update.mutate({ id: t.id, data: { plan: e.target.value } })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-cyan-400">
                            {PLAN_ORDER.map(p => (
                              <option key={p} value={p}>{planShortName(p)} · {PLAN_IQD[p]}</option>
                            ))}
                          </select>
                        </label>

                        {/* Start date */}
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-bold text-slate-500">بداية الاشتراك</span>
                          <input type="date" value={t.subscription_starts_at || ''}
                            onChange={e => update.mutate({ id: t.id, data: { subscription_starts_at: e.target.value || null } })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400" />
                        </label>

                        {/* End date */}
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-bold text-slate-500">انتهاء الاشتراك</span>
                          <input type="date" value={t.subscription_ends_at || ''}
                            onChange={e => update.mutate({ id: t.id, data: { subscription_ends_at: e.target.value || null } })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400" />
                        </label>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <span className="mb-1.5 block text-xs font-bold text-slate-500">إجراءات</span>
                          <button onClick={() => update.mutate({ id: t.id, data: { is_active: !t.is_active } })}
                            disabled={update.isPending}
                            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition disabled:opacity-50 ${t.is_active ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                            {t.is_active ? <><Lock size={14} /> قفل الحساب</> : <><Unlock size={14} /> تفعيل الحساب</>}
                          </button>
                          {/* Quick +30 days */}
                          <button onClick={() => {
                            const base = t.subscription_ends_at && daysLeft(t.subscription_ends_at) > 0
                              ? new Date(t.subscription_ends_at)
                              : new Date()
                            base.setDate(base.getDate() + 30)
                            update.mutate({ id: t.id, data: { subscription_ends_at: base.toISOString().split('T')[0], is_active: true } })
                          }} disabled={update.isPending}
                            className="flex items-center justify-center gap-2 rounded-lg bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-700 hover:bg-cyan-100 disabled:opacity-50">
                            <BadgeCheck size={14} /> تجديد 30 يوم
                          </button>
                        </div>
                      </div>

                      {/* Trial info */}
                      {t.trial_ends_at && !t.subscription_ends_at && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                          <Clock size={14} />
                          <span className="font-bold">
                            {trial !== null && trial >= 0
                              ? `في فترة التجربة المجانية — تنتهي خلال ${trial} يوم`
                              : 'انتهت فترة التجربة المجانية — يحتاج اشتراكاً مدفوعاً'}
                          </span>
                        </div>
                      )}

                      {/* Pending request detail */}
                      {hasPending && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                          <div className="flex items-center gap-2 text-sm">
                            <AlertTriangle size={14} className="text-amber-600" />
                            <span className="font-bold text-amber-800">
                              طلب ترقية لـ {planShortName(t.subscription_request_plan)} · رقم الإيشال: <span className="font-mono">{t.subscription_request_ref}</span>
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => rejectRequest(t)} disabled={update.isPending}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                              رفض
                            </button>
                            <button onClick={() => approvePayment(t)} disabled={update.isPending}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                              تفعيل +30 يوم
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
          {tenants.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
              <p className="text-sm text-slate-500">لا توجد مراكز مشتركة بعد</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
