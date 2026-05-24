import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { getDailyReport, getMonthlyReport } from '../api/reports'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function Reports() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data: monthly } = useQuery({
    queryKey: ['monthly', year, month],
    queryFn: () => getMonthlyReport(year, month).then(r => r.data),
  })

  const chartData = monthly ? [
    { name: 'المبيعات', value: monthly.total_sales },
    { name: 'المحصّل', value: monthly.paid },
    { name: 'غير محصّل', value: monthly.unpaid },
    { name: 'الديون', value: monthly.pending_debts },
  ] : []

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-white mb-6">التقارير</h1>
      <div className="flex gap-4 mb-6 items-center">
        <select value={month} onChange={e => setMonth(Number(e.target.value))}
          className="bg-slate-800 text-white rounded-xl px-4 py-2 outline-none">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>شهر {i + 1}</option>
          ))}
        </select>
        <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
          className="bg-slate-800 text-white rounded-xl px-4 py-2 w-28 outline-none" />
      </div>

      {monthly && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              ['📋', 'عدد الخدمات', monthly.service_count, 'border-blue-500'],
              ['💰', 'إجمالي المبيعات', `${monthly.total_sales?.toLocaleString()} IQD`, 'border-green-500'],
              ['✅', 'المحصّل', `${monthly.paid?.toLocaleString()} IQD`, 'border-green-400'],
              ['⚠️', 'الديون المعلقة', `${monthly.pending_debts?.toLocaleString()} IQD`, 'border-red-500'],
            ].map(([icon, label, value, border]) => (
              <div key={label} className={`bg-slate-800 rounded-2xl p-5 border-r-4 ${border}`}>
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-slate-400 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="bg-slate-800 rounded-2xl p-6">
            <h2 className="text-white font-bold mb-4">مقارنة بيانية</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#f1f5f9' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Layout>
  )
}
