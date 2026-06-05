import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import Layout from '../components/Layout'
import { getCenterSettings, updateCenterSettings, requestSubscription, uploadLogo, getMobileCameraLink } from '../api/settings'
import { getCenterUsers, createCenterUser, updateCenterUser } from '../api/users'
import { PLAN_DETAILS, PLAN_ORDER, hasPlanFeature, isHigherPlan, nextPlan, planShortName, planUserLimit } from '../constants/plans'

const PLAN_COLORS = { basic: 'slate', pro: 'cyan', enterprise: 'violet' }
const PLAN_BADGES = { pro: 'الأكثر طلباً' }
const PLANS = PLAN_ORDER.map(id => ({
  id,
  ...PLAN_DETAILS[id],
  color: PLAN_COLORS[id] || 'slate',
  badge: PLAN_BADGES[id],
}))

function TrialBanner({ trialEndsAt, subscriptionEndsAt }) {
  if (subscriptionEndsAt) {
    const end = new Date(subscriptionEndsAt)
    const today = new Date()
    const daysLeft = Math.ceil((end - today) / 86400000)
    if (daysLeft > 0) {
      return (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-bold text-emerald-800">الاشتراك نشط</p>
            <p className="text-sm text-emerald-600">{daysLeft} يوم متبقية حتى انتهاء الاشتراك</p>
          </div>
        </div>
      )
    }
  }
  if (!trialEndsAt) return null
  const end = new Date(trialEndsAt)
  const today = new Date()
  const daysLeft = Math.ceil((end - today) / 86400000)
  if (daysLeft > 0) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
        <span className="text-2xl">⏳</span>
        <div>
          <p className="font-bold text-amber-800">فترة التجربة المجانية</p>
          <p className="text-sm text-amber-600">
            {daysLeft === 1 ? 'يوم واحد متبقي' : `${daysLeft} أيام متبقية`} — اشترك الآن لضمان الاستمرارية
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl bg-rose-50 border border-rose-200 px-5 py-4">
      <span className="text-2xl">🔒</span>
      <div>
        <p className="font-bold text-rose-800">انتهت فترة التجربة</p>
        <p className="text-sm text-rose-600">اختر خطة واشترك أدناه لاستعادة الوصول الكامل</p>
      </div>
    </div>
  )
}

function isSubscriptionActive(subscriptionEndsAt) {
  if (!subscriptionEndsAt) return false
  const end = new Date(subscriptionEndsAt)
  const today = new Date()
  return Math.ceil((end - today) / 86400000) > 0
}

