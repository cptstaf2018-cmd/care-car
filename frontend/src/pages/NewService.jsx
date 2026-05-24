import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { getCars } from '../api/cars'
import { createService } from '../api/services'

const OIL_TYPES = ['15W40', '10W30', '5W30', '5W20', '0W20']

export default function NewService() {
  const [search, setSearch] = useState('')
  const [selectedCar, setSelectedCar] = useState(null)
  const [form, setForm] = useState({ oil_type: '15W40', amount: '', discount: '0', mileage: '', notes: '' })
  const [result, setResult] = useState(null)

  const { data: cars = [] } = useQuery({
    queryKey: ['cars', search],
    queryFn: () => getCars(search).then(r => r.data),
    enabled: search.length > 1,
  })

  const mutation = useMutation({
    mutationFn: createService,
    onSuccess: (res) => setResult(res.data),
  })

  const netAmount = (parseFloat(form.amount) || 0) - (parseFloat(form.discount) || 0)

  if (result) return (
    <Layout>
      <div className="max-w-md mx-auto bg-slate-800 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-white mb-4">تمت الخدمة</h2>
        <div className="bg-slate-700 rounded-xl p-4 mb-6 text-right space-y-2">
          <p className="text-slate-300">رقم الفاتورة: <span className="text-white font-bold">#{result.invoice_id}</span></p>
          <p className="text-slate-300">المبلغ: <span className="text-green-400 font-bold">{result.amount?.toLocaleString()} IQD</span></p>
          <p className="text-slate-300">الحالة: <span className={result.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}>{result.status === 'paid' ? 'مدفوع' : 'غير مدفوع'}</span></p>
        </div>
        <button onClick={() => { setResult(null); setSelectedCar(null); setSearch(''); setForm({ oil_type: '15W40', amount: '', discount: '0', mileage: '', notes: '' }) }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold">
          خدمة جديدة
        </button>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-white mb-6">خدمة جديدة — الكاشير</h1>
      <div className="max-w-xl space-y-4">
        {!selectedCar ? (
          <>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن السيارة برقم اللوحة..."
              className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="space-y-2">
              {cars.map(c => (
                <div key={c.id} onClick={() => setSelectedCar(c)}
                  className="bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-3 cursor-pointer flex justify-between items-center">
                  <span className="font-bold text-blue-400">{c.plate_number}</span>
                  <span className="text-slate-400 text-sm">{c.owner_name} {c.car_type ? `— ${c.car_type}` : ''}</span>
                </div>
              ))}
              {search.length > 1 && cars.length === 0 && (
                <p className="text-slate-400 text-center py-4">لا توجد نتائج</p>
              )}
            </div>
          </>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700">
              <div>
                <span className="font-bold text-blue-400 text-lg">{selectedCar.plate_number}</span>
                <span className="text-slate-400 text-sm mr-2">{selectedCar.owner_name}</span>
              </div>
              <button onClick={() => setSelectedCar(null)} className="text-slate-400 hover:text-red-400 text-sm">تغيير</button>
            </div>
            <select value={form.oil_type} onChange={e => setForm({ ...form, oil_type: e.target.value })}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 outline-none">
              {OIL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            {[['amount', 'المبلغ (IQD) *', 'number'], ['discount', 'الخصم (IQD)', 'number'], ['mileage', 'عداد المسافة (كم)', 'number'], ['notes', 'ملاحظات', 'text']].map(([k, p, t]) => (
              <input key={k} type={t} placeholder={p} value={form[k]}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <div>
                <span className="text-slate-400 text-sm">الصافي: </span>
                <span className="text-white font-bold text-xl">{netAmount.toLocaleString()} IQD</span>
              </div>
              <button onClick={() => mutation.mutate({ car_id: selectedCar.id, ...form, amount: parseFloat(form.amount), discount: parseFloat(form.discount) || 0, mileage: form.mileage ? parseFloat(form.mileage) : null })}
                disabled={!form.amount || mutation.isPending}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold text-lg transition">
                {mutation.isPending ? 'جاري...' : 'حفظ الخدمة'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
