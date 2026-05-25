import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { getCars, createCar } from '../api/cars'

const fields = [
  ['plate_number', 'رقم اللوحة *'],
  ['owner_name', 'اسم المالك'],
  ['phone', 'الهاتف'],
  ['car_type', 'نوع السيارة'],
  ['photo_url', 'رابط صورة السيارة من الكاميرا'],
]

export default function Cars() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ plate_number: '', owner_name: '', phone: '', car_type: '', photo_url: '' })
  const qc = useQueryClient()

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['cars', search],
    queryFn: () => getCars(search).then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: createCar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cars'] })
      setShowForm(false)
      setForm({ plate_number: '', owner_name: '', phone: '', car_type: '', photo_url: '' })
    },
  })

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-700">Customer Vehicles</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">السيارات وصور الكاميرا</h2>
          <p className="mt-2 text-sm text-slate-500">كل سجل سيارة يمكن ربطه بصورة ملتقطة من كاميرا IP الخاصة بالمركز.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
          سيارة جديدة
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم اللوحة..."
        className="mb-6 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />

      {showForm && (
        <div className="surface mb-6 rounded-lg p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-950">إضافة سيارة</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map(([k, label]) => (
              <input key={k} placeholder={label} value={form[k]}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            ))}
          </div>
          {mutation.isError && <p className="text-red-600 text-sm mt-3">رقم اللوحة مسجل مسبقاً</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => mutation.mutate(form)} disabled={!form.plate_number}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
              حفظ
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700">إلغاء</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cars.map(c => (
          <article key={c.id} className="surface overflow-hidden rounded-lg">
            <div className="aspect-[16/9] bg-slate-100">
              {c.photo_url ? (
                <img src={c.photo_url} alt={c.plate_number} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">صورة كاميرا المركز</div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xl font-black text-slate-950">{c.plate_number}</p>
                  <p className="mt-1 text-sm text-slate-500">{c.car_type || 'نوع غير محدد'}</p>
                </div>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">متابعة</span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3"><span className="text-slate-500">المالك</span><span className="font-semibold text-slate-900">{c.owner_name || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">واتساب</span><span className="font-semibold text-slate-900">{c.phone || '—'}</span></div>
              </div>
            </div>
          </article>
        ))}
        {!isLoading && cars.length === 0 && (
          <p className="col-span-full text-slate-500 text-center py-8">لا توجد سيارات</p>
        )}
      </div>
    </Layout>
  )
}
