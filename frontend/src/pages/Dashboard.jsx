import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { getDailyReport, getMonthlyReport } from '../api/reports'

export default function Dashboard() {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()

  const { data: daily } = useQuery({
    queryKey: ['daily', today],
    queryFn: () => getDailyReport(today).then(r => r.data),
  })
  const { data: monthly } = useQuery({
    queryKey: ['monthly', now.getFullYear(), now.getMonth() + 1],
    queryFn: () => getMonthlyReport(now.getFullYear(), now.getMonth() + 1).then(r => r.data),
  })

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-white mb-2">لوحة التحكم</h1>
      <p className="text-slate-400 text-sm mb-6">اليوم: {today}</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🔧" label="خدمات اليوم" value={daily?.service_count} color="blue" />
        <StatCard icon="💰" label="مبيعات اليوم" value={daily?.total_sales != null ? `${daily.total_sales.toLocaleString()} IQD` : null} color="green" />
        <StatCard icon="📅" label="خدمات الشهر" value={monthly?.service_count} color="orange" />
        <StatCard icon="⚠️" label="ديون معلقة" value={monthly?.pending_debts != null ? `${monthly.pending_debts.toLocaleString()} IQD` : null} color="red" />
      </div>
      {monthly && (
        <div className="bg-slate-800 rounded-2xl p-6">
          <h2 className="text-white font-bold mb-4">ملخص الشهر</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              ['إجمالي المبيعات', monthly.total_sales != null ? `${monthly.total_sales.toLocaleString()} IQD` : '—'],
              ['المحصّل', monthly.paid != null ? `${monthly.paid.toLocaleString()} IQD` : '—'],
              ['غير محصّل', monthly.unpaid != null ? `${monthly.unpaid.toLocaleString()} IQD` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-700 rounded-xl p-4">
                <div className="text-slate-400 text-sm">{k}</div>
                <div className="text-white font-bold mt-1">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
