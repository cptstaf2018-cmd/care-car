import { splitPlate } from './plate'

/** An Iraqi-style number plate: flag colors on the edge, province on top, the number in heavy type. */
export default function IraqiPlate({ plate, size = 'md' }) {
  const { province, main } = splitPlate(plate)
  const big = size === 'lg'
  return (
    <span
      dir="rtl"
      className="inline-flex items-stretch overflow-hidden rounded-lg border-2 border-petrol-deep bg-white text-petrol-deep shadow-[0_2px_0_rgba(8,38,40,0.25)]"
      role="img"
      aria-label={`لوحة ${plate}`}
    >
      <span aria-hidden="true" className="flex w-3 flex-col">
        <span className="flex-1 bg-[#CE1126]" />
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-black" />
      </span>
      <span className={`flex flex-col items-center justify-center px-3 ${big ? 'py-1.5' : 'py-1'}`}>
        {province && <span className={`${big ? 'text-xs' : 'text-[10px]'} font-bold leading-none text-mint-ink`}>{province}</span>}
        <span className={`${big ? 'text-2xl' : 'text-lg'} font-bold leading-tight tracking-wide tabular-nums`}>{main || '—'}</span>
      </span>
    </span>
  )
}
