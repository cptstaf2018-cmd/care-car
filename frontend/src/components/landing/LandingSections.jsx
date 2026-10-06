import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Menu, X } from 'lucide-react'
import BrandMark from '../BrandMark'
import WhatsAppIcon from '../WhatsAppIcon'
import StartButton from './StartButton'
import InstrumentGrid from '../cluster/InstrumentGrid'
import useScrollProgress from '../cluster/useScrollProgress'
import { CENTER_SPECIALTIES } from '../../constants/centerSpecialties'
import { PLAN_DETAILS, PLAN_ORDER } from '../../constants/plans'
import { FAQ, FOUNDING_DISCOUNT, FOUNDING_SEATS_LEFT, OFFERS } from '../../constants/offers'
import { SUPPORT_WHATSAPP_URL, TRIAL_DAYS, whatsappLink } from '../../constants/contact'

const NAV_LINKS = [
  { href: '#how', label: 'شلون يشتغل' },
  { href: '#kinds', label: 'المراكز' },
  { href: '#pricing', label: 'الأسعار' },
  { href: '#faq', label: 'أسئلة' },
]
const DASHBOARD_RPM = 5.2
const PRICE_ROUNDING = 1000
const STEPS = [
  { title: 'سجّل الخدمة', text: 'ضغطة START، تكتب اللوحة، تختار الخدمة، وتطلع التذكرة جاهزة للزبون.' },
  { title: 'النظام يحسب', text: 'يخصم من المخزون، يسجّل الدين إذا ما دفع، ويحسب موعد الزيت القادم.' },
  { title: 'الزبون يرجع', text: 'قبل الموعد توصله رسالة واتساب باسم مركزك. فيرجع لك، مو لغيرك.' },
]

const foundingPrice = (price) => Math.round((price * (1 - FOUNDING_DISCOUNT)) / PRICE_ROUNDING) * PRICE_ROUNDING
const money = (n) => n.toLocaleString('en-US')

export function LandingNav() {
  const [open, setOpen] = useState(false)
  const link = 'rounded-full px-3 py-2 text-sm font-medium text-gauge-light transition-colors hover:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil'
  return (
    <nav aria-label="القائمة الرئيسية" className="fixed inset-x-0 top-0 z-40 border-b border-petrol-line/50 bg-petrol/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <BrandMark />
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => <a key={l.href} href={l.href} className={link}>{l.label}</a>)}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-bold text-mint hover:bg-petrol-deep sm:block">دخول</Link>
          <StartButton size="sm" caption="" />
          <button type="button" onClick={() => setOpen((v) => !v)} aria-label="القائمة" aria-expanded={open} className="rounded-full p-2 text-mint md:hidden">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="grid gap-1 border-t border-petrol-line/50 bg-petrol px-4 py-3 md:hidden">
          {NAV_LINKS.map((l) => <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={link}>{l.label}</a>)}
          <Link to="/login" className={link}>دخول</Link>
        </div>
      )}
    </nav>
  )
}

