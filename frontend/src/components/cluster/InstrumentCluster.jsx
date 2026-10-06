import { BatteryWarning, Fuel } from 'lucide-react'
import Gauge from './Gauge'
import RollingNumber from './RollingNumber'
import Telltale, { OilCanIcon } from './Telltale'
import { niceCeil } from './scale'
import useIgnition from './useIgnition'

const MIN_REVENUE_SCALE = 100_000
const MIN_CARS_SCALE = 10
const OVER_AVERAGE_HEADROOM = 2

const thousands = (n) => (n >= 1000 ? `${Math.round(n / 1000).toLocaleString('en-US')}` : `${Math.round(n)}`)
const money = (n) => `${Math.round(n || 0).toLocaleString('en-US')} د.ع`

/**
 * The center's instrument cluster: revenue dial, cars-served dial, month odometer and warning lamps.
 * Averages are per elapsed day of the current month, so the needle shows "today vs. your usual day".
 */
export default function InstrumentCluster({ centerName, daily, monthly, warnings }) {
  const phase = useIgnition()
  const dayOfMonth = new Date().getDate()
  const revenueToday = daily?.total_sales ?? 0
  const carsToday = daily?.service_count ?? 0
  const avgRevenue = (monthly?.total_sales ?? 0) / dayOfMonth
  const avgCars = (monthly?.service_count ?? 0) / dayOfMonth
  const revenueMax = niceCeil(Math.max(avgRevenue * OVER_AVERAGE_HEADROOM, revenueToday * 1.15, MIN_REVENUE_SCALE))
  const carsMax = niceCeil(Math.max(avgCars * OVER_AVERAGE_HEADROOM, carsToday * 1.2, MIN_CARS_SCALE))
  const selfTest = phase === 'off' || phase === 'sweep'
  const dateLabel = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  return (
    <section
      aria-label="عدادات المركز"
      className="relative overflow-hidden rounded-[28px] bg-petrol px-4 pb-5 pt-4 text-mint shadow-[0_30px_60px_-30px_rgba(8,38,40,0.9)] sm:px-6"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-oil/60 to-transparent" />
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="truncate text-lg font-bold">{centerName}</h2>
        <span className="shrink-0 text-xs text-gauge-light">{dateLabel}</span>
      </header>

      <div className="mt-3 grid grid-cols-2 items-end gap-1 sm:gap-6">
        <Gauge
          title="دخل اليوم"
          value={revenueToday}
          max={revenueMax}
          average={avgRevenue}
          scaleLabel={thousands}
          unitLabel="×1000 د.ع"
          readout={money(revenueToday)}
          phase={phase}
        />
        <Gauge
          title="سيارات اليوم"
          value={carsToday}
          max={carsMax}
          average={avgCars}
          scaleLabel={(n) => `${Math.round(n)}`}
          unitLabel="سيارة"
          readout={`${carsToday}`}
          phase={phase}
        />
      </div>

      <div className="mt-4 flex flex-col items-center gap-1">
        <RollingNumber value={phase === 'ready' ? monthly?.total_sales ?? 0 : 0} className="text-2xl font-bold text-oil" />
        <span className="text-xs text-gauge-light">دخل الشهر بالدينار</span>
      </div>

      <nav aria-label="تنبيهات" className="mt-4 grid grid-flow-col auto-cols-fr border-t border-petrol-line pt-3">
        {warnings.oilDue != null && (
          <Telltale icon={<OilCanIcon />} label="موعد زيت" count={warnings.oilDue} to="/center/cars" selfTest={selfTest} />
        )}
        <Telltale icon={<Fuel size={22} aria-hidden="true" />} label="مخزون ناقص" count={warnings.lowStock} to="/center/inventory" selfTest={selfTest} />
        <Telltale icon={<BatteryWarning size={22} aria-hidden="true" />} label="ديون" count={warnings.debts} tone="red" to="/center/debts" selfTest={selfTest} />
      </nav>
    </section>
  )
}
