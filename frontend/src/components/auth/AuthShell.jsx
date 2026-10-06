import BrandMark from '../BrandMark'
import { SUPPORT_WHATSAPP_DISPLAY, SUPPORT_WHATSAPP_URL, TRIAL_DAYS } from '../../constants/contact'

const POINTS = [
  { title: 'تذكير بالموعد', body: 'كل زبون توصله رسالة واتساب باسم مركزك لما يقرب تبديل زيته.' },
  { title: 'ديون بدون إحراج', body: 'تعرف منو مطلوب وكم، وتطالبه برسالة مرتبة.' },
  { title: 'مخزون حي', body: 'كل خدمة تنقص القطع، وينبهك قبل ما تخلص.' },
]

/** Split layout for auth screens: form card on the start side, product promise on the other. */
export default function AuthShell({ children }) {
  return (
    <div dir="rtl" className="min-h-screen bg-petrol text-mint">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <BrandMark />
        <a
          href={SUPPORT_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full px-3 py-2 text-sm font-bold text-oil hover:bg-petrol-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil"
        >
          واتساب <span dir="ltr">{SUPPORT_WHATSAPP_DISPLAY}</span>
        </a>
      </header>

      <main className="mx-auto grid max-w-6xl items-start gap-10 px-4 pb-16 pt-2 sm:px-8 lg:grid-cols-[minmax(0,480px)_1fr] lg:pt-10">
        <section className="rounded-[28px] bg-mint p-6 text-petrol-deep shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] sm:p-8">
          {children}
        </section>

        <aside className="hidden lg:block lg:pt-6">
          <p className="text-gauge-light">زبونك اللي يبدّل اليوم، يرجع بعد 5,000 كم.</p>
          <h2 className="mt-2 max-w-[18ch] text-4xl font-bold leading-snug">كير كار يذكّره بوقته، فيرجع لمركزك.</h2>
          <ul className="mt-10 grid max-w-md gap-6">
            {POINTS.map((p) => (
              <li key={p.title} className="border-s-2 border-oil ps-4">
                <b className="block text-lg">{p.title}</b>
                <span className="text-gauge-light">{p.body}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 inline-block rounded-full bg-petrol-deep px-4 py-2 text-sm text-gauge-light">
            {TRIAL_DAYS} يوم مجاناً بكل الميزات، بدون دفع.
          </p>
        </aside>
      </main>
    </div>
  )
}
