import InstrumentGrid from '../cluster/InstrumentGrid'
import useScrollProgress from '../cluster/useScrollProgress'
import LaunchScene from '../launch/LaunchScene'
import '../launch/launch.css'

/**
 * The side panel of the signup pages: the car, and the four instruments sweeping in as it scrolls into
 * view while the RPM dial follows the registration step (`rpm`, `step`).
 */
export default function FeatureGauges({ step = 1, rpm = 1.5, phase = 'parked', idleRpm }) {
  const [ref, progress] = useScrollProgress()

  return (
    <>
      <aside className="lg:pt-4">
        <p className="text-gauge-light">زبونك اللي يبدّل اليوم، يرجع بعد 5,000 كم.</p>
        <h2 className="mt-2 max-w-[20ch] text-3xl font-bold leading-snug sm:text-4xl">كير كار يذكّره بوقته، فيرجع لمركزك.</h2>

        <div className="mt-6">
          <LaunchScene phase={phase} idleRpm={idleRpm} showTach={false} />
        </div>
      </aside>

      <div ref={ref} className="feature-gauges lg:col-span-2">
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
