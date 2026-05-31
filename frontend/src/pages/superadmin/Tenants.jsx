import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2, Phone, Mail, User, Calendar, CreditCard,
  Camera, MessageCircle, Bell, ShieldCheck, ChevronDown,
  ChevronUp, Tag, Clock, AlertCircle, AtSign, Smartphone
} from 'lucide-react'
import Layout from '../../components/Layout'
import { getTenants, createTenant, updateTenant, deleteTenant } from '../../api/tenants'
import { PLAN_ORDER, planName, planShortName, PLAN_DETAILS, IQD } from '../../constants/plans'

const emptyForm = {
  name: '', plan: 'basic', contact_phone: '',
  subscription_ends_at: '', manager_email: '',
  manager_phone: '', manager_name: '',
}

function remainingDays(date) {
  if (!date) return null
  return Math.ceil((new Date(date) - new Date()) / 86400000)
}

function InfoRow({ icon: Icon, label, value, mono }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon size={14} className="mt-0.5 shrink-0 text-slate-400" />
      <span className="text-slate-500 shrink-0">{label}:</span>
      <span className={`font-semibold text-slate-800 break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

function ContactChip({ icon: Icon, label, value, tone = 'slate' }) {
  if (!value) return null
  const colors = {
    cyan: 'border-cyan-100 bg-cyan-50 text-cyan-800',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    slate: 'border-slate-100 bg-white text-slate-700',
  }
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 ${colors[tone] || colors.slate}`}>
      <Icon size={15} className="shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
        <p className="truncate text-xs font-black" dir="ltr">{value}</p>
      </div>
    </div>
  )
}

function StatusBadge({ active }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
      {active ? 'نشط' : 'موقوف'}
    </span>
  )
}

