import { Link } from 'react-router-dom'

const toWaNumber = (phone) => {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.startsWith('964')) return digits
  if (digits.startsWith('0')) return `964${digits.slice(1)}`
  return digits
}

function statusFor(daysLeft) {
  if (daysLeft < 0) return { text: `متأخر ${-daysLeft} يوم`, tone: 'text-alert' }
  if (daysLeft === 0) return { text: 'موعده اليوم', tone: 'text-oil-dark' }
  return { text: `باقي ${daysLeft} يوم`, tone: 'text-mint-ink' }
}

/** Cars ordered by next oil change, each with an oil-life bar and a one-tap WhatsApp reminder. */
export default function DueCarsList({ cars, intervalDays, centerName, loading }) {
  if (loading) {
    return <div className="h-40 animate-pulse rounded-3xl bg-mint" />
  }
  if (!cars.length) {
    return (
      <div className="rounded-3xl border border-dashed border-mint-dim bg-white p-6 text-center">
        <p className="font-bold text-petrol-deep">ما كو مواعيد بعد</p>
        <p className="mt-1 text-sm text-mint-ink">سجّل أول خدمة، ومن هنا تشوف منو موعده قرّب.</p>
        <Link to="/center/services/new" className="mt-4 inline-block rounded-full bg-petrol px-5 py-2.5 text-sm font-bold text-mint">
          سجّل أول خدمة
        </Link>
      </div>
    )
  }

  return (
    <ul className="grid gap-2">
      {cars.map((car) => {
        const life = Math.min(1, Math.max(0, car.days_left / intervalDays))
        const status = statusFor(car.days_left)
        const message = `هلا ${car.owner_name || ''}، سيارتك (${car.plate_number}) قرب موعد تبديل الزيت. ننتظرك بـ${centerName}.`
        return (
          <li key={car.car_id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_1px_0_#CFDEDB]">
            <span dir="ltr" className="rounded-md border-2 border-petrol-deep px-2 py-0.5 text-sm font-bold text-petrol-deep">
              {car.plate_number}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-petrol-deep">
                {car.owner_name || 'صاحب السيارة'}
                {car.car_type ? <span className="font-normal text-mint-ink"> · {car.car_type}</span> : null}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mint-dim" aria-hidden="true">
                  <div className={`h-full rounded-full ${car.days_left <= 0 ? 'bg-alert' : life < 0.25 ? 'bg-oil' : 'bg-petrol-soft'}`} style={{ width: `${Math.max(life, 0.04) * 100}%` }} />
                </div>
                <span className={`shrink-0 text-xs font-bold ${status.tone}`}>{status.text}</span>
              </div>
            </div>
            {car.phone ? (
              <a
                href={`https://wa.me/${toWaNumber(car.phone)}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-[#063] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrol"
              >
                ذكّره
              </a>
            ) : (
              <span className="text-xs text-gauge">بدون رقم</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
