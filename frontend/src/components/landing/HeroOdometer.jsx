import { Link } from 'react-router-dom'
import Odometer from '../cluster/Odometer'
import WhatsAppIcon from '../WhatsAppIcon'
import { TRIAL_DAYS, whatsappLink } from '../../constants/contact'
import useSectionScroll from './useSectionScroll'

const OIL_INTERVAL_KM = 5000
const COUNT_FINISHES_AT = 0.8 // the rest of the scroll holds the finished state (and the WhatsApp message) on screen
const LOW_LIFE_PERCENT = 20

/** Pinned hero: scrolling drives an odometer from 0 to 5,000 km while the oil life drains, then the reminder arrives. */
export default function HeroOdometer() {
  const [ref, scroll, still] = useSectionScroll()
  const p = Math.min(1, scroll / COUNT_FINISHES_AT)
  const km = p * OIL_INTERVAL_KM
  const life = Math.round((1 - p) * 100)
  const done = p >= 0.995

  return (
    <header id="top" ref={ref} style={still ? undefined : { height: '320vh' }} className="relative bg-petrol text-mint">
      <div className={`${still ? 'min-h-screen' : 'sticky top-0 h-screen'} flex flex-col items-center justify-center px-5 pt-20 text-center`}>
        <p className="text-base text-gauge-light sm:text-lg">زبونك بدّل الزيت عندك اليوم. من وقتها مشى</p>

        <div className="mt-4 flex items-end gap-2" dir="ltr">
          <Odometer value={km} className="text-[clamp(52px,12vw,112px)] font-bold text-oil" />
          <span className="pb-2 text-xl text-gauge">كم</span>
        </div>

        <div className="mt-3 flex w-[min(420px,100%)] items-center gap-3 text-sm text-gauge-light" aria-hidden="true">
          <span>عمر الزيت</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-petrol-line">
            <i className={`block h-full rounded-full transition-colors ${life <= LOW_LIFE_PERCENT ? 'bg-alert' : 'bg-oil'}`} style={{ width: `${life}%` }} />
          </div>
          <b className="w-10 text-mint tabular-nums">{life}٪</b>
        </div>

        <div
          className={`mt-5 w-[min(420px,100%)] origin-top overflow-hidden rounded-2xl rounded-es-sm bg-[#d9fdd3] text-start text-[#111] transition-all duration-500 ${
            done ? 'max-h-40 scale-100 p-4 opacity-100' : 'max-h-0 scale-95 p-0 opacity-0'
          }`}
          role={done ? 'status' : undefined}
        >
          <strong className="block text-sm text-[#075E54]">مركز الخليج</strong>
          <p className="text-sm leading-7">هلا أبو علي، الكامري مشت 5,000 كم من آخر تبديل. صار موعد الزيت، ننتظرك بالمركز.</p>
          <p className="mt-1 text-[11px] text-[#667]">مثال على رسالة التذكير التلقائية</p>
        </div>

        <h1 className="mt-6 max-w-[22ch] text-3xl font-bold leading-snug sm:text-5xl">
          {done ? 'كير كار ذكّره بوقته. هسه يرجع لمركزك.' : 'كير كار يراقب الموعد بدالك.'}
        </h1>
        <p className="mt-3 max-w-xl text-gauge-light sm:text-lg">
          نظام واحد لمركز تبديل الزيت والصيانة: وصل، مخزون، ديون، وتذكير واتساب تلقائي لكل زبون بموعده.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="rounded-full bg-oil px-7 py-3.5 text-base font-bold text-petrol-deep transition hover:bg-oil-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-oil/50">
            جرّب {TRIAL_DAYS} يوم مجاناً
          </Link>
          <a
            href={whatsappLink('مرحبا، أريد أعرف أكثر عن كير كار')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-petrol-soft px-6 py-3.5 font-bold text-mint transition hover:bg-petrol-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-oil/50"
          >
            <WhatsAppIcon size={18} />
            كلّمنا على واتساب
          </a>
        </div>
        {!still && <p className={`mt-6 text-sm text-gauge transition-opacity ${scroll > 0.04 ? 'opacity-0' : 'opacity-100'}`}>انزل لتحت وشوف العدّاد يمشي</p>}
      </div>
    </header>
  )
}
