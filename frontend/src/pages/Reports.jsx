import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CreditCard, TrendingUp, Wallet, Wrench } from 'lucide-react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { getSalesSeries } from '../api/reports'
import { getInventory } from '../api/inventory'

const PERIODS = [
  { id: 'weekly', label: 'أسبوعي' },
  { id: 'monthly', label: 'شهري' },
  { id: 'yearly', label: 'سنوي' },
]
const TOP_ITEMS = 6
const CHART = { amber: '#F0A33A', ok: '#4CC38A', alert: '#E5533D', grid: '#CFDEDB', tick: '#3F5F5D', petrol: '#0D3B3E' }
const TOOLTIP_STYLE = { background: '#082628', border: '1px solid #1D5A5E', borderRadius: 12, color: '#E8F1EF' }

const money = (n) => `${Math.round(n || 0).toLocaleString('en-US')} د.ع`
const fmt = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { weekday: 'short' })
const monthFmt = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { month: 'short' })

function axisLabel(date, period) {
  if (period === 'yearly') return monthFmt.format(new Date(`${date}-01T00:00:00`))
  if (period === 'weekly') return fmt.format(new Date(`${date}T00:00:00`))
  return String(Number(date.slice(8)))
}

function sum(points, key) {
  return points.reduce((total, p) => total + p[key], 0)
}

/** Plain-language findings computed from the real numbers on screen. */
function buildInsights(points, period, lowStockCount) {
  const total = sum(points, 'sales')
  if (!total) return ['ما كو مبيعات بهذي الفترة. سجّل خدمة وتظهر هنا الأرقام.']
  const best = points.reduce((a, b) => (b.sales > a.sales ? b : a))
  const activeBuckets = points.filter((p) => p.sales > 0).length
  const unpaidShare = Math.round((sum(points, 'unpaid') / total) * 100)
  const unit = period === 'yearly' ? 'شهر' : 'يوم'
  const insights = [
    `أفضل ${unit}: ${axisLabel(best.date, period)} بمبيعات ${money(best.sales)}.`,
    `معدلك بالـ${unit} الفعّال: ${money(total / activeBuckets)} (${activeBuckets} ${unit} فيه شغل).`,
    unpaidShare > 0 ? `${unpaidShare}٪ من المبيعات لسا ما انقبضت، وهي ${money(sum(points, 'unpaid'))}.` : 'كل مبيعات هذي الفترة انقبضت.',
  ]
  if (lowStockCount > 0) insights.push(`${lowStockCount} مواد وصلت للحد الأدنى بالمخزون.`)
  return insights
}

export default function Reports() {
  const now = new Date()
  const [period, setPeriod] = useState('monthly')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data, isLoading } = useQuery({
    queryKey: ['series', period, year, month],
    queryFn: () => getSalesSeries(period, year, month).then((r) => r.data),
  })
  const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: () => getInventory().then((r) => r.data) })

  const points = (data?.points || []).map((p) => ({ ...p, label: axisLabel(p.date, period) }))
  const totalSales = sum(points, 'sales')
  const paid = sum(points, 'paid')
  const unpaid = sum(points, 'unpaid')
  const topItems = [...(inventory || [])]
    .filter((item) => Number(item.total_sold) > 0)
    .sort((a, b) => Number(b.total_sold) - Number(a.total_sold))
    .slice(0, TOP_ITEMS)
    .map((item) => ({ name: item.oil_type, مباع: Number(item.total_sold), متوفر: Number(item.quantity) }))
  const lowStockCount = (inventory || []).filter((item) => item.low_stock).length

  return (
    <Layout>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold text-oil-dark">تقارير المركز</p>
          <h2 className="mt-1 text-2xl font-bold text-petrol-deep">شنو سوّى مركزك؟</h2>
          <p className="mt-2 text-sm text-mint-ink">أرقام حقيقية من فواتيرك وخدماتك ومخزونك، بالأسبوع أو الشهر أو السنة.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              aria-pressed={period === p.id}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil ${
                period === p.id ? 'bg-petrol text-mint' : 'border border-mint-dim bg-white text-petrol'
              }`}
            >
              {p.label}
            </button>
          ))}
          {period === 'monthly' && (
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              aria-label="الشهر"
              className="rounded-full border border-mint-dim bg-white px-3 py-2 text-sm font-bold text-petrol outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>شهر {i + 1}</option>)}
            </select>
          )}
          {period !== 'weekly' && (
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="السنة"
              className="w-24 rounded-full border border-mint-dim bg-white px-3 py-2 text-sm font-bold text-petrol outline-none"
            />
          )}
        </div>
      </div>

      <section className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={Wrench} label="الخدمات" value={sum(points, 'services')} color="blue" loading={isLoading} />
        <StatCard icon={TrendingUp} label="المبيعات" value={money(totalSales)} color="blue" loading={isLoading} />
        <StatCard icon={Wallet} label="المحصّل" value={money(paid)} color="green" fraction={totalSales ? paid / totalSales : 0} loading={isLoading} />
        <StatCard icon={CreditCard} label="غير مدفوع" value={money(unpaid)} color="red" fraction={totalSales ? unpaid / totalSales : 0} loading={isLoading} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <ChartCard title="المبيعات والمحصّل" subtitle="كم بعت وكم انقبض فعلاً">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={points}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART.amber} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={CHART.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART.tick, fontFamily: 'inherit' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 12, fill: CHART.tick, fontFamily: 'inherit' }} width={56} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => money(v)} />
              <Area type="monotone" dataKey="sales" name="المبيعات" stroke={CHART.amber} fill="url(#salesFill)" strokeWidth={3} />
              <Line type="monotone" dataKey="paid" name="المحصّل" stroke={CHART.ok} strokeWidth={3} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="غير المدفوع" subtitle="المبالغ اللي لسا ما انقبضت">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART.tick, fontFamily: 'inherit' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 12, fill: CHART.tick, fontFamily: 'inherit' }} width={56} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => money(v)} />
              <Line type="monotone" dataKey="unpaid" name="غير مدفوع" stroke={CHART.alert} strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ChartCard title="الأكثر مبيعاً من المخزون" subtitle="المباع حتى اليوم مقابل المتوفر">
          {topItems.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-mint-dim py-12 text-center text-sm text-mint-ink">
              لسا ما انباع شي من المخزون. أول خدمة تخصم مادة تظهر هنا.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topItems}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART.tick, fontFamily: 'inherit' }} interval={0} />
                <YAxis tick={{ fontSize: 12, fill: CHART.tick, fontFamily: 'inherit' }} width={36} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="مباع" fill={CHART.amber} radius={[6, 6, 0, 0]} />
                <Bar dataKey="متوفر" fill={CHART.petrol} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="الخلاصة" subtitle="مستخرجة من أرقام الفترة اللي تشوفها">
          <ul className="grid gap-3">
            {buildInsights(points, period, lowStockCount).map((text) => (
              <li key={text} className="border-s-2 border-oil bg-white px-4 py-3 text-sm font-medium leading-7 text-petrol-deep">{text}</li>
            ))}
          </ul>
        </ChartCard>
      </section>
    </Layout>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-mint-dim bg-white/70 p-5">
      <h3 className="font-bold text-petrol-deep">{title}</h3>
      <p className="mb-4 mt-1 text-xs text-mint-ink">{subtitle}</p>
      {children}
    </motion.div>
  )
}
