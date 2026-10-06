import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import InstrumentCluster from '../components/cluster/InstrumentCluster'
import DueCarsList from '../components/cluster/DueCarsList'
import { getDailyReport, getMaintenanceDue, getMonthlyReport } from '../api/reports'
import { getInventory } from '../api/inventory'
import { getInvoices } from '../api/invoices'
import { getCenterSettings } from '../api/settings'
import { getPlatformAds } from '../api/platform'

const OIL_WARNING_DAYS = 5
const DUE_LIST_SIZE = 6
const RECENT_INVOICES = 5
const AD_ROTATE_MS = 6500
const MAINTENANCE_FETCH_LIMIT = 50

export default function Dashboard() {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()

  const dailyQuery = useQuery({ queryKey: ['daily', today], queryFn: () => getDailyReport(today).then((r) => r.data) })
  const monthlyQuery = useQuery({
    queryKey: ['monthly', now.getFullYear(), now.getMonth() + 1],
    queryFn: () => getMonthlyReport(now.getFullYear(), now.getMonth() + 1).then((r) => r.data),
  })
  const inventoryQuery = useQuery({ queryKey: ['inventory'], queryFn: () => getInventory().then((r) => r.data) })
  const invoicesQuery = useQuery({ queryKey: ['invoices'], queryFn: () => getInvoices().then((r) => r.data) })
  const centerQuery = useQuery({ queryKey: ['center-settings', 'dashboard'], queryFn: () => getCenterSettings().then((r) => r.data) })
  const dueQuery = useQuery({
    queryKey: ['maintenance-due'],
    queryFn: () => getMaintenanceDue(MAINTENANCE_FETCH_LIMIT).then((r) => r.data),
  })
  const adsQuery = useQuery({ queryKey: ['platform-ads'], queryFn: () => getPlatformAds().then((r) => r.data), staleTime: 5 * 60 * 1000 })

  const centerName = centerQuery.data?.name || 'مركزك'
  const isOilCenter = (centerQuery.data?.specialty || 'quick_service') === 'quick_service'
  const invoices = invoicesQuery.data || []
  const unpaidCount = invoices.filter((inv) => inv.status !== 'paid').length
  const lowStockCount = (inventoryQuery.data || []).filter((item) => item.low_stock).length
  const dueCars = (dueQuery.data?.cars || []).filter((car) => car.days_left <= OIL_WARNING_DAYS)
  const ads = Array.isArray(adsQuery.data) ? adsQuery.data : []

  return (
    <Layout compact>
      <div className="mx-auto grid max-w-3xl gap-5 pb-10">
        <InstrumentCluster
          centerName={centerName}
          daily={dailyQuery.data}
          monthly={monthlyQuery.data}
          warnings={{ oilDue: isOilCenter ? dueCars.length : undefined, lowStock: lowStockCount, debts: unpaidCount }}
        />

        {isOilCenter && (
          <section aria-labelledby="due-title" className="grid gap-3">
            <div className="flex items-baseline justify-between">
              <h2 id="due-title" className="text-lg font-bold text-petrol-deep">موعدهم قرّب</h2>
              <Link to="/center/cars" className="text-sm font-bold text-petrol underline underline-offset-4">كل السيارات</Link>
            </div>
            <DueCarsList
              cars={dueCars.slice(0, DUE_LIST_SIZE)}
              intervalDays={dueQuery.data?.interval_days || 20}
              centerName={centerName}
              loading={dueQuery.isLoading}
            />
          </section>
        )}

        <section aria-labelledby="recent-title" className="grid gap-3">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-title" className="text-lg font-bold text-petrol-deep">آخر الوصولات</h2>
            <Link to="/center/invoices" className="text-sm font-bold text-petrol underline underline-offset-4">كلها</Link>
          </div>
          {invoices.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-mint-dim bg-white p-6 text-center text-sm text-mint-ink">
              لسا ما كو وصولات. أول خدمة تسجّلها تطلع هنا.
            </p>
          ) : (
            <ul className="grid gap-2">
              {invoices.slice(0, RECENT_INVOICES).map((inv) => (
                <li key={inv.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-white p-3">
                  <span className="text-sm font-bold text-gauge" dir="ltr">#{inv.id}</span>
                  <div>
                    <p className="text-sm font-bold tabular-nums text-petrol-deep">{Number(inv.amount).toLocaleString('en-US')} د.ع</p>
                    <p className="text-xs text-mint-ink">{inv.invoice_date}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${inv.status === 'paid' ? 'bg-mint text-petrol' : 'bg-oil-light text-oil-dark'}`}>
                    {inv.status === 'paid' ? 'مدفوع' : 'دين'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {ads.length > 0 && <AdStrip ads={ads} />}
      </div>
    </Layout>
  )
}

function AdStrip({ ads }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (ads.length < 2) return undefined
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % ads.length), AD_ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [ads.length])

  return (
    <aside aria-label="إعلان" className="relative h-32 overflow-hidden rounded-3xl bg-petrol-deep">
      {ads.map((ad, i) => (
        <img
          key={ad.url}
          src={ad.url}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </aside>
  )
}