function PlanBadge({ plan }) {
  const colors = { basic: 'bg-slate-100 text-slate-700', pro: 'bg-blue-100 text-blue-700', enterprise: 'bg-purple-100 text-purple-700' }
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors[plan] || colors.basic}`}>
      {planShortName(plan)}
    </span>
  )
}

function TenantCard({ t, onToggle, onDelete, onSavePlateToken }) {
  const [expanded, setExpanded] = useState(false)
  const [plateToken, setPlateToken] = useState('')
  const days = remainingDays(t.subscription_ends_at)
  const price = PLAN_DETAILS[t.plan]?.adminPrice || 0
  const registrationLabel = t.registration_method === 'email' ? 'تسجيل بالإيميل' : t.registration_method === 'whatsapp' ? 'تسجيل بالواتساب' : 'تسجيل غير محدد'
  const primaryPhone = t.manager_phone || t.whatsapp_number || t.contact_phone

  return (
    <div className={`surface rounded-xl overflow-hidden transition-all ${!t.is_active ? 'border-rose-200 bg-rose-50/30' : ''}`}>
      {/* ── Header ── */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Logo or icon */}
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
          {t.logo_url
            ? <img src={t.logo_url} alt="" className="w-full h-full object-cover" />
            : <Building2 size={18} className="text-slate-400" />}
        </div>

        {/* Name + phone */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-950 truncate">{t.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              {t.registration_method === 'email' ? <AtSign size={12} /> : <Smartphone size={12} />}
              {registrationLabel}
            </span>
            {t.registration_contact && <span className="truncate" dir="ltr">{t.registration_contact}</span>}
          </div>
        </div>

        {/* Plan + price */}
        <div className="hidden sm:flex flex-col items-end gap-1">
          <PlanBadge plan={t.plan} />
          <span className="text-xs font-bold text-slate-500">{IQD(price)}/شهر</span>
        </div>

        {/* Subscription end */}
        <div className="hidden md:flex flex-col items-end gap-1 min-w-[110px]">
          <span className="text-xs text-slate-500">ينتهي</span>
          <span className={`text-xs font-bold ${days !== null && days < 7 ? 'text-rose-600' : 'text-slate-700'}`}>
            {t.subscription_ends_at || 'غير محدد'}
          </span>
        </div>

        {/* Upgrade request */}
        {t.subscription_request_plan && (
          <span className="hidden lg:flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
            <AlertCircle size={11} /> طلب {planShortName(t.subscription_request_plan)}
          </span>
        )}

        {/* Status */}
        <StatusBadge active={t.is_active} />

        {/* Expand arrow */}
        <div className="text-slate-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-5 bg-slate-50/50">
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <ContactChip icon={t.registration_method === 'email' ? Mail : MessageCircle} label="بيانات التسجيل" value={t.registration_contact} tone="cyan" />
            <ContactChip icon={Phone} label="هاتف التواصل" value={primaryPhone} tone="emerald" />
            <ContactChip icon={Mail} label="إيميل المدير" value={t.manager_email} />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {/* المدير */}
            <div>
              <p className="text-xs font-black uppercase text-slate-400 mb-2">بيانات التسجيل والمدير</p>
              <div className="space-y-1.5">
                <InfoRow icon={User} label="الاسم" value={t.manager_name} />
                <InfoRow icon={Mail} label="الإيميل" value={t.manager_email} />
                <InfoRow icon={Smartphone} label="طريقة التسجيل" value={registrationLabel} />
                <InfoRow icon={MessageCircle} label="رقم المدير" value={t.manager_phone} />
                <InfoRow icon={Phone} label="هاتف المركز" value={t.contact_phone} />
              </div>
            </div>

            {/* الاشتراك */}
            <div>
              <p className="text-xs font-black uppercase text-slate-400 mb-2">الاشتراك</p>
              <div className="space-y-1.5">
                <InfoRow icon={CreditCard} label="الخطة" value={`${planShortName(t.plan)} — ${IQD(price)}/شهر`} />
                <InfoRow icon={Calendar} label="البداية" value={t.subscription_starts_at} />
                <InfoRow icon={Calendar} label="النهاية" value={t.subscription_ends_at || 'غير محدد'} />
                {days !== null && (
                  <InfoRow icon={Clock} label="متبقي"
                    value={days < 0 ? 'منتهي' : `${days} يوم`} />
                )}
                <InfoRow icon={Tag} label="ملاحظات" value={t.subscription_notes} />
                {t.subscription_request_plan && (
                  <InfoRow icon={AlertCircle} label="طلب ترقية" value={planShortName(t.subscription_request_plan)} />
                )}
                {t.trial_ends_at && (
                  <InfoRow icon={Clock} label="انتهاء التجربة" value={new Date(t.trial_ends_at).toLocaleDateString('ar-IQ')} />
                )}
              </div>
            </div>

            {/* الخدمات */}
            <div>
              <p className="text-xs font-black uppercase text-slate-400 mb-2">الخدمات</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500 shrink-0">واتساب:</span>
                  <span className={`font-semibold text-xs ${t.whatsapp_number ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {t.whatsapp_number || 'غير مفعّل'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500 shrink-0">واسندر API:</span>
                  <span className={`font-semibold text-xs ${t.has_wasnder_api_key ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {t.has_wasnder_api_key ? '✓ مفعّل' : 'غير مفعّل'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Camera size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500 shrink-0">كاميرا IP:</span>
                  <span className={`font-semibold text-xs ${t.ip_camera_url ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {t.ip_camera_url ? '✓ مربوطة' : 'غير مربوطة'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500 shrink-0">قراءة اللوحة:</span>
                  <span className={`font-semibold text-xs ${t.has_plate_recognizer_token ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {t.has_plate_recognizer_token ? '✓ مفعّل' : 'غير مفعّل'}
                  </span>
                </div>
                <InfoRow icon={Bell} label="التذكير" value={`${t.reminder_days || 30} يوم قبل`} />
              </div>
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                <p className="mb-2 text-xs font-black text-slate-500">مفتاح Plate Recognizer</p>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    type="password"
                    value={plateToken}
                    onChange={(e) => setPlateToken(e.target.value)}
                    placeholder={t.has_plate_recognizer_token ? 'يوجد مفتاح محفوظ — أدخل مفتاحاً جديداً للتحديث' : 'ألصق المفتاح لتفعيل قراءة اللوحات'}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                  <button
                    onClick={() => {
                      onSavePlateToken(t, plateToken)
                      setPlateToken('')
                    }}
                    disabled={!plateToken.trim()}
                    className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    حفظ المفتاح
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
            <button onClick={() => onToggle(t)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${t.is_active
                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
              {t.is_active ? 'إيقاف الاشتراك' : 'تفعيل الاشتراك'}
            </button>
            <button onClick={() => onDelete(t)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition">
              حذف المركز
            </button>
            <div className="mr-auto text-xs text-slate-400">
              أُنشئ: {t.created_at ? new Date(t.created_at).toLocaleDateString('ar-IQ') : '—'}
              {' · ID: '}{t.id}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminTenants() {
  const qc = useQueryClient()
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => getTenants().then(r => r.data),
  })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [activationResult, setActivationResult] = useState(null)

  const create = useMutation({
    mutationFn: () => createTenant({
      tenant: { name: form.name, plan: form.plan, contact_phone: form.contact_phone || null, subscription_ends_at: form.subscription_ends_at || null },
      manager_email: form.manager_email,
      manager_phone: form.manager_phone || null,
      manager_name: form.manager_name || null,
    }),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['tenants'] }); setShowForm(false); setForm(emptyForm); setActivationResult(res.data) },
  })

  const toggle = useMutation({
    mutationFn: (t) => updateTenant(t.id, { is_active: !t.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })

  const savePlateToken = useMutation({
    mutationFn: ({ tenant, token }) => updateTenant(tenant.id, { plate_recognizer_token: token.trim() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })

  const remove = useMutation({
    mutationFn: (id) => deleteTenant(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })

  const handleDelete = (t) => {
    if (window.confirm(`سيتم حذف مركز "${t.name}" وكل بياناته نهائياً. هل أنت متأكد؟`))
      remove.mutate(t.id)
  }

  const sorted = [...tenants].sort((a, b) => Number(a.is_active) - Number(b.is_active) || a.name.localeCompare(b.name, 'ar'))

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-700">care-car-saas</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">المراكز المشتركة</h2>
          <p className="mt-1 text-sm text-slate-500">{tenants.length} مركز · اضغط على أي مركز لعرض تفاصيله الكاملة</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition">
          مركز جديد
        </button>
      </div>

      {activationResult && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-emerald-800">تم إنشاء المركز بنجاح</p>
              <p className="mt-1 text-sm text-emerald-700">كود التفعيل: <span className="font-mono font-bold text-lg tracking-widest">{activationResult.activation_code}</span></p>
              <p className="mt-1 text-sm text-slate-600">واتساب: {activationResult.whatsapp_status === 'sent' ? 'تم الإرسال ✓' : activationResult.whatsapp_status === 'skipped' ? 'لم يُرسل (لا يوجد رقم)' : 'فشل — شارك الكود يدوياً'}</p>
              <p className="mt-1 text-xs text-slate-500">رابط التفعيل: carecar.online/activate</p>
            </div>
            <button onClick={() => setActivationResult(null)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">×</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="surface mb-6 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-950 mb-1">إضافة مركز + مدير</h3>
          <p className="text-sm text-slate-500 mb-5">سيصل كود التفعيل للمدير عبر الواتساب.</p>
          <div className="grid gap-4 lg:grid-cols-3">
            {[['name','اسم المركز *','text'],['contact_phone','هاتف المركز','text'],['subscription_ends_at','تاريخ انتهاء الاشتراك','date'],['manager_email','إيميل المدير *','text'],['manager_phone','هاتف المدير (واتساب)','text'],['manager_name','اسم المدير','text']].map(([k,p,t]) => (
              <input key={k} placeholder={p} value={form[k]} type={t}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            ))}
            <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400">
              {PLAN_ORDER.map(p => <option key={p} value={p}>{planName(p)} — {IQD(PLAN_DETAILS[p].adminPrice)}/شهر</option>)}
            </select>
          </div>
          {create.isError && <p className="text-red-600 text-sm mt-3">حدث خطأ، تحقق من البيانات.</p>}
          <div className="flex gap-3 mt-5">
            <button onClick={() => create.mutate()} disabled={!form.name || !form.manager_email}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
              {create.isPending ? 'جاري...' : 'إنشاء'}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700">إلغاء</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map(t => (
          <TenantCard
            key={t.id}
            t={t}
            onToggle={toggle.mutate}
            onDelete={handleDelete}
            onSavePlateToken={(tenant, token) => savePlateToken.mutate({ tenant, token })}
          />
        ))}
        {!tenants.length && (
          <div className="surface rounded-xl py-16 text-center text-slate-400 text-sm font-semibold">
            لا توجد مراكز بعد
          </div>
        )}
      </div>
    </Layout>
  )
}
