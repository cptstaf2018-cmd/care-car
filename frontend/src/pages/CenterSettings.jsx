import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { getCenterSettings, updateCenterSettings, requestSubscription, uploadLogo } from '../api/settings'
import { PLAN_DETAILS } from '../constants/plans'

const PLANS = [
  {
    id: 'basic',
    name: PLAN_DETAILS.basic.name,
    price: PLAN_DETAILS.basic.price,
    features: ['إدارة السيارات والعملاء', 'الفواتير والمخزون', 'التقارير'],
    noFeatures: ['كاميرا IP', 'واتساب التذكيرات'],
    color: 'slate',
  },
  {
    id: 'pro',
    name: PLAN_DETAILS.pro.name,
    price: PLAN_DETAILS.pro.price,
    badge: 'الأكثر طلباً',
    features: ['كل ميزات الخطة الأساسية', 'كاميرا IP', 'واتساب التذكيرات', 'تقارير متقدمة'],
    noFeatures: [],
    color: 'cyan',
  },
  {
    id: 'enterprise',
    name: PLAN_DETAILS.enterprise.name,
    price: PLAN_DETAILS.enterprise.price,
    features: ['كل ميزات الخطة الاحترافية', 'دعم فني 24/7', 'إعداد مخصص'],
    noFeatures: [],
    color: 'violet',
  },
]

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

function SubscriptionSection({ center }) {
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [paymentRef, setPaymentRef] = useState('')
  const [submitted, setSubmitted] = useState(!!center?.subscription_request_ref)

  const sub = useMutation({
    mutationFn: () => requestSubscription(selectedPlan, paymentRef),
    onSuccess: () => setSubmitted(true),
  })

  if (isSubscriptionActive(center?.subscription_ends_at)) return null

  const planPrice = PLANS.find(p => p.id === selectedPlan)?.price || ''

  return (
    <section className="surface rounded-xl p-6">
      <h3 className="text-lg font-bold text-slate-950">خطط الاشتراك</h3>
      <p className="mt-1 text-sm text-slate-500">اختر الخطة المناسبة لمركزك — الدفع شهري بالدينار العراقي</p>

      {/* Plans grid */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {PLANS.map(plan => (
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
          <p className="font-bold text-slate-950">طريقة الدفع — سوبر كي</p>
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
                  disabled={!paymentRef.trim() || sub.isPending}
                  className="w-full rounded-lg bg-slate-950 py-3 text-sm font-bold text-white disabled:opacity-50 hover:bg-slate-800"
                >
                  {sub.isPending ? 'جاري الإرسال...' : `إرسال طلب الاشتراك — ${PLANS.find(p => p.id === selectedPlan)?.name}`}
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
  contact_phone: '',
  logo_url: '',
  ip_camera_url: '',
  ip_camera_username: '',
  ip_camera_password: '',
  whatsapp_number: '',
  wasnder_api_key: '',
  reminder_days: 30,
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

export default function CenterSettings() {
  const qc = useQueryClient()
  const [form, setForm] = useState(defaultForm)
  const { data: center } = useQuery({
    queryKey: ['center-settings'],
    queryFn: () => getCenterSettings().then(r => r.data),
  })

  useEffect(() => {
    if (center) {
      setForm({
        contact_phone: center.contact_phone || '',
        logo_url: center.logo_url || '',
        ip_camera_url: center.ip_camera_url || '',
        ip_camera_username: center.ip_camera_username || '',
        ip_camera_password: '',
        whatsapp_number: center.whatsapp_number || '',
        wasnder_api_key: '',
        reminder_days: center.reminder_days || 30,
        reminder_message_template: center.reminder_message_template || '',
      })
    }
  }, [center])

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
        <p className="mt-2 text-sm text-slate-500">إدارة بيانات مركزك، الكاميرا، الواتساب، وخطة الاشتراك.</p>
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
        </section>

        <section className="surface rounded-lg p-6 xl:col-span-2">
          <h3 className="font-bold text-slate-950">واتساب والتذكيرات التلقائية</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <input value={form.whatsapp_number} onChange={e => update('whatsapp_number', e.target.value)}
              placeholder="رقم واتساب المركز"
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            <input value={form.wasnder_api_key} onChange={e => update('wasnder_api_key', e.target.value)}
              placeholder="مفتاح واتساب API"
              type="password"
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            <input value={form.reminder_days} onChange={e => update('reminder_days', e.target.value)}
              placeholder="التذكير بعد كم يوم"
              type="number"
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
          </div>
          <textarea value={form.reminder_message_template} onChange={e => update('reminder_message_template', e.target.value)}
            rows={5}
            placeholder="قالب رسالة التذكير التسويقية"
            className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
          <p className="mt-3 text-xs leading-6 text-slate-500">يمكن استخدام: {'{customer_name}'}، {'{plate_number}'}، {'{center_name}'}، {'{center_phone}'}.</p>
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

      {/* Subscription section */}
      <div className="mt-8">
        <SubscriptionSection center={center} />
      </div>
    </Layout>
  )
}
