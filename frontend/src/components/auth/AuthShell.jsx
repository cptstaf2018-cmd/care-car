import BrandMark from '../BrandMark'
import WhatsAppIcon from '../WhatsAppIcon'
import FeatureGauges from './FeatureGauges'
import { SUPPORT_WHATSAPP_URL } from '../../constants/contact'

/** Split layout for auth screens: form card on the start side, product promise on the other. */
export default function AuthShell({ children, step = 1, rpm = 1.5, phase = 'parked', idleRpm }) {
  return (
    <div dir="rtl" className="min-h-screen bg-petrol text-mint">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <BrandMark />
        <a
          href={SUPPORT_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-petrol-deep px-4 py-2 text-sm font-bold text-mint hover:bg-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil"
        >
          <WhatsAppIcon size={18} />
          مساعدة
        </a>
      </header>

      <main className="mx-auto grid max-w-6xl items-start gap-10 px-4 pb-16 pt-2 sm:px-8 lg:grid-cols-[minmax(0,480px)_1fr] lg:pt-10">
        <section className="lg:sticky lg:top-6 rounded-[28px] bg-mint p-6 text-petrol-deep shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] sm:p-8">
          {children}
        </section>

        <FeatureGauges step={step} rpm={rpm} phase={phase} idleRpm={idleRpm} />
      </main>
    </div>
  )
}
