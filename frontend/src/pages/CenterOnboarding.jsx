import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { CENTER_SPECIALTIES, DEFAULT_CENTER_SPECIALTY } from '../constants/centerSpecialties'
import { updateCenterSettings } from '../api/settings'

const specialtyArt = {
  quick_service: {
    tone: 'from-cyan-50 via-white to-blue-50 border-cyan-200 shadow-cyan-100',
    halo: 'from-cyan-100 via-white to-blue-100',
    main: '/service-icons-3d/auto-pack/oil-can.webp',
    accent: '/service-icons-3d/auto-pack/service-wrench-car.webp',
  },
  tires: {
    tone: 'from-slate-50 via-white to-blue-50 border-slate-200 shadow-slate-100',
    halo: 'from-slate-100 via-white to-blue-100',
    main: '/service-icons-3d/auto-pack/tire-sale-exact.webp',
    accent: '/service-icons-3d/auto-pack/wheel-balancing-exact.webp',
  },
  electrical: {
    tone: 'from-amber-50 via-white to-yellow-50 border-amber-200 shadow-amber-100',
    halo: 'from-amber-100 via-white to-yellow-100',
    main: '/service-icons-3d/auto-pack/battery.webp',
    accent: '/service-icons-3d/auto-pack/computer-scan.webp',
  },
  wash: {
    tone: 'from-cyan-50 via-white to-teal-50 border-cyan-200 shadow-cyan-100',
    halo: 'from-cyan-100 via-white to-teal-100',
    main: '/service-icons-3d/auto-pack/car-wash-full-exact.webp',
    accent: '/service-icons-3d/auto-pack/disinfect-spray.webp',
  },
  mechanic: {
    tone: 'from-rose-50 via-white to-orange-50 border-rose-200 shadow-rose-100',
    halo: 'from-rose-100 via-white to-orange-100',
    main: '/service-icons-3d/auto-pack/service-wrench-car.webp',
    accent: '/service-icons-3d/auto-pack/shock.webp',
  },
  ac: {
    tone: 'from-sky-50 via-white to-blue-50 border-sky-200 shadow-sky-100',
    halo: 'from-sky-100 via-white to-blue-100',
    main: '/service-icons-3d/auto-pack/ac-gas-exact.webp',
    accent: '/service-icons-3d/auto-pack/ac-filter.webp',
  },
  body_paint: {
    tone: 'from-violet-50 via-white to-fuchsia-50 border-violet-200 shadow-violet-100',
    halo: 'from-violet-100 via-white to-fuchsia-100',
    main: '/service-icons-3d/auto-pack/paint-spray.webp',
    accent: '/service-icons-3d/auto-pack/dent-repair.webp',
  },
  multi_service: {
    tone: 'from-emerald-50 via-white to-teal-50 border-emerald-200 shadow-emerald-100',
    halo: 'from-emerald-100 via-white to-teal-100',
    main: '/service-icons-3d/auto-pack/inspection.webp',
    accent: '/service-icons-3d/auto-pack/service-wrench-car.webp',
  },
}

function SpecialtyArt({ type, active }) {
  const art = specialtyArt[type] || specialtyArt.multi_service
  return (
    <span className={`relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${art.halo} shadow-inner ring-1 ring-white/80`}>
      <span className="absolute inset-2 rounded-full bg-white/72 shadow-[inset_0_1px_8px_rgba(15,23,42,0.06)]" />
      <img
        src={art.main}
        alt=""
        className={`relative z-10 h-[72px] w-[72px] object-contain drop-shadow-[0_14px_16px_rgba(15,23,42,0.22)] transition duration-200 ${active ? 'scale-105' : 'group-hover:scale-105'}`}
      />
      {art.accent && (
        <span className="absolute -bottom-1 -left-1 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-slate-100">
          <img src={art.accent} alt="" className="h-8 w-8 object-contain" />
        </span>
      )}
    </span>
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
            const art = specialtyArt[item.value] || specialtyArt.multi_service
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setSelected(item.value)}
                className={`group relative min-h-[190px] overflow-hidden rounded-lg border bg-gradient-to-br p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl ${
                  active ? `${art.tone} border-blue-500 shadow-blue-100 ring-2 ring-blue-100` : `${art.tone} hover:border-slate-300`
                }`}
              >
                {active && (
                  <span className="absolute right-3 top-3 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                    <Check size={16} strokeWidth={3} />
                  </span>
                )}
                <SpecialtyArt type={item.value} active={active} />
                <span className="mt-4 block text-lg font-black">{item.label}</span>
                <span className="mx-auto mt-2 block max-w-[190px] text-xs font-bold leading-6 text-slate-500">
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
