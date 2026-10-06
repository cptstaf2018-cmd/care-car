import { useEffect } from 'react'
import HeroOdometer from '../components/landing/HeroOdometer'
import {
  FaqSection, FinalCta, HowItWorks, InstrumentsSection, KindsSection, LandingFooter, LandingNav, PricingSection,
} from '../components/landing/LandingSections'

const PAGE_TITLE = 'كير كار | نظام إدارة مراكز السيارات في العراق'

export default function LandingPage() {
  useEffect(() => {
    const previous = document.title
    document.title = PAGE_TITLE
    return () => { document.title = previous }
  }, [])

  return (
    <div dir="rtl" className="min-h-screen bg-petrol font-sans text-mint antialiased">
      <LandingNav />
      <main>
        <HeroOdometer />
        <HowItWorks />
        <InstrumentsSection />
        <KindsSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
