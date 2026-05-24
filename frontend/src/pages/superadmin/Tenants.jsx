import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import { getTenants, createTenant, updateTenant } from '../../api/tenants'

const emptyForm = {
  name: '',
  plan: 'basic',
  contact_phone: '',
  subscription_ends_at: '',
  manager_email: '',
  manager_password: '',
  manager_name: '',
}

export default function AdminTenants() {
  const qc = useQueryClient()
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => getTenants().then(r => r.data),
  })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const create = useMutation({
    mutationFn: () => createTenant({
      tenant: {
        name: form.name,
        plan: form.plan,
        contact_phone: form.contact_phone || null,
        subscription_ends_at: form.subscription_ends_at || null,
      },
      manager_email: form.manager_email,
      manager_password: form.manager_password,
      manager_name: form.manager_name || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); setShowForm(false); setForm(emptyForm) },
  })

  const toggle = useMutation({
    mutationFn: (t) => updateTenant(t.id, { is_active: !t.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-700">لوحة السوبر أدمن فقط</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">إدارة الشركات والمراكز المشتركة</h2>
          <p className="mt-2 text-sm text-slate-500">السوبر أدمن يجهز حساب المركز والاشتراك. تشغيل الكاميرا ورسائل الزبائن يتم من لوحة المركز.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
          مركز جديد
        </button>
      </div>

      {showForm && (
        <div className="surface mb-6 rounded-lg p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-950">إضافة مركز + مدير</h3>
              <p className="mt-1 text-sm text-slate-500">هذه بيانات تأسيسية للمركز، ويمكن للمركز لاحقاً إدارة تشغيله ورسائله من لوحته الخاصة.</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              ['name', 'اسم المركز *', 'text'],
              ['contact_phone', 'هاتف المركز', 'text'],
              ['subscription_ends_at', 'تاريخ انتهاء الاشتراك', 'date'],
              ['manager_email', 'إيميل المدير *', 'text'],
              ['manager_password', 'كلمة مرور المدير *', 'password'],
              ['manager_name', 'اسم المدير', 'text'],
            ].map(([k, p, t]) => (
              <input key={k} placeholder={p} value={form[k]} type={t}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            ))}
            <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100">
              {['basic', 'pro', 'enterprise'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {create.isError && <p className="text-red-600 text-sm mt-3">حدث خطأ، تحقق من البيانات أو من تكرار اسم المركز.</p>}
          <div className="flex gap-3 mt-5">
            <button onClick={() => create.mutate()}
              disabled={!form.name || !form.manager_email || !form.manager_password}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
              {create.isPending ? 'جاري...' : 'إنشاء'}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700">إلغاء</button>
          </div>
        </div>
      )}

      <div className="surface rounded-lg overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-sm text-slate-500">
            <tr>{['المركز', 'الخطة', 'الاشتراك', 'الكاميرا', 'واتساب', 'التذكير', 'الحالة', 'إجراء'].map(h => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} className="border-t border-slate-100 text-slate-700 hover:bg-slate-50">
                <td className="px-5 py-4">
                  <p className="font-bold text-slate-950">{t.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{t.contact_phone || 'لا يوجد هاتف'}</p>
                </td>
                <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{t.plan}</span></td>
                <td className="px-5 py-4 text-sm">{t.subscription_ends_at || 'غير محدد'}</td>
                <td className="px-5 py-4 text-sm">{t.ip_camera_url ? 'مربوطة' : 'غير مربوطة'}</td>
                <td className="px-5 py-4 text-sm">{t.whatsapp_number || 'غير مفعل'}</td>
                <td className="px-5 py-4 text-sm">{t.reminder_days || 30} يوم</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {t.is_active ? 'نشط' : 'موقوف'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => toggle.mutate(t)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${t.is_active ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    {t.is_active ? 'إيقاف' : 'تفعيل'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && <p className="text-slate-500 text-center py-8">لا توجد مراكز</p>}
      </div>
    </Layout>
  )
}
