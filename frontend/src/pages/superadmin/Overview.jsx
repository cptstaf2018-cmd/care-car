import { useQuery } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import client from '../../api/client'

export default function AdminOverview() {
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => client.get('/tenants/').then(r => r.data),
  })
  const active = tenants.filter(t => t.is_active).length

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-white mb-6">👑 لوحة المدير العام</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 rounded-2xl p-6">
          <div className="text-3xl font-bold text-white">{tenants.length}</div>
          <div className="text-slate-400 mt-1">إجمالي المراكز</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-6">
          <div className="text-3xl font-bold text-green-400">{active}</div>
          <div className="text-slate-400 mt-1">مراكز نشطة</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-6">
          <div className="text-3xl font-bold text-red-400">{tenants.length - active}</div>
          <div className="text-slate-400 mt-1">مراكز موقوفة</div>
        </div>
      </div>
      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-700 text-slate-300 text-sm">
            <tr>{['المركز', 'الخطة', 'الهاتف', 'الحالة'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} className="border-t border-slate-700 text-white hover:bg-slate-700/50">
                <td className="px-4 py-3 font-semibold">{t.name}</td>
                <td className="px-4 py-3"><span className="bg-blue-900/50 text-blue-400 px-2 py-1 rounded text-xs font-bold">{t.plan}</span></td>
                <td className="px-4 py-3 text-slate-400">{t.contact_phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${t.is_active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {t.is_active ? 'نشط' : 'موقوف'}
                  </span>
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
