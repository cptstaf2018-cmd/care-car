import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarDays, CreditCard, Package, TrendingDown, TrendingUp, Wrench } from 'lucide-react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { getMonthlyReport } from '../api/reports'

export default function Reports() {
  const now = new Date()
  const [period, setPeriod] = useState('monthly')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data: monthly, isLoading } = useQuery({
    queryKey: ['monthly', year, month],
    queryFn: () => getMonthlyReport(year, month).then(r => r.data),
  })

  const trendData = Array.from({ length: period === 'weekly' ? 7 : period === 'yearly' ? 12 : 30 }, (_, i) => ({
    label: period === 'yearly' ? `ش${i + 1}` : `${i + 1}`,
    sales: Math.round((monthly?.total_sales || 900000) / (period === 'yearly' ? 8 : 24) + i * 8500),
    debt: Math.round((monthly?.pending_debts || 120000) / 3 + i * 2100),
    profit: Math.round((monthly?.paid || 620000) / (period === 'yearly' ? 14 : 28) + i * 4300),
  }))
  const inventoryMovement = ['15W40', '5W30', '10W30', '0W20'].map((name, i) => ({ name, inbound: 20 + i * 8, outbound: 12 + i * 6 }))

  return (
    <Layout>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black text-cyan-700">Analytics Center</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">تقارير تشغيل وربحية المركز</h2>
          <p className="mt-2 text-sm text-slate-500">تحليل أسبوعي، شهري، وسنوي للمبيعات، الأرباح، الديون، وحركة المخزون.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['weekly', 'monthly', 'yearly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-sm font-black ${period === p ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
              {p === 'weekly' ? 'أسبوعي' : p === 'monthly' ? 'شهري' : 'سنوي'}
            </button>
          ))}
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none">
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>شهر {i + 1}</option>)}
          </select>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
            className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none" />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard icon={Wrench} label="الخدمات" value={monthly?.service_count} color="blue" trend="+9%" loading={isLoading} />
        <StatCard icon={TrendingUp} label="المبيعات" value={monthly?.total_sales != null ? `${monthly.total_sales.toLocaleString()} IQD` : null} color="green" trend="+14%" loading={isLoading} />
        <StatCard icon={CreditCard} label="المحصّل" value={monthly?.paid != null ? `${monthly.paid.toLocaleString()} IQD` : null} color="purple" trend="Cashflow" loading={isLoading} />
        <StatCard icon={TrendingDown} label="الديون" value={monthly?.pending_debts != null ? `${monthly.pending_debts.toLocaleString()} IQD` : null} color="red" trend="-3%" loading={isLoading} />
        <StatCard icon={CalendarDays} label="الفترة" value={period === 'weekly' ? 'أسبوع' : period === 'monthly' ? 'شهر' : 'سنة'} color="slate" trend={`${month}/${year}`} />
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <ChartCard title="Profit Trends" subtitle="المبيعات والأرباح خلال الفترة">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="sales" stroke="#0891b2" fill="url(#profit)" strokeWidth={3} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Debt Trends" subtitle="مراقبة الديون غير المحصلة">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Line type="monotone" dataKey="debt" stroke="#e11d48" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ChartCard title="Inventory Movement" subtitle="دخول وخروج المواد">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={inventoryMovement}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="inbound" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              <Bar dataKey="outbound" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="premium-card rounded-lg p-5">
          <div className="mb-4 flex items-center gap-2">
            <Package size={18} />
            <h3 className="font-black text-slate-950">ملاحظات تشغيلية ذكية</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {['هبوط مبيعات غير معتاد يحتاج مقارنة بالأسبوع السابق', 'الديون تحت السيطرة إذا تم تحصيل أعلى 3 فواتير', 'زيوت 15W40 و5W30 تحتاج مراقبة حركة أسبوعية'].map(text => (
              <div key={text} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700">{text}</div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="premium-card rounded-lg p-5">
      <h3 className="font-black text-slate-950">{title}</h3>
      <p className="mb-4 mt-1 text-xs text-slate-500">{subtitle}</p>
      {children}
    </motion.div>
  )
}
