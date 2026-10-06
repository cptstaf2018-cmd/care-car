import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import IraqiPlate from '../car/IraqiPlate'

const STATUS = {
  paid: { label: 'مدفوعة', color: '#15803d' },
  unpaid: { label: 'دين', color: '#E5533D' },
  partial: { label: 'دفعة جزئية', color: '#C9831F' },
}

const timeFmt = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { hour: '2-digit', minute: '2-digit' })
const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('en-US')} د.ع`

/** Server times are naive UTC ("2026-10-06T14:30:00"); read them as UTC, show them in local time. */
function clock(iso) {
  if (!iso) return null
  return timeFmt.format(new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`))
}

function durationText(minutes) {
  if (minutes == null) return null
  if (minutes < 1) return 'أقل من دقيقة'
  if (minutes < 60) return `${minutes} دقيقة`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} ساعة و${m} دقيقة` : `${h} ساعة`
}

function whatsappUrl(inv) {
  const digits = String(inv.center_whatsapp || inv.center_phone || '').replace(/\D/g, '')
  if (!digits) return ''
  return `https://wa.me/${digits.startsWith('964') ? digits : `964${digits.replace(/^0/, '')}`}`
}

/** Notch on each edge of the perforation, like a torn parking stub. */
function Perforation() {
  return (
    <div className="relative my-4" aria-hidden="true">
      <div className="border-t-2 border-dashed border-[#CFDEDB]" />
      <span className="absolute -start-[30px] -top-3 h-6 w-6 rounded-full bg-[#EEF4F2]" />
      <span className="absolute -end-[30px] -top-3 h-6 w-6 rounded-full bg-[#EEF4F2]" />
    </div>
  )
}

/** The invoice as a parking-style ticket: plate, in/out times, lines, totals, a stamp and a WhatsApp QR. */
export default function ServiceTicket({ inv, innerRef }) {
  const [qr, setQr] = useState('')
  const chat = whatsappUrl(inv)
  const status = STATUS[inv.status] || STATUS.unpaid
  const lines = inv.invoice_lines?.length ? inv.invoice_lines : (inv.service_lines || []).filter(Boolean).map((name) => ({ name, amount: 0 }))
  const entry = clock(inv.started_at)
  const exit = clock(inv.finished_at)
  const duration = durationText(inv.duration_minutes)

  useEffect(() => {
    if (!chat) return
    QRCode.toDataURL(chat, { margin: 1, width: 132, color: { dark: '#082628', light: '#ffffff' } }).then(setQr).catch(() => setQr(''))
  }, [chat])

  return (
    <div ref={innerRef} dir="rtl" className="service-ticket mx-auto w-full max-w-[380px] rounded-3xl bg-white p-6 text-[#082628] shadow-[0_24px_50px_-24px_rgba(8,38,40,0.5)]">
      <header className="flex items-center gap-3">
        {inv.center_logo ? (
          <img src={inv.center_logo} alt="" className="h-12 w-12 rounded-xl object-contain" />
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded-[28%] bg-[#F0A33A] text-lg font-black">CC</span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{inv.center_name || 'مركز الخدمة'}</h1>
          {(inv.center_phone || inv.center_whatsapp) && <p className="text-xs text-[#3F5F5D]" dir="ltr">{inv.center_phone || inv.center_whatsapp}</p>}
        </div>
      </header>

      <Perforation />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[#3F5F5D]">تذكرة خدمة</p>
          <p className="text-2xl font-bold tabular-nums">#{String(inv.id).padStart(5, '0')}</p>
          <p className="text-xs text-[#3F5F5D]">{inv.invoice_date}</p>
        </div>
        <span
          className="rotate-[-8deg] rounded-xl border-[3px] px-3 py-1 text-lg font-bold"
          style={{ color: status.color, borderColor: status.color }}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <IraqiPlate plate={inv.plate_number || '—'} size="lg" />
        <div className="min-w-0 text-end">
          <p className="truncate font-bold">{inv.customer_name || 'عميل كريم'}</p>
          <p className="truncate text-xs text-[#3F5F5D]">{inv.car_type || ''}</p>
          {inv.mileage ? <p className="text-xs text-[#3F5F5D]">{Number(inv.mileage).toLocaleString('en-US')} كم</p> : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#E8F1EF] p-3 text-center">
        <div>
          <p className="text-[11px] text-[#3F5F5D]">دخلت</p>
          <p className="font-bold tabular-nums" dir="ltr">{entry || '—'}</p>
        </div>
        <div>
          <p className="text-[11px] text-[#3F5F5D]">خرجت</p>
          <p className="font-bold tabular-nums" dir="ltr">{exit || '—'}</p>
        </div>
        <div>
          <p className="text-[11px] text-[#3F5F5D]">المدة</p>
          <p className="text-sm font-bold">{duration || '—'}</p>
        </div>
      </div>

      <Perforation />

      <ul className="grid gap-2">
        {lines.map((line, i) => (
          <li key={`${line.name}-${i}`} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="font-bold">{line.name}</span>
              {line.inventory_item_name && <span className="block text-xs text-[#3F5F5D]">{line.inventory_quantity} × {line.inventory_item_name}</span>}
            </span>
            <span className="shrink-0 font-bold tabular-nums">{Number(line.amount) ? money(line.amount) : ''}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 grid gap-1 border-t border-[#CFDEDB] pt-3 text-sm">
        {inv.discount > 0 && (
          <div className="flex justify-between"><dt className="text-[#3F5F5D]">الخصم</dt><dd className="font-bold tabular-nums">{money(inv.discount)}</dd></div>
        )}
        <div className="flex justify-between text-lg"><dt className="font-bold">المجموع</dt><dd className="font-bold tabular-nums">{money(inv.net)}</dd></div>
        <div className="flex justify-between"><dt className="text-[#3F5F5D]">المدفوع</dt><dd className="font-bold tabular-nums">{money(inv.paid_amount)}</dd></div>
        {inv.remaining_amount > 0 && (
          <div className="flex justify-between" style={{ color: '#E5533D' }}><dt className="font-bold">الباقي عليك</dt><dd className="font-bold tabular-nums">{money(inv.remaining_amount)}</dd></div>
        )}
      </dl>

      <Perforation />

      <footer className="flex items-center justify-between gap-4">
        <div className="min-w-0 text-xs leading-6 text-[#3F5F5D]">
          <p className="text-sm font-bold text-[#082628]">شكراً لزيارتكم</p>
          {qr ? <p>امسح الرمز للتواصل مع المركز بالواتساب.</p> : <p>نتمنى لك طريق سالم.</p>}
        </div>
        {qr && <img src={qr} alt="رمز واتساب المركز" width="88" height="88" className="shrink-0 rounded-lg" />}
      </footer>
    </div>
  )
}
