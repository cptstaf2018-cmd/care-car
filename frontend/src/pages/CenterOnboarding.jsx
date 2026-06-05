import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { CENTER_SPECIALTIES, DEFAULT_CENTER_SPECIALTY } from '../constants/centerSpecialties'
import { updateCenterSettings } from '../api/settings'

const toneMap = {
  quick_service: 'from-blue-50 via-cyan-50 to-white border-blue-100 ring-blue-100',
  tires: 'from-slate-50 via-blue-50 to-white border-slate-100 ring-slate-100',
  electrical: 'from-amber-50 via-yellow-50 to-white border-amber-100 ring-amber-100',
  wash: 'from-cyan-50 via-teal-50 to-white border-cyan-100 ring-cyan-100',
  mechanic: 'from-rose-50 via-orange-50 to-white border-rose-100 ring-rose-100',
  ac: 'from-sky-50 via-blue-50 to-white border-sky-100 ring-sky-100',
  body_paint: 'from-violet-50 via-purple-50 to-white border-violet-100 ring-violet-100',
  multi_service: 'from-emerald-50 via-teal-50 to-white border-emerald-100 ring-emerald-100',
}

const palette = {
  quick_service: ['#2563eb', '#22d3ee'],
  tires: ['#334155', '#60a5fa'],
  electrical: ['#f59e0b', '#334155'],
  wash: ['#06b6d4', '#14b8a6'],
  mechanic: ['#e11d48', '#f97316'],
  ac: ['#0ea5e9', '#6366f1'],
  body_paint: ['#7c3aed', '#ec4899'],
  multi_service: ['#059669', '#0f766e'],
}

