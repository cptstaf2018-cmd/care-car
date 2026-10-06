import BrandMark from '../BrandMark'
import WhatsAppIcon from '../WhatsAppIcon'
import FeatureGauges from './FeatureGauges'
import LaunchScene from '../launch/LaunchScene'
import '../launch/launch.css'
import { SUPPORT_WHATSAPP_URL } from '../../constants/contact'

/** Split layout for auth screens: form card on the start side, product promise on the other. */
export default function AuthShell({ children, step = 1, rpm = 1.5, phase = 'parked', idleRpm, launch }) {
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

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-2 sm:px-8 lg:pt-6">
        <FeatureGauges step={step} rpm={rpm} />

        <section className="mx-auto mt-10 w-full max-w-[520px] rounded-[28px] bg-mint p-6 text-petrol-deep shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] sm:p-8">
          {children}
        </section>

        <div className="launch-stage mt-10">
          <LaunchScene phase={phase} idleRpm={idleRpm} />
          {launch && <div className="launch-stage-action">{launch}</div>}
        </div>
      </main>
    </div>
  )
}
