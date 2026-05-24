import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import client from '../../api/client'

const emptyForm = { name: '', plan: 'basic', contact_phone: '', manager_email: '', manager_password: '', manager_name: '' }

export default function AdminTenants() {
  const qc = useQueryClient()
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => client.get('/tenants/').then(r => r.data),
  })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const create = useMutation({
    mutationFn: () => client.post('/tenants/', {
      tenant: { name: form.name, plan: form.plan, contact_phone: form.contact_phone || null },
      manager_email: form.manager_email,
      manager_password: form.manager_password,
      manager_name: form.manager_name || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); setShowForm(false); setForm(emptyForm) },
  })

  const toggle = useMutation({
    mutationFn: (t) => client.patch(`/tenants/${t.id}`, { is_active: !t.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">إدارة المراكز</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold">
          + مركز جديد
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">إضافة مركز + مدير</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['name', 'اسم المركز *'],
              ['contact_phone', 'هاتف المركز'],
              ['manager_email', 'إيميل المدير *'],
              ['manager_password', 'كلمة مرور المدير *'],
              ['manager_name', 'اسم المدير'],
            ].map(([k, p]) => (
              <input key={k} placeholder={p} value={form[k]} type={k === 'manager_password' ? 'password' : 'text'}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                className="bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
            ))}
            <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}
              className="bg-slate-700 text-white rounded-xl px-4 py-3 outline-none">
              {['basic', 'pro', 'enterprise'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {create.isError && <p className="text-red-400 text-sm mt-2">حدث خطأ — تحقق من البيانات</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => create.mutate()}
              disabled={!form.name || !form.manager_email || !form.manager_password}
              className="bg-green-600 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-semibold">
              {create.isPending ? 'جاري...' : 'إنشاء'}
            </button>
            <button onClick={() => setShowForm(false)} className="bg-slate-700 text-white px-6 py-2 rounded-xl">إلغاء</button>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-700 text-slate-300 text-sm">
            <tr>{['المركز', 'الخطة', 'الحالة', 'إجراء'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} className="border-t border-slate-700 text-white hover:bg-slate-700/50">
                <td className="px-4 py-3 font-semibold">{t.name}</td>
                <td className="px-4 py-3"><span className="bg-blue-900/50 text-blue-400 px-2 py-1 rounded text-xs">{t.plan}</span></td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${t.is_active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {t.is_active ? 'نشط' : 'موقوف'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle.mutate(t)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition ${t.is_active ? 'bg-red-900/50 text-red-400 hover:bg-red-800' : 'bg-green-900/50 text-green-400 hover:bg-green-800'}`}>
                    {t.is_active ? 'إيقاف' : 'تفعيل'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && <p className="text-slate-400 text-center py-8">لا توجد مراكز</p>}
      </div>
    </Layout>
  )
}
