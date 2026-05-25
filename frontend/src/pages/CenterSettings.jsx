import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { getCenterSettings, updateCenterSettings } from '../api/settings'

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
        <h2 className="mt-1 text-2xl font-bold text-slate-950">واتساب المركز، الكاميرا، والشعار</h2>
        <p className="mt-2 text-sm text-slate-500">هذه الصفحة تخص المركز نفسه. السوبر أدمن يدير الاشتراك فقط ولا يرسل رسائل الزبائن.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="surface rounded-lg p-6">
          <h3 className="font-bold text-slate-950">هوية المركز</h3>
          <div className="mt-5 space-y-4">
            <input value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)}
              placeholder="هاتف المركز"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            <input value={form.logo_url} onChange={e => update('logo_url', e.target.value)}
              placeholder="رابط شعار المركز Logo URL"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">معاينة الشعار</p>
              <div className="mt-3 flex h-20 items-center justify-center rounded-lg bg-white">
                {form.logo_url ? <img src={form.logo_url} alt="Center logo" className="max-h-16 max-w-full object-contain" /> : <span className="text-sm text-slate-400">لم يتم إضافة شعار</span>}
              </div>
            </div>
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
          <p className="mt-4 text-xs leading-6 text-slate-500">مثال: rtsp://user:pass@192.168.1.50:554/stream1. عند الربط الفعلي سيستخدمها النظام لالتقاط صورة السيارة.</p>
        </section>

        <section className="surface rounded-lg p-6 xl:col-span-2">
          <h3 className="font-bold text-slate-950">واتساب WasnderAPI والتذكيرات</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <input value={form.whatsapp_number} onChange={e => update('whatsapp_number', e.target.value)}
              placeholder="رقم واتساب المركز"
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            <input value={form.wasnder_api_key} onChange={e => update('wasnder_api_key', e.target.value)}
              placeholder="WasnderAPI Key"
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

      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => save.mutate()} disabled={save.isPending}
          className="rounded-lg bg-slate-950 px-7 py-3 text-sm font-bold text-white disabled:opacity-50">
          {save.isPending ? 'جاري الحفظ...' : 'حفظ إعدادات المركز'}
        </button>
        {save.isSuccess && <span className="text-sm font-semibold text-emerald-700">تم الحفظ</span>}
        {save.isError && <span className="text-sm font-semibold text-rose-700">تعذر الحفظ</span>}
      </div>
    </Layout>
  )
}