function SpecialtyIllustration({ type }) {
  const [a, b] = palette[type] || palette.multi_service
  const id = `specialty-${type}`

  const common = (
    <defs>
      <linearGradient id={`${id}-main`} x1="12" y1="8" x2="64" y2="70" gradientUnits="userSpaceOnUse">
        <stop stopColor={a} />
        <stop offset="1" stopColor={b} />
      </linearGradient>
      <linearGradient id={`${id}-soft`} x1="16" y1="10" x2="62" y2="66" gradientUnits="userSpaceOnUse">
        <stop stopColor={b} stopOpacity=".26" />
        <stop offset="1" stopColor={a} stopOpacity=".08" />
      </linearGradient>
      <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor={a} floodOpacity=".2" />
      </filter>
    </defs>
  )

  const shapes = {
    quick_service: (
      <>
        <path d="M20 49c3-9 12-15 24-15 7 0 13 2 17 7 2 2 2 6-1 8l-6 4H27c-5 0-8-1-7-4Z" fill={`url(#${id}-soft)`} />
        <path d="M27 53h29c2 0 4-2 4-4l-1-6c0-3-3-5-6-5h-6l-4-5H31l-6 7h-4c-3 0-5 2-5 5v4c0 2 2 4 4 4h7Z" fill="#fff" stroke={`url(#${id}-main)`} strokeWidth="2" />
        <circle cx="28" cy="53" r="5" fill={a} opacity=".9" />
        <circle cx="52" cy="53" r="5" fill={b} opacity=".9" />
        <path d="M43 17h11l5 5v23H39V22l4-5Z" fill={`url(#${id}-main)`} filter={`url(#${id}-shadow)`} />
        <path d="M47 24c3 5-4 8-1 13 5-2 7-6 2-13Z" fill="#fff" opacity=".85" />
        <path d="M54 18h6v8h-6z" fill="#111827" opacity=".85" />
      </>
    ),
    tires: (
      <>
        <circle cx="39" cy="39" r="24" fill={`url(#${id}-main)`} filter={`url(#${id}-shadow)`} />
        <circle cx="39" cy="39" r="16" fill="#f8fafc" />
        <circle cx="39" cy="39" r="8" fill={a} />
        {[0, 60, 120, 180, 240, 300].map(angle => (
          <rect key={angle} x="37.5" y="21" width="3" height="14" rx="1.5" fill={b} transform={`rotate(${angle} 39 39)`} />
        ))}
        <circle cx="39" cy="39" r="28" fill="none" stroke="#0f172a" strokeOpacity=".14" strokeWidth="5" strokeDasharray="4 6" />
      </>
    ),
    electrical: (
      <>
        <rect x="18" y="27" width="42" height="28" rx="7" fill={`url(#${id}-main)`} filter={`url(#${id}-shadow)`} />
        <rect x="24" y="21" width="8" height="8" rx="2" fill={a} />
        <rect x="46" y="21" width="8" height="8" rx="2" fill={b} />
        <path d="M35 33l-5 10h8l-4 9 11-14h-8l3-5h-5Z" fill="#fff" opacity=".92" />
        <rect x="50" y="42" width="15" height="11" rx="3" fill="#fff" stroke={a} strokeWidth="2" />
        <path d="M54 48h7M58 42v-5" stroke={b} strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
    wash: (
      <>
        <path d="M19 47c3-8 12-13 23-13 7 0 13 2 17 7 2 3 1 7-2 9l-5 3H27c-6 0-10-2-8-6Z" fill="#fff" stroke={`url(#${id}-main)`} strokeWidth="2" />
        <circle cx="29" cy="53" r="5" fill={a} />
        <circle cx="52" cy="53" r="5" fill={b} />
        <path d="M18 26c7-7 16-9 25-8 9 1 15 5 19 11" stroke={`url(#${id}-main)`} strokeWidth="5" strokeLinecap="round" opacity=".32" />
        {[20, 28, 56, 63].map((x, i) => (
          <circle key={x} cx={x} cy={24 + (i % 2) * 8} r={3 + (i % 2)} fill={i % 2 ? b : a} opacity=".72" />
        ))}
      </>
    ),
    mechanic: (
      <>
        <rect x="20" y="43" width="38" height="6" rx="3" fill={`url(#${id}-main)`} />
        <rect x="24" y="49" width="5" height="15" rx="2" fill={a} />
        <rect x="50" y="49" width="5" height="15" rx="2" fill={b} />
        <path d="M23 38c2-6 8-10 16-10s14 4 17 10l-4 5H27l-4-5Z" fill="#fff" stroke={`url(#${id}-main)`} strokeWidth="2" filter={`url(#${id}-shadow)`} />
        <path d="M55 19l4 4-17 17-4-4 17-17Z" fill={a} />
        <circle cx="61" cy="21" r="5" fill={b} />
        <path d="M23 21l8 8M31 21l-8 8" stroke={b} strokeWidth="4" strokeLinecap="round" />
      </>
    ),
    ac: (
      <>
        <rect x="19" y="23" width="38" height="31" rx="8" fill={`url(#${id}-main)`} filter={`url(#${id}-shadow)`} />
        <rect x="25" y="30" width="26" height="17" rx="4" fill="#fff" opacity=".92" />
        <path d="M31 39h14M38 32v14M32 34l12 10M44 34L32 44" stroke={a} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M15 30c-4 3-5 8 0 11M63 30c4 3 5 8 0 11M13 49c9 4 16 4 25 0 8-4 15-4 25 0" stroke={b} strokeWidth="3" strokeLinecap="round" opacity=".58" />
      </>
    ),
    body_paint: (
      <>
        <path d="M18 45h30c5 0 9 4 9 9v2H18V45Z" fill="#fff" stroke={`url(#${id}-main)`} strokeWidth="2" filter={`url(#${id}-shadow)`} />
        <path d="M24 45l7-9h17l8 9H24Z" fill={`url(#${id}-soft)`} />
        <path d="M46 22h16v9H46z" fill={`url(#${id}-main)`} />
        <path d="M39 25h8v5h-8zM61 24h6v5h-6" fill={b} />
        <path d="M41 28c-8 4-13 10-16 18" stroke={a} strokeWidth="5" strokeLinecap="round" />
        <circle cx="24" cy="52" r="4" fill={a} />
        <circle cx="49" cy="52" r="4" fill={b} />
      </>
    ),
    multi_service: (
      <>
        <rect x="17" y="31" width="45" height="28" rx="5" fill="#fff" stroke={`url(#${id}-main)`} strokeWidth="2" filter={`url(#${id}-shadow)`} />
        <path d="M20 31l5-10h31l5 10H20Z" fill={`url(#${id}-main)`} />
        <rect x="26" y="41" width="8" height="18" rx="2" fill={a} opacity=".9" />
        <rect x="39" y="41" width="16" height="10" rx="2" fill={b} opacity=".88" />
        <path d="M30 26h7M42 26h7M22 59h39" stroke="#0f172a" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round" />
        <path d="M47 17v8M43 21h8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  }

  return (
    <svg viewBox="0 0 78 78" className="h-[74px] w-[74px]" fill="none" aria-hidden="true">
      {common}
      <circle cx="39" cy="39" r="34" fill={`url(#${id}-soft)`} />
      {shapes[type] || shapes.multi_service}
    </svg>
  )
}

export default function CenterOnboarding() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [selected, setSelected] = useState(DEFAULT_CENTER_SPECIALTY)
  const specialty = useMemo(() => CENTER_SPECIALTIES.find(item => item.value === selected), [selected])
  const save = useMutation({
    mutationFn: () => updateCenterSettings({ specialty: selected }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['center-settings'] })
      navigate('/center/services/new', { replace: true })
    },
  })

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <div className="mb-7 text-center">
          <p className="text-sm font-black text-cyan-700">إعداد مركزك</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            اختر <span className="text-blue-600">نوع مركزك</span>
          </h1>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            اختر التخصص الرئيسي لمركزك. يمكنك تعديله لاحقاً من الإعدادات.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CENTER_SPECIALTIES.map(item => {
            const active = selected === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setSelected(item.value)}
                className={`relative min-h-[166px] rounded-lg border bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                  active ? 'border-blue-500 shadow-blue-100 ring-2 ring-blue-100' : 'border-slate-200'
                }`}
              >
                {active && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check size={15} strokeWidth={3} />
                  </span>
                )}
                <span className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border bg-gradient-to-br shadow-inner ring-1 ${toneMap[item.value] || toneMap.multi_service}`}>
                  <SpecialtyIllustration type={item.value} />
                </span>
                <span className="mt-4 block text-lg font-black">{item.label}</span>
                <span className="mx-auto mt-2 block max-w-[180px] text-xs font-bold leading-6 text-slate-500">
                  {item.description}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black text-slate-400">الاختيار الحالي</p>
              <p className="mt-1 text-lg font-black text-slate-950">{specialty?.label}</p>
            </div>
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="h-12 rounded-lg bg-slate-950 px-8 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {save.isPending ? 'جاري الحفظ...' : 'اعتماد نوع المركز'}
            </button>
          </div>
          {save.isError && (
            <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
              تعذر حفظ الاختصاص، حاول مرة أخرى.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
