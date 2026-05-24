import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { getInventory, createInventoryItem, updateInventoryItem } from '../api/inventory'

export default function Inventory() {
  const qc = useQueryClient()
  const { data: items = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data),
  })
  const [qtyInputs, setQtyInputs] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ oil_type: '', quantity: '', min_threshold: '10', unit_cost: '' })

  const create = useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); setShowForm(false) },
  })
  const update = useMutation({
    mutationFn: ({ id, data }) => updateInventoryItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">إدارة المخزون</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold">
          + إضافة زيت
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-2xl p-6 mb-6 grid grid-cols-2 gap-4">
          {[['oil_type', 'نوع الزيت *'], ['quantity', 'الكمية (لتر) *'], ['min_threshold', 'الحد الأدنى'], ['unit_cost', 'سعر اللتر']].map(([k, p]) => (
            <input key={k} placeholder={p} value={form[k]} type={k === 'oil_type' ? 'text' : 'number'}
              onChange={e => setForm({ ...form, [k]: e.target.value })}
              className="bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
          ))}
          <div className="col-span-2 flex gap-3">
            <button onClick={() => create.mutate({ ...form, quantity: parseFloat(form.quantity), min_threshold: parseFloat(form.min_threshold) })}
              disabled={!form.oil_type || !form.quantity}
              className="bg-green-600 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-semibold">
              حفظ
            </button>
            <button onClick={() => setShowForm(false)} className="bg-slate-700 text-white px-6 py-2 rounded-xl">إلغاء</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className={`rounded-2xl p-5 ${item.low_stock ? 'bg-red-900/30 border border-red-600' : 'bg-slate-800'}`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-white font-bold text-lg">{item.oil_type}</h3>
              {item.low_stock && <span className="text-red-400 text-xs font-bold bg-red-900/50 px-2 py-1 rounded">⚠️ قليل</span>}
            </div>
            <p className="text-2xl font-bold text-white mb-1">{parseFloat(item.quantity).toLocaleString()} <span className="text-sm text-slate-400">لتر</span></p>
            <p className="text-slate-400 text-sm">الحد الأدنى: {parseFloat(item.min_threshold)} لتر</p>
            {item.unit_cost && <p className="text-slate-400 text-sm">السعر: {parseFloat(item.unit_cost).toLocaleString()} IQD/لتر</p>}
            <input type="number" placeholder="تحديث الكمية..."
              value={qtyInputs[item.id] ?? ''}
              onChange={e => setQtyInputs({...qtyInputs, [item.id]: e.target.value})}
              onBlur={() => {
                const val = qtyInputs[item.id]
                if (val) update.mutate({ id: item.id, data: { quantity: parseFloat(val) } }, {
                  onSuccess: () => setQtyInputs(prev => { const n = {...prev}; delete n[item.id]; return n }),
                  onError: () => alert('فشل تحديث الكمية')
                })
              }}
              className="w-full mt-3 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        ))}
        {items.length === 0 && <p className="col-span-3 text-slate-400 text-center py-8">لا يوجد مخزون</p>}
      </div>
    </Layout>
  )
}
