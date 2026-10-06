import Odometer from '../cluster/Odometer'
import WhatsAppIcon from '../WhatsAppIcon'
import StartButton from './StartButton'
import { TRIAL_DAYS, whatsappLink } from '../../constants/contact'
import useSectionScroll from './useSectionScroll'

const OIL_INTERVAL_KM = 5000
const COUNT_FINISHES_AT = 0.8 // the rest of the scroll holds the finished state (and the WhatsApp message) on screen
const LOW_LIFE_PERCENT = 20

/** Pinned hero laid out as a dashboard: copy and START on one side, the instrument panel on the other. Scrolling drives the odometer. */
export default function HeroOdometer() {
  const [ref, scroll, still] = useSectionScroll()
  const p = Math.min(1, scroll / COUNT_FINISHES_AT)
  const km = p * OIL_INTERVAL_KM
  const life = Math.round((1 - p) * 100)
  const done = p >= 0.995

  return (
    <header id="top" ref={ref} style={still ? undefined : { height: '300vh' }} className="relative bg-petrol text-mint">
      <div className={`${still ? 'min-h-screen py-24' : 'sticky top-0 h-screen pt-16'} flex items-center`}>
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div className="text-center lg:text-start">
            <h1 className="text-3xl font-bold leading-snug sm:text-5xl">
              {done ? 'كير كار ذكّره بوقته. هسه يرجع لمركزك.' : 'كير كار يراقب الموعد بدالك.'}
            </h1>
            <p className="mx-auto mt-4 hidden max-w-xl text-gauge-light sm:block sm:text-lg lg:mx-0">
              نظام واحد لكل مركز يخدم السيارات في العراق: زيوت، إطارات، غسيل، كهرباء، ميكانيك، تكييف، سمكرة، أو قطع غيار. وصل، مخزون، ديون، وتذكير واتساب لكل زبون.
            </p>
            <div className="mt-7 flex items-center justify-center gap-6 lg:justify-start">
              <StartButton size="lg" />
              <div className="text-start">
                <p className="font-bold">ابدأ {TRIAL_DAYS} يوم مجاناً</p>
                <a
                  href={whatsappLink('مرحبا، أريد أعرف أكثر عن كير كار')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-full border border-petrol-soft px-4 py-2 text-sm font-bold transition hover:bg-petrol-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-oil/50"
                >
                  <WhatsAppIcon size={16} />
                  كلّمنا على واتساب
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-petrol-line bg-petrol-deep p-5 shadow-[inset_0_2px_0_rgba(255,255,255,0.06),0_30px_60px_-30px_rgba(0,0,0,0.9)] sm:p-7">
            <p className="text-center text-sm text-gauge-light">مثال: زبونك بدّل الزيت عندك اليوم. من وقتها مشى</p>
            <div className="mt-3 flex items-end justify-center gap-2" dir="ltr">
              <Odometer value={km} className="text-[clamp(48px,9vw,96px)] font-bold text-oil" />
              <span className="pb-2 text-xl text-gauge">كم</span>
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm text-gauge-light" aria-hidden="true">
              <span>عمر الزيت</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-petrol-line">
                <i className={`block h-full rounded-full transition-colors ${life <= LOW_LIFE_PERCENT ? 'bg-alert' : 'bg-oil'}`} style={{ width: `${life}%` }} />
              </div>
              <b className="w-10 text-mint tabular-nums">{life}٪</b>
            </div>

            <div className="mt-5 min-h-[7.5rem]">
              <div
                className={`origin-top rounded-2xl rounded-es-sm bg-[#d9fdd3] p-4 text-start text-[#111] transition-all duration-500 ${done ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                role={done ? 'status' : undefined}
              >
                <strong className="block text-sm text-[#075E54]">مركز الخليج</strong>
                <p className="text-sm leading-7">هلا أبو علي، الكامري مشت 5,000 كم من آخر تبديل. صار موعد الزيت، ننتظرك بالمركز.</p>
                <p className="mt-1 text-[11px] text-[#667]">مثال على رسالة التذكير التلقائية</p>
              </div>
            </div>
            {!still && <p className={`text-center text-sm text-gauge transition-opacity ${scroll > 0.04 ? 'opacity-0' : 'opacity-100'}`}>انزل لتحت وشوف العدّاد يمشي</p>}
          </div>
        </div>
      </div>
    </header>
  )
}