function SubscriptionSection({ center, forceUpgrade = false }) {
  const initialPlan = nextPlan(center?.plan) || center?.plan || 'pro'
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [paymentRef, setPaymentRef] = useState('')
  const [submitted, setSubmitted] = useState(!!center?.subscription_request_ref)
  const [showUpgradeForm, setShowUpgradeForm] = useState(false)
  const subscriptionActive = isSubscriptionActive(center?.subscription_ends_at)
  const currentPlan = center?.plan || 'basic'
  const targetUpgradePlan = nextPlan(currentPlan)
  const canRequestSelectedPlan = !subscriptionActive || isHigherPlan(selectedPlan, currentPlan)
  const visiblePlans = subscriptionActive
    ? PLANS.filter(plan => isHigherPlan(plan.id, currentPlan))
    : PLANS

  const sub = useMutation({
    mutationFn: () => requestSubscription(selectedPlan, paymentRef),
    onSuccess: () => setSubmitted(true),
  })

  useEffect(() => {
    setSelectedPlan(nextPlan(center?.plan) || center?.plan || 'pro')
    setSubmitted(!!center?.subscription_request_ref)
  }, [center?.plan, center?.subscription_request_ref])

  useEffect(() => {
    if (forceUpgrade && targetUpgradePlan) setShowUpgradeForm(true)
  }, [forceUpgrade, targetUpgradePlan])

  const planPrice = PLANS.find(p => p.id === selectedPlan)?.price || ''
  const sectionTitle = subscriptionActive ? 'ترقية الاشتراك' : 'خطط الاشتراك'
  const sectionHint = subscriptionActive
    ? `خطتك الحالية ${planShortName(currentPlan)}. اختر خطة أعلى لتفعيل الميزات المقفلة.`
    : 'اختر الخطة المناسبة لمركزك — الدفع شهري بالدينار العراقي'
  const currentPlanDetails = PLAN_DETAILS[currentPlan]
  const daysLeft = center?.subscription_ends_at
    ? Math.ceil((new Date(center.subscription_ends_at) - new Date()) / 86400000)
    : null

  if (subscriptionActive && !showUpgradeForm && !submitted && !center?.subscription_request_ref) {
    return (
      <section className="surface rounded-xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">اشتراكك الحالي</p>
            <h3 className="mt-1 text-2xl font-black text-slate-950">
              اشتراك {currentPlanDetails?.shortName || planShortName(currentPlan)}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {daysLeft !== null ? `متبقي ${daysLeft} يوم` : 'اشتراك نشط'} · {currentPlanDetails?.price} دينار / شهر
            </p>
          </div>
          {targetUpgradePlan ? (
            <button
              onClick={() => setShowUpgradeForm(true)}
              className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
            >
              ترقية إلى {PLAN_DETAILS[targetUpgradePlan]?.shortName}
            </button>
          ) : (
            <span className="rounded-full bg-violet-50 px-4 py-2 text-sm font-black text-violet-700 ring-1 ring-violet-100">
              أعلى خطة مفعّلة
            </span>
          )}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {(currentPlanDetails?.features || []).slice(0, 3).map(feature => (
            <div key={feature} className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              {feature}
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="surface rounded-xl p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">{sectionTitle}</h3>
          <p className="mt-1 text-sm text-slate-500">{sectionHint}</p>
        </div>
        {subscriptionActive && (
          <button
            onClick={() => setShowUpgradeForm(false)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            عرض الاشتراك الحالي فقط
          </button>
        )}
      </div>

      {/* Plans grid */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {visiblePlans.map(plan => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative rounded-xl border-2 p-5 text-right transition-all ${
              selectedPlan === plan.id
                ? plan.color === 'cyan'
                  ? 'border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-100'
                  : plan.color === 'violet'
                    ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-100'
                    : 'border-slate-700 bg-slate-50 shadow-lg'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 right-4 rounded-full bg-cyan-500 px-3 py-0.5 text-xs font-bold text-white">
                {plan.badge}
              </span>
            )}
            {plan.id === currentPlan && subscriptionActive && (
              <span className="absolute -top-3 left-4 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-bold text-white">
                خطتك الحالية
              </span>
            )}
            {selectedPlan === plan.id && (
              <span className="absolute left-4 top-4 text-lg">✓</span>
            )}
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{plan.name}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{plan.price}</p>
            <p className="text-xs text-slate-500">دينار / شهر</p>
            <ul className="mt-4 space-y-1.5 text-right">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="text-emerald-500">✓</span> {f}
                </li>
              ))}
              {plan.noFeatures.map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-slate-400 line-through">
                  <span>✗</span> {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Payment section */}
      <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
          <p className="font-bold text-slate-950">{subscriptionActive ? 'دفع فرق/قيمة الترقية — سوبر كي' : 'طريقة الدفع — سوبر كي'}</p>
          <p className="text-sm text-slate-500 mt-0.5">
            ادفع <span className="font-bold text-slate-950">{planPrice} دينار</span> عبر سوبر كي ثم أدخل رقم الإيشال
          </p>
        </div>

        <div className="p-5 flex flex-col md:flex-row gap-6 items-center">
          {/* QR Code card — styled like the user's image */}
          <div className="flex-shrink-0">
            <div className="relative w-52 rounded-2xl overflow-hidden shadow-xl"
              style={{ background: 'linear-gradient(145deg, #FFD700, #FFA500)' }}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #fff 0%, transparent 50%)' }} />
              <div className="relative z-10 px-5 pt-5 pb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-slate-950 flex items-center justify-center">
                    <span className="text-white text-xs font-black">SK</span>
                  </div>
                  <p className="font-black text-slate-950 text-base">إستخدم سوبر كي</p>
                </div>
                <div className="bg-white rounded-xl p-2 shadow-inner">
                  <img
                    src="/superkey-qr.png"
                    alt="SuperKey QR Code"
                    className="w-full h-auto rounded-lg"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                  />
                  <div className="hidden w-full h-32 items-center justify-center text-slate-400 text-xs text-center">
                    QR Code<br/>سيضاف قريباً
                  </div>
                </div>
                <p className="mt-3 text-xs font-bold text-slate-800">سعد</p>
              </div>
            </div>
          </div>

          {/* Payment ref input */}
          <div className="flex-1 w-full">
            {submitted || center?.subscription_request_ref ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
                <p className="text-2xl mb-2">✅</p>
                <p className="font-bold text-emerald-800">تم استلام طلبك</p>
                <p className="text-sm text-emerald-600 mt-1">
                  الخطة: <strong>{PLANS.find(p => p.id === center?.subscription_request_plan)?.name || selectedPlan}</strong>
                </p>
                <p className="text-sm text-emerald-600">رقم الإيشال: <strong>{center?.subscription_request_ref}</strong></p>
                <p className="text-xs text-slate-500 mt-3">سيتم تفعيل اشتراكك خلال 24 ساعة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {!canRequestSelectedPlan && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                    هذه خطتك الحالية. اختر خطة أعلى حتى ترسل طلب ترقية.
                  </div>
                )}
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-sm font-bold text-amber-800">خطوات الدفع:</p>
                  <ol className="mt-2 space-y-1 text-xs text-amber-700 list-decimal list-inside">
                    <li>افتح تطبيق سوبر كي</li>
                    <li>اسكن الـ QR Code أو ابحث عن الحساب</li>
                    <li>ادفع مبلغ <strong>{planPrice} دينار</strong></li>
                    <li>انسخ رقم الإيشال وأدخله أدناه</li>
                  </ol>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الإيشال (رقم العملية) *</label>
                  <input
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder="مثال: TRX-20260528-XXXXXX"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>
                {sub.isError && (
                  <p className="text-sm text-rose-600">حدث خطأ، حاول مرة أخرى</p>
                )}
                <button
                  onClick={() => sub.mutate()}
                  disabled={!canRequestSelectedPlan || !paymentRef.trim() || sub.isPending}
                  className="w-full rounded-lg bg-slate-950 py-3 text-sm font-bold text-white disabled:opacity-50 hover:bg-slate-800"
                >
                  {sub.isPending ? 'جاري الإرسال...' : `إرسال طلب ${subscriptionActive ? 'الترقية' : 'الاشتراك'} — ${PLANS.find(p => p.id === selectedPlan)?.name}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

const defaultForm = {
  name: '',
  contact_phone: '',
  logo_url: '',
  ip_camera_url: '',
  ip_camera_username: '',
  ip_camera_password: '',
  whatsapp_number: '',
  wasnder_api_key: '',
  reminder_days: 20,
  reminder_message_template: '',
}

function LogoUpload({ currentUrl, onUploaded }) {
  const ref = useRef(null)
  const logoMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData()
      fd.append('file', file)
      return uploadLogo(fd).then(r => r.data)
    },
    onSuccess: (data) => onUploaded(data.logo_url),
  })
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500 mb-3">شعار المركز</p>
      <div className="flex h-20 items-center justify-center rounded-lg bg-white border border-dashed border-slate-300 mb-3">
        {currentUrl
          ? <img src={currentUrl} alt="شعار" className="max-h-16 max-w-full object-contain" />
          : <span className="text-sm text-slate-400">لم يتم إضافة شعار</span>}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={e => { if (e.target.files?.[0]) logoMutation.mutate(e.target.files[0]) }} />
      <button onClick={() => ref.current?.click()} disabled={logoMutation.isPending}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition">
        {logoMutation.isPending ? 'جاري الرفع...' : '📷 رفع شعار جديد (JPG/PNG/WebP)'}
      </button>
      {logoMutation.isError && (
        <p className="mt-1 text-xs text-rose-600">
          {logoMutation.error?.response?.data?.detail || 'فشل الرفع'}
        </p>
      )}
    </div>
  )
}

function CenterUsersSection({ center }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ email: '', full_name: '', password: '' })
  const { data, isLoading } = useQuery({
    queryKey: ['center-users'],
    queryFn: () => getCenterUsers().then(r => r.data),
    enabled: Boolean(center),
  })
  const users = data?.users || []
  const limit = data?.limit || planUserLimit(center?.plan)
  const canAdd = users.length < limit
  const createUser = useMutation({
    mutationFn: () => createCenterUser(form),
    onSuccess: () => {
      setForm({ email: '', full_name: '', password: '' })
      qc.invalidateQueries({ queryKey: ['center-users'] })
    },
  })
  const updateUser = useMutation({
    mutationFn: ({ id, data }) => updateCenterUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['center-users'] }),
  })

  return (
    <section className="surface mt-5 rounded-lg p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-950">المستخدمون والصلاحيات</h3>
          <p className="mt-1 text-sm text-slate-500">
            خطتك تسمح بـ {limit} {limit === 1 ? 'مستخدم' : 'مستخدمين'} داخل المركز.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {users.length}/{limit}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_180px_auto]">
        <input
          value={form.full_name}
          onChange={e => setForm({ ...form, full_name: e.target.value })}
          placeholder="اسم الموظف"
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
        <input
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          placeholder="بريد الدخول"
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
        <input
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          placeholder="كلمة مرور"
          type="password"
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
        <button
          onClick={() => createUser.mutate()}
          disabled={!canAdd || !form.email || !form.password || createUser.isPending}
          className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          إضافة مستخدم
        </button>
      </div>
      {!canAdd && (
        <div className="mt-3 rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">
          وصلت إلى حد المستخدمين في هذه الخطة. للزيادة، اطلب ترقية الاشتراك.
        </div>
      )}
      {createUser.isError && (
        <p className="mt-3 text-sm font-bold text-rose-600">
          {createUser.error?.response?.data?.detail || 'تعذر إضافة المستخدم'}
        </p>
      )}

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
        {isLoading ? (
          <p className="bg-slate-50 px-4 py-4 text-sm font-bold text-slate-500">جاري تحميل المستخدمين...</p>
        ) : users.map(item => (
          <div key={item.id} className="flex flex-col gap-3 border-b border-slate-100 bg-white px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-slate-950">{item.full_name || item.email}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{item.email} · {item.role === 'manager' ? 'مدير' : 'موظف'}</p>
            </div>
            <button
              disabled={item.role === 'manager' || updateUser.isPending}
              onClick={() => updateUser.mutate({ id: item.id, data: { is_active: !item.is_active } })}
              className={`rounded-lg px-4 py-2 text-xs font-black transition disabled:opacity-50 ${
                item.is_active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.is_active ? 'نشط' : 'متوقف'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function AssistantSection({ center }) {
  const enabled = hasPlanFeature(center?.plan, 'assistant')
  return (
    <section className={`surface mt-5 rounded-lg p-6 ${enabled ? 'border-cyan-100 bg-cyan-50/40' : ''}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-cyan-700">مساعد المركز</p>
          <h3 className="mt-1 font-bold text-slate-950">شات بوت احترافي للمركز</h3>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {enabled
              ? 'مساعد ذكي لمتابعة الأسئلة، فهم الميزات، وتجهيز رسائل وخطوات العمل داخل المركز.'
              : 'هذه الميزة ضمن الخطة المتوسطة فما فوق، وتظهر للمركز كمساعد احترافي عند الترقية.'}
          </p>
        </div>
        <a
          href={enabled ? '/center/settings#subscription-upgrade' : '/center/settings?upgrade=1'}
          className={`rounded-lg px-5 py-3 text-sm font-black transition ${
            enabled ? 'bg-white text-cyan-700 ring-1 ring-cyan-200 hover:bg-cyan-50' : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
          }`}
        >
          {enabled ? 'المساعد مفعل' : 'طلب الترقية'}
        </a>
      </div>
    </section>
  )
}

export default function CenterSettings() {
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState(defaultForm)
  const [mobileCameraQr, setMobileCameraQr] = useState('')
  const { data: center } = useQuery({
    queryKey: ['center-settings'],
    queryFn: () => getCenterSettings().then(r => r.data),
  })
  const isPartsStore = center?.specialty === 'multi_service'
  const mobileCameraEnabled = !isPartsStore && hasPlanFeature(center?.plan, 'camera')
  const oilServiceReminders = (center?.specialty || 'quick_service') === 'quick_service'
  const { data: mobileCameraLink } = useQuery({
    queryKey: ['mobile-camera-link', 'settings'],
    queryFn: () => getMobileCameraLink().then(r => r.data),
    enabled: Boolean(mobileCameraEnabled),
  })

  useEffect(() => {
    if (center) {
      setForm({
        contact_phone: center.contact_phone || '',
        name: center.name || '',
        logo_url: center.logo_url || '',
        ip_camera_url: center.ip_camera_url || '',
        ip_camera_username: center.ip_camera_username || '',
        ip_camera_password: '',
        whatsapp_number: center.whatsapp_number || '',
        wasnder_api_key: '',
        reminder_days: center.reminder_days || 20,
        reminder_message_template: center.reminder_message_template || '',
      })
    }
  }, [center])

  useEffect(() => {
    if (searchParams.get('upgrade') !== '1') return
    window.setTimeout(() => {
      document.getElementById('subscription-upgrade')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 250)
  }, [searchParams])

  useEffect(() => {
    if (!mobileCameraLink?.url) return
    QRCode.toDataURL(mobileCameraLink.url, { width: 220, margin: 1, errorCorrectionLevel: 'M' })
      .then(setMobileCameraQr)
      .catch(() => setMobileCameraQr(''))
  }, [mobileCameraLink?.url])

  const save = useMutation({
    mutationFn: () => updateCenterSettings({
      ...form,
      reminder_days: Number(form.reminder_days) || 30,
      ip_camera_password: form.ip_camera_password || undefined,
      wasnder_api_key: form.wasnder_api_key || undefined,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['center-settings'] }),
  })

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  return (
    <Layout>
      <div className="mb-6">
        <p className="text-sm font-semibold text-cyan-700">إعدادات المركز</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">الإعدادات والاشتراك</h2>
        <p className="mt-2 text-sm text-slate-500">
          {isPartsStore
            ? 'إدارة بيانات المتجر، الواتساب، المخزون، وخطة الاشتراك.'
            : 'إدارة بيانات مركزك، الكاميرا، الواتساب، وخطة الاشتراك.'}
        </p>
      </div>

      {/* Trial / Subscription status banner */}
      <TrialBanner
        trialEndsAt={center?.trial_ends_at}
        subscriptionEndsAt={center?.subscription_ends_at}
      />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="surface rounded-lg p-6">
          <h3 className="font-bold text-slate-950">هوية المركز</h3>
          <div className="mt-5 space-y-4">
            <input value={form.name} onChange={e => update('name', e.target.value)}
              placeholder="اسم المركز"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            <input value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)}
              placeholder="هاتف المركز"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            <LogoUpload
              currentUrl={form.logo_url}
              onUploaded={(url) => {
                update('logo_url', url)
                qc.invalidateQueries({ queryKey: ['center-settings'] })
                qc.invalidateQueries({ queryKey: ['center-settings', 'layout'] })
              }}
            />
          </div>
        </section>

        {!isPartsStore && (
        <section className="surface rounded-lg p-6">
          <h3 className="font-bold text-slate-950">ربط كاميرا IP</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input value={form.ip_camera_url} onChange={e => update('ip_camera_url', e.target.value)}
              placeholder="RTSP/HTTP Camera URL"
              className="md:col-span-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            <input value={form.ip_camera_username} onChange={e => update('ip_camera_username', e.target.value)}
              placeholder="اسم مستخدم الكاميرا"
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            <input value={form.ip_camera_password} onChange={e => update('ip_camera_password', e.target.value)}
              placeholder="كلمة مرور الكاميرا"
              type="password"
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
          </div>
          <p className="mt-4 text-xs leading-6 text-slate-500">مثال: rtsp://user:pass@192.168.1.50:554/stream1</p>
          {mobileCameraEnabled ? (
            <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
              <div className="grid gap-4 sm:grid-cols-[150px_1fr] sm:items-center">
                <div className="mx-auto rounded-xl border border-cyan-100 bg-white p-2">
                  {mobileCameraQr
                    ? <img src={mobileCameraQr} alt="QR ربط كاميرا الموبايل" className="h-32 w-32" />
                    : <div className="h-32 w-32 animate-pulse rounded-lg bg-slate-100" />}
                </div>
                <div>
                  <p className="font-black text-slate-950">ربط كاميرا الموبايل</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    هذا الباركود يستخدم مرة واحدة لتشغيل بث الموبايل إلى النظام. بعد التشغيل، يكون العمل اليومي من صفحة استقبال السيارة فقط.
                  </p>
                  {mobileCameraLink?.url && (
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(mobileCameraLink.url)}
                      className="mt-3 rounded-lg border border-cyan-200 bg-white px-4 py-2 text-xs font-black text-cyan-700 hover:bg-cyan-50"
                    >
                      نسخ رابط الربط
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50 p-4">
              <p className="font-black text-slate-950">كاميرا الموبايل وقراءة اللوحة ضمن الخطة المميزة</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                يمكنك حفظ رابط كاميرا IP الآن، لكن تشغيل QR كاميرا الموبايل وقراءة اللوحة CTK يتفعّل بعد الترقية.
              </p>
              <a href="/center/settings?upgrade=1" className="mt-3 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-xs font-black text-white hover:bg-violet-700">
                طلب ترقية للمميزة
              </a>
            </div>
          )}
        </section>
        )}

        <section className="surface rounded-lg p-6 xl:col-span-2">
          <h3 className="font-bold text-slate-950">واتساب ورسائل الديون</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <input value={form.whatsapp_number} onChange={e => update('whatsapp_number', e.target.value)}
              placeholder="رقم واتساب المركز"
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            <input value={form.wasnder_api_key} onChange={e => update('wasnder_api_key', e.target.value)}
              placeholder="مفتاح واتساب API"
              type="password"
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            {oilServiceReminders ? (
              <input value={form.reminder_days} onChange={e => update('reminder_days', e.target.value)}
                placeholder="تذكير الصيانة بعد كم يوم"
                type="number"
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
                تذكير الصيانة خاص بمراكز الزيوت فقط. مركزك يستخدم رسائل الديون واتساب.
              </div>
            )}
          </div>
          <div className="mt-4 rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-semibold leading-7 text-cyan-900">
            {oilServiceReminders
              ? 'الرسائل ثابتة داخل النظام: تذكير صيانة لمراكز الزيوت حسب المدة، ومطالبة دين كل 20 يوم ما دام الدين مفتوحا.'
              : 'الرسائل الثابتة لهذا الاختصاص: مطالبة دين واتساب كل 20 يوم ما دام الدين مفتوحا. لا يتم إرسال تذكير صيانة للسيارات هنا.'}
          </div>
        </section>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button onClick={() => save.mutate()} disabled={save.isPending}
          className="rounded-lg bg-slate-950 px-7 py-3 text-sm font-bold text-white disabled:opacity-50">
          {save.isPending ? 'جاري الحفظ...' : 'حفظ إعدادات المركز'}
        </button>
        {save.isSuccess && <span className="text-sm font-semibold text-emerald-700">تم الحفظ</span>}
        {save.isError && <span className="text-sm font-semibold text-rose-700">تعذر الحفظ</span>}
      </div>

      <CenterUsersSection center={center} />

      <AssistantSection center={center} />

      {/* Subscription section */}
      <div id="subscription-upgrade" className="mt-8 scroll-mt-6">
        <SubscriptionSection center={center} forceUpgrade={searchParams.get('upgrade') === '1'} />
      </div>
    </Layout>
  )
}
