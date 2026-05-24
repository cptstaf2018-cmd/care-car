import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { getCars, createCar } from '../api/cars'

const fields = [
  ['plate_number', 'رقم اللوحة *'],
  ['owner_name', 'اسم المالك'],
  ['phone', 'الهاتف'],
  ['car_type', 'نوع السيارة'],
]

export default function Cars() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ plate_number: '', owner_name: '', phone: '', car_type: '' })
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
      setForm({ plate_number: '', owner_name: '', phone: '', car_type: '' })
    },
  })

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">إدارة السيارات</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold transition">
          + سيارة جديدة
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم اللوحة..."
        className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 mb-6 outline-none focus:ring-2 focus:ring-blue-500" />

      {showForm && (
        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">إضافة سيارة</h2>
          <div className="grid grid-cols-2 gap-4">
            {fields.map(([k, label]) => (
              <input key={k} placeholder={label} value={form[k]}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                className="bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
            ))}
          </div>
          {mutation.isError && <p className="text-red-400 text-sm mt-2">رقم اللوحة مسجل مسبقاً</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => mutation.mutate(form)} disabled={!form.plate_number}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-semibold">
              حفظ
            </button>
            <button onClick={() => setShowForm(false)} className="bg-slate-700 text-white px-6 py-2 rounded-xl">إلغاء</button>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-700 text-slate-300 text-sm">
            <tr>{['رقم اللوحة', 'المالك', 'الهاتف', 'النوع'].map(h => (
              <th key={h} className="px-4 py-3">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {cars.map(c => (
              <tr key={c.id} className="border-t border-slate-700 text-white hover:bg-slate-700 transition">
                <td className="px-4 py-3 font-mono font-bold text-blue-400">{c.plate_number}</td>
                <td className="px-4 py-3">{c.owner_name || '—'}</td>
                <td className="px-4 py-3">{c.phone || '—'}</td>
                <td className="px-4 py-3">{c.car_type || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && cars.length === 0 && (
          <p className="text-slate-400 text-center py-8">لا توجد سيارات</p>
        )}
      </div>
    </Layout>
  )
}