export function HowItWorks() {
  return (
    <section id="how" className="bg-[#EEF4F2] px-4 py-20 text-petrol-deep">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-[18ch] text-3xl font-bold leading-snug sm:text-4xl">ثلاث خطوات، والباقي علينا</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-3xl border border-mint-dim bg-white p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-petrol text-lg font-bold text-oil">{i + 1}</span>
              <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
              <p className="mt-2 leading-8 text-mint-ink">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function InstrumentsSection() {
  const [ref, progress] = useScrollProgress()
  return (
    <section ref={ref} className="bg-petrol px-4 py-20 text-mint">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-[20ch] text-3xl font-bold leading-snug sm:text-4xl">لوحة قيادة لمركزك، مو دفتر</h2>
        <p className="mt-3 max-w-xl text-gauge-light sm:text-lg">كل شي تحتاج تعرفه عن يومك بنظرة وحدة، مثل عدّادات السيارة.</p>
        <div className="mt-10">
          <InstrumentGrid progress={progress} rpm={DASHBOARD_RPM} tachText="يعلى كل ما زاد شغلك اليوم: سيارات ودخل." />
        </div>
      </div>
    </section>
  )
}

export function KindsSection() {
  return (
    <section id="kinds" className="bg-[#EEF4F2] px-4 py-20 text-petrol-deep">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-[20ch] text-3xl font-bold leading-snug sm:text-4xl">لكل نوع مركز، خدماته الجاهزة</h2>
        <p className="mt-3 max-w-xl text-mint-ink sm:text-lg">تختار اختصاص مركزك مرة وحدة، وتطلع لك الخدمات المناسبة بدون ما تكتبها.</p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CENTER_SPECIALTIES.map((item) => (
            <li key={item.value} className="flex items-center gap-4 rounded-3xl border border-mint-dim bg-white p-4">
              <img src={item.icon} alt="" width="56" height="56" loading="lazy" className="h-14 w-14 shrink-0 object-contain" />
              <div>
                <h3 className="font-bold">{item.label}</h3>
                <p className="text-xs leading-6 text-mint-ink">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function PricingSection() {
  return (
    <section id="pricing" className="bg-white px-4 py-20 text-petrol-deep">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-[20ch] text-3xl font-bold leading-snug sm:text-4xl">أسعار واضحة بالدينار</h2>
        <p className="mt-3 max-w-xl text-mint-ink sm:text-lg">{TRIAL_DAYS} يوم مجاناً بكل الميزات. بعدها تختار الخطة، وتلغي بأي وقت.</p>

        <div className="mt-8 rounded-3xl bg-petrol p-6 text-mint">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold">عرض الانطلاق</h3>
            <span className="rounded-full bg-oil px-4 py-1.5 text-sm font-bold text-petrol-deep">باقي {FOUNDING_SEATS_LEFT} مقعد</span>
          </div>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OFFERS.map((offer) => (
              <li key={offer.title} className="border-s-2 border-oil ps-4">
                <b className="block">{offer.title}</b>
                <span className="text-sm leading-7 text-gauge-light">{offer.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const plan = PLAN_DETAILS[id]
            const popular = id === 'pro'
            return (
              <article key={id} className={`flex flex-col rounded-3xl border-2 p-6 ${popular ? 'border-oil bg-[#FFF9EE]' : 'border-mint-dim bg-white'}`}>
                {popular && <span className="mb-3 w-fit rounded-full bg-oil px-3 py-1 text-xs font-bold text-petrol-deep">الأكثر طلباً</span>}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-4 text-sm text-gauge line-through tabular-nums">{plan.price} د.ع / شهر</p>
                <p className="text-4xl font-bold tabular-nums">
                  {money(foundingPrice(plan.adminPrice))}
                  <span className="text-base font-medium text-mint-ink"> د.ع / شهر</span>
                </p>
                <p className="mt-1 text-xs font-bold text-oil-dark">سعر المؤسسين: خصم {Math.round(FOUNDING_DISCOUNT * 100)}٪ مدى الحياة</p>
                <ul className="mt-5 grid flex-1 content-start gap-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2"><Check size={16} className="mt-1 shrink-0 text-oil-dark" aria-hidden="true" />{f}</li>
                  ))}
                  {plan.noFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-gauge line-through"><X size={16} className="mt-1 shrink-0" aria-hidden="true" />{f}</li>
                  ))}
                </ul>
                <Link to="/register" className={`mt-6 rounded-full py-3 text-center font-bold transition ${popular ? 'bg-oil text-petrol-deep hover:bg-oil-dark' : 'bg-petrol text-mint hover:bg-petrol-deep'}`}>
                  ابدأ التجربة المجانية
                </Link>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function FaqSection() {
  return (
    <section id="faq" className="bg-[#EEF4F2] px-4 py-20 text-petrol-deep">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold leading-snug sm:text-4xl">أسئلة يسألونها أصحاب المراكز</h2>
        <div className="mt-8 grid gap-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-mint-dim bg-white px-5 py-4 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil">
                {item.q}
                <span aria-hidden="true" className="text-xl text-oil-dark transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-8 text-mint-ink">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="bg-petrol px-4 py-20 text-center text-mint">
      <h2 className="mx-auto max-w-[22ch] text-3xl font-bold leading-snug sm:text-4xl">جرّب كير كار هسه. أول خدمة تسجّلها تحس الفرق.</h2>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-1">
          <StartButton size="lg" />
          <span className="text-sm text-gauge-light">اضغط وابدأ {TRIAL_DAYS} يوم مجاناً</span>
        </div>
        <a href={whatsappLink('مرحبا، أريد أفتح حساب لمركزي بكير كار')} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-petrol-soft px-7 py-4 font-bold hover:bg-petrol-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-oil/50">
          <WhatsAppIcon size={20} /> كلّمنا على واتساب
        </a>
      </div>
    </section>
  )
}

export function LandingFooter() {
  return (
    <footer className="bg-petrol-deep px-4 py-10 text-gauge-light">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <BrandMark />
          <p className="mt-3 max-w-xs text-sm leading-7">نظام إدارة مراكز تبديل الزيت والصيانة وقطع الغيار في العراق.</p>
        </div>
        <nav aria-label="روابط" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link to="/privacy" className="hover:text-mint">سياسة الخصوصية</Link>
          <Link to="/terms" className="hover:text-mint">شروط الاستخدام</Link>
          <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-mint">
            <WhatsAppIcon size={16} /> واتساب
          </a>
          <a href="https://baghdad-future-ai.my/" target="_blank" rel="noopener noreferrer" className="hover:text-mint">تطوير Baghdad Future AI</a>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-xs">© {new Date().getFullYear()} كير كار. جميع الحقوق محفوظة.</p>
    </footer>
  )
}
