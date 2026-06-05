import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BatteryCharging, Car, Check, Droplets, Fan, Paintbrush, Store, Wrench } from 'lucide-react'
import { CENTER_SPECIALTIES, DEFAULT_CENTER_SPECIALTY } from '../constants/centerSpecialties'
import { updateCenterSettings } from '../api/settings'

const iconMap = {
  quick_service: Droplets,
  tires: Car,
  electrical: BatteryCharging,
  wash: Car,
  mechanic: Wrench,
  ac: Fan,
  body_paint: Paintbrush,
  multi_service: Store,
}

const toneMap = {
  quick_service: 'from-blue-50 to-cyan-50 border-blue-200 text-blue-700 ring-blue-100',
  tires: 'from-slate-50 to-blue-50 border-slate-200 text-slate-700 ring-slate-100',
  electrical: 'from-amber-50 to-yellow-50 border-amber-200 text-amber-700 ring-amber-100',
  wash: 'from-cyan-50 to-teal-50 border-cyan-200 text-cyan-700 ring-cyan-100',
  mechanic: 'from-rose-50 to-pink-50 border-rose-200 text-rose-700 ring-rose-100',
  ac: 'from-sky-50 to-blue-50 border-sky-200 text-sky-700 ring-sky-100',
  body_paint: 'from-violet-50 to-purple-50 border-violet-200 text-violet-700 ring-violet-100',
  multi_service: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700 ring-emerald-100',
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
            const Icon = iconMap[item.value] || Store
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
                <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${toneMap[item.value] || toneMap.multi_service}`}>
                  <Icon size={30} strokeWidth={2.5} />
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
