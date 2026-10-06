import { CENTER_SPECIALTIES } from '../../constants/centerSpecialties'

/** Pick what the center does. Each option shows the same 3D icon used inside the service screen. */
export default function SpecialtyPicker({ value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold">شنو يشتغل مركزك؟</legend>
      <div className="grid auto-rows-fr grid-cols-2 gap-2">
        {CENTER_SPECIALTIES.map((item) => {
          const selected = value === item.value
          return (
            <label
              key={item.value}
              className={`flex min-h-[92px] cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-oil ${
                selected ? 'border-oil bg-petrol text-mint' : 'border-transparent bg-white text-petrol-deep hover:border-mint-dim'
              }`}
            >
              <input type="radio" name="specialty" value={item.value} checked={selected} onChange={() => onChange(item.value)} className="sr-only" />
              <img src={item.icon} alt="" width="44" height="44" loading="lazy" className="h-11 w-11 shrink-0 object-contain" />
              <span className="min-w-0">
                <b className="block text-sm leading-snug">{item.label}</b>
                <span className={`mt-0.5 text-[11px] leading-snug ${selected ? 'text-gauge-light' : 'text-mint-ink'} line-clamp-3`}>{item.description}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
