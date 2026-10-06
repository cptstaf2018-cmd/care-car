import InstrumentGrid from '../cluster/InstrumentGrid'
import useScrollProgress from '../cluster/useScrollProgress'
import '../launch/launch.css'

/**
 * The top of the signup pages: the headline and the four instruments sweeping in as it scrolls into
 * view while the RPM dial follows the registration step (`rpm`, `step`).
 */
export default function FeatureGauges({ step = 1, rpm = 1.5 }) {
  const [ref, progress] = useScrollProgress()

  return (
    <>
      <div className="max-w-2xl">
        <p className="text-gauge-light">زبونك اللي يبدّل اليوم، يرجع بعد 5,000 كم.</p>
        <h2 className="mt-2 text-3xl font-bold leading-snug sm:text-4xl">كير كار يذكّره بوقته، فيرجع لمركزك.</h2>
      </div>

      <div ref={ref} className="feature-gauges mt-8">
        <InstrumentGrid
          progress={progress}
          rpm={rpm}
          step={step}
          showSteps
          columnsClass="sm:grid-cols-2 lg:grid-cols-4"
          tachText="يعلى كل ما زاد شغلك اليوم. وهنا يعلى مع كل خطوة تكمّلها."
        />
      </div>
    </>
  )
}
